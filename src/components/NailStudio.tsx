"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import type { NailStyleId } from "./NailThumb";
import StudioView from "./StudioView";
import type { GenError } from "./PhotoStage";
import ResultView, { followEdit, greeting, isEditInFlight, type DesignSession, type SessionUpdate } from "./ResultView";
import { useCart } from "./CartContext";
import { GenerationError, startDesign, waitForDesign } from "@/lib/generate";
import {
  getOpenSessionId,
  getPendingCreate,
  getSession,
  saveSession,
  setOpenSessionId,
  setPendingCreate,
  type PendingCreate,
  type StoredSession,
} from "@/lib/designStore";
import { checkHandPhoto, warmUpHandDetector, type HandCheck } from "@/lib/handDetector";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_PROMPT, lineHasStyle, styleLine } from "@/lib/constants";
import { uid } from "@/lib/uid";

function toStored(s: DesignSession): StoredSession {
  return {
    id: s.id,
    createdAt: s.createdAt,
    updatedAt: Date.now(),
    versions: s.versions.map(({ id, blob, instruction, favorite }) => ({ id, blob, instruction, favorite })),
    messages: s.messages,
  };
}

function fromStored(s: StoredSession): DesignSession {
  return {
    id: s.id,
    createdAt: s.createdAt,
    versions: s.versions.map((v) => ({ ...v, url: URL.createObjectURL(v.blob) })),
    // an edit that never got a server job (page closed while sending) → offer to resend it.
    // Edits with a job id stay pending: the studio picks the job up again (resumeEdits).
    messages: s.messages.map((m) =>
      m.status === "pending" && !m.jobId && !isEditInFlight(m.id)
        ? { ...m, status: "error", text: "This change was interrupted before it finished. Please try again." }
        : m,
    ),
  };
}

const revokeUrls = (s: DesignSession) => s.versions.forEach((v) => URL.revokeObjectURL(v.url));

export default function NailStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [styles, setStyles] = useState<NailStyleId[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // the open design (all versions + edit chat); set = show the result screen.
  // Every change is saved in the browser so it can be reopened later (e.g. from the cart).
  const [session, setSession] = useState<DesignSession | null>(null);
  const sessionRef = useRef<DesignSession | null>(null);
  // remounts the result screen when a design is (re)opened, starting on this version
  const [view, setView] = useState<{ key: number; versionId?: string }>({ key: 0 });
  const { openRequest } = useCart();
  const [handCheck, setHandCheck] = useState<HandCheck>({ status: "idle" });
  const [genError, setGenError] = useState<GenError | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // ignore late answers (hand check / generation) for a photo that was replaced
  const photoToken = useRef(0);

  /** switch the result screen to another design (null = back to the studio) */
  const showSession = useCallback((next: DesignSession | null, versionId?: string) => {
    const prev = sessionRef.current;
    sessionRef.current = next;
    setSession(next);
    setView((v) => ({ key: v.key + 1, versionId }));
    setOpenSessionId(next?.id); // reopened when the customer comes back to the page
    // the old screen unmounts in this render; free its images afterwards
    if (prev && prev.id !== next?.id) setTimeout(() => revokeUrls(prev));
    window.scrollTo({ top: 0 });
  }, []);

  // save every change of the open design
  useEffect(() => {
    if (session) saveSession(toStored(session));
  }, [session]);

  /** change a design: on screen if it is open, otherwise straight in storage */
  const updateSession = useCallback((id: string, fn: (s: DesignSession) => DesignSession) => {
    const applyOnScreen = () => {
      const cur = sessionRef.current;
      if (cur?.id !== id) return false;
      const next = fn(cur);
      sessionRef.current = next;
      setSession(next);
      return true;
    };
    if (applyOnScreen()) return;
    getSession(id).then((stored) => {
      if (!stored || applyOnScreen()) return; // (reopened meanwhile → on screen)
      // keep raw messages: a "pending" edit here is still running
      const s = fn({ ...fromStored(stored), messages: stored.messages });
      saveSession(toStored(s));
      revokeUrls(s);
    });
  }, []);

  /** keep waiting for edits that were still generating when this design was last on screen */
  const resumeEdits = useCallback(
    (s: DesignSession) => {
      for (const m of s.messages) {
        if (m.status === "pending" && m.jobId) followEdit({ ...m, jobId: m.jobId }, (fn) => updateSession(s.id, fn));
      }
    },
    [updateSession],
  );

  const sessionId = session?.id;
  const update = useCallback<SessionUpdate>(
    (fn) => {
      if (sessionId) updateSession(sessionId, fn);
    },
    [sessionId, updateSession],
  );

  // a cart item was clicked → reopen its design with the full edit chat
  useEffect(() => {
    if (!openRequest) return;
    let cancelled = false;
    const { sessionId: id, versionId, fallback } = openRequest;
    const cur = sessionRef.current;
    if (cur?.id === id) {
      showSession(cur, versionId);
      return;
    }
    getSession(id).then((stored) => {
      if (cancelled) return;
      // no saved session (e.g. storage was cleared): open just the design from the cart
      const next: DesignSession = stored
        ? fromStored(stored)
        : {
            id,
            createdAt: Date.now(),
            versions: [{ id: versionId, blob: fallback, url: URL.createObjectURL(fallback), instruction: "", favorite: false }],
            messages: [greeting()],
          };
      showSession(next, versionId);
      resumeEdits(next);
    });
    return () => {
      cancelled = true;
    };
  }, [openRequest, showSession, resumeEdits]);

  /** back to the studio; the design stays saved */
  function newDesign() {
    showSession(null);
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function focusPrompt() {
    textareaRef.current?.focus();
  }

  // revoke the last object URL when the component unmounts
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  function setPhoto(f: File | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = f ? URL.createObjectURL(f) : null;
    setFile(f);
    setPreviewUrl(urlRef.current);
    setLoading(false);
    setGenError(null);

    const token = ++photoToken.current;
    if (!f) {
      setHandCheck({ status: "idle" });
      return;
    }
    setHandCheck({ status: "checking" });
    checkHandPhoto(f).then((check) => {
      if (photoToken.current === token) setHandCheck(check);
    });
  }

  function openPicker() {
    warmUpHandDetector().catch(() => {});
    inputRef.current?.click();
  }

  function openCamera() {
    warmUpHandDetector().catch(() => {});
    cameraRef.current?.click();
  }

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("That photo is larger than 10 MB — please choose a smaller one.");
      return;
    }
    setError(null);
    setPhoto(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  function toggleStyle(id: NailStyleId) {
    // Multi-select: each picked style adds its own "- …" line to the description;
    // un-picking it removes every line that still contains the style's prompt,
    // even if the customer deleted the "- " (anything else they typed stays).
    const selected = styles.includes(id);
    setStyles(selected ? styles.filter((s) => s !== id) : [...styles, id]);
    setPrompt((text) => {
      const line = styleLine(id);
      const lines = text.split("\n");
      if (selected) {
        return lines
          .filter((l) => !lineHasStyle(l, id))
          .join("\n")
          .replace(/\s+$/, "");
      }
      // already in the description (e.g. typed back by hand) → don't add it twice
      if (lines.some((l) => lineHasStyle(l, id))) return text;
      const body = text.replace(/\s+$/, "");
      return (body ? `${body}\n${line}` : line).slice(0, MAX_PROMPT);
    });
  }



  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Upload a photo of your hand first so we can fit the design to your nails.");
      return;
    }
    if (handCheck.status === "checking") {
      setError("Still checking your photo — one moment please.");
      return;
    }
    if (handCheck.status === "fail") {
      setError(handCheck.message);
      return;
    }
    if (!prompt.trim() && styles.length === 0) {
      setError("Describe your design or pick at least one nail style.");
      focusPrompt();
      return;
    }
    setError(null);
    setGenError(null);
    setLoading(true);
    const token = photoToken.current;
    let jobId: string;
    try {
      jobId = await startDesign({ mode: "create", image: file, prompt, styles });
    } catch (err) {
      if (photoToken.current === token) {
        showGenError(err);
        setLoading(false);
      }
      return;
    }
    const pending: PendingCreate = { jobId, photo: file, photoName: file.name, prompt, styles, startedAt: Date.now() };
    setPendingCreate(pending); // lets the studio pick the job up again after leaving the page
    await finishCreate(pending, token);
  }

  function showGenError(err: unknown) {
    setGenError(
      err instanceof GenerationError
        ? { message: err.message, retryable: err.retryable }
        : { message: "Something went wrong. Please try again.", retryable: true },
    );
  }

  /** waits for the first design's job, then opens the result screen */
  async function finishCreate(pending: PendingCreate, token: number) {
    try {
      const { id, blob } = await waitForDesign(pending.jobId);
      if (photoToken.current !== token) return; // photo changed meanwhile
      const instruction = [pending.prompt.trim(), ...pending.styles].filter(Boolean).join(", ");
      showSession({
        id: uid(),
        createdAt: Date.now(),
        versions: [{ id, blob, url: URL.createObjectURL(blob), instruction, favorite: false }],
        messages: [greeting()],
      });
    } catch (err) {
      if (photoToken.current === token) showGenError(err);
    } finally {
      setPendingCreate(undefined);
      if (photoToken.current === token) setLoading(false);
    }
  }

  // coming back to the page: reopen the design that was on screen, and keep waiting for
  // a first design that was still generating
  useEffect(() => {
    let cancelled = false;
    Promise.all([getOpenSessionId(), getPendingCreate()]).then(async ([openId, pending]) => {
      if (cancelled) return;
      if (pending) {
        const photo = new File([pending.photo], pending.photoName, { type: pending.photo.type });
        setPhoto(photo);
        setPrompt(pending.prompt);
        setStyles(pending.styles as NailStyleId[]);
        setLoading(true);
        finishCreate(pending, photoToken.current);
      }
      if (!openId) return;
      const stored = await getSession(openId);
      if (cancelled || !stored || sessionRef.current) return;
      const restored = fromStored(stored);
      showSession(restored);
      resumeEdits(restored);
    });
    return () => {
      cancelled = true;
    };
    // run once on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry() {
    formRef.current?.requestSubmit();
  }

  return (
    <>
    <form ref={formRef} id="studio" onSubmit={onSubmit}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload hand photo"
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {/* opens the camera directly on phones */}
      <input
        ref={cameraRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label="Take hand photo"
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!session && (
        <StudioView
          file={file}
          previewUrl={previewUrl}
          dragging={dragging}
          setDragging={setDragging}
          onDrop={onDrop}
          openPicker={openPicker}
          openCamera={openCamera}
          removePhoto={() => setPhoto(null)}
          prompt={prompt}
          setPrompt={setPrompt}
          textareaRef={textareaRef}
          styles={styles}
          toggleStyle={toggleStyle}
          showMore={showMore}
          setShowMore={setShowMore}
          error={error}
          loading={loading}
          handCheck={handCheck}
          genError={genError}
          onRetry={retry}
        />
      )}
    </form>

    {session && (
      <ResultView
        key={view.key}
        session={session}
        update={update}
        initialVersionId={view.versionId}
        onNewDesign={newDesign}
        onNewPhoto={() => {
          newDesign();
          openPicker();
        }}
      />
    )}
    </>
  );
}
