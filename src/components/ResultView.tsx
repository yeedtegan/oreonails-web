"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "./CartContext";
import {
  ArrowLeftIcon,
  CartIcon,
  CloseIcon,
  ExpandIcon,
  GalleryIcon,
  HeartIcon,
  SendIcon,
  ShareIcon,
  SparkleIcon,
} from "./icons";
import { DESIGN_PRICE, MAX_PROMPT, REFINEMENTS } from "@/lib/constants";
import { GenerationError, startDesign, waitForDesign } from "@/lib/generate";
import type { StoredMessage, StoredVersion } from "@/lib/designStore";
import { uid } from "@/lib/uid";

export type DesignVersion = StoredVersion & { url: string };
export type Message = StoredMessage;

/** one generated design: all its versions + the edit chat (saved in the browser) */
export type DesignSession = {
  id: string;
  createdAt: number;
  versions: DesignVersion[];
  messages: Message[];
};

export type SessionUpdate = (fn: (s: DesignSession) => DesignSession) => void;

type Props = {
  session: DesignSession;
  /** applies a change to this session — also after the customer left this screen */
  update: SessionUpdate;
  /** version to show first (e.g. opened from the cart); defaults to the newest */
  initialVersionId?: string;
  onNewDesign: () => void;
  onNewPhoto: () => void;
};

const price = `$${DESIGN_PRICE.toFixed(2)}`;
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** edits still waiting for the server (by pending message id), across screen changes */
const inFlight = new Set<string>();
export const isEditInFlight = (messageId: string) => inFlight.has(messageId);

const errorText = (err: unknown) => (err instanceof GenerationError ? err.message : "Something went wrong. Please try again.");
const isRetryable = (err: unknown) => !(err instanceof GenerationError) || err.retryable;

/**
 * Waits for the server job of a pending edit message and writes the outcome into the session.
 * Used right after sending, and again when a design with a running edit is reopened
 * (the customer left the page and came back).
 */
export async function followEdit(msg: Message & { jobId: string }, update: SessionUpdate) {
  if (inFlight.has(msg.id)) return;
  inFlight.add(msg.id);
  try {
    const { id, blob } = await waitForDesign(msg.jobId);
    const version: DesignVersion = { id, blob, url: URL.createObjectURL(blob), instruction: msg.retry?.text ?? "", favorite: false };
    update((s) => ({
      ...s,
      // the same job could be collected twice (two tabs): keep one copy
      versions: s.versions.some((v) => v.id === id) ? s.versions : [...s.versions, version],
      messages: s.messages.map((m) =>
        m.id === msg.id
          ? { ...m, status: undefined, retry: undefined, jobId: undefined, time: Date.now(), text: "Here's your updated design! ✨ What else would you like to adjust?" }
          : m,
      ),
    }));
  } catch (err) {
    update((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === msg.id
          ? { ...m, status: "error", jobId: undefined, time: Date.now(), text: errorText(err), retry: isRetryable(err) ? m.retry : undefined }
          : m,
      ),
    }));
  } finally {
    inFlight.delete(msg.id);
  }
}

export const greeting = (): Message => ({
  id: uid(),
  role: "assistant",
  time: Date.now(),
  text: "Your custom design is ready! ✨ Tell me what you'd like to change — for example “Add more pearls and a touch of glitter”.",
});

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 lg:h-11 lg:w-11"
    >
      {children}
    </button>
  );
}

export default function ResultView({ session, update, initialVersionId, onNewDesign, onNewPhoto }: Props) {
  const cart = useCart();
  const { versions, messages } = session;
  const [selectedId, setSelectedId] = useState(
    () => versions.find((v) => v.id === initialVersionId)?.id ?? versions[versions.length - 1].id,
  );
  const [input, setInput] = useState("");
  // an edit is running for this design (possibly started before the screen was reopened)
  const working = messages.some((m) => m.status === "pending");

  // a finished edit adds a version → show it (also when it finished while the screen was closed)
  const [versionCount, setVersionCount] = useState(versions.length);
  if (versions.length !== versionCount) {
    setVersionCount(versions.length);
    if (versions.length > versionCount) setSelectedId(versions[versions.length - 1].id);
  }
  const [lightbox, setLightbox] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // bring a new chat message into view (not on open: the design comes first)
  const seenMessages = useRef(messages.length);
  useEffect(() => {
    if (messages.length > seenMessages.current) {
      chatRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    seenMessages.current = messages.length;
  }, [messages]);

  const selectedIndex = Math.max(0, versions.findIndex((v) => v.id === selectedId));
  const selected = versions[selectedIndex];
  const inCart = cart.has(selected.id);

  function showToast(text: string) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function addRefinement(text: string) {
    setInput((cur) => {
      const base = cur.trim().replace(/[,.]$/, "");
      const next = base ? `${base}, ${text}` : text.charAt(0).toUpperCase() + text.slice(1);
      return next.slice(0, MAX_PROMPT);
    });
    inputRef.current?.focus();
  }

  async function edit(text: string, baseId: string) {
    const base = versions.find((v) => v.id === baseId) ?? selected;
    const pendingId = uid();
    const resend = { text, baseId: base.id };
    inFlight.add(pendingId); // until the job id is saved: a reopen must not call it interrupted
    // keeps `retry` so the edit can be resent if it fails or is interrupted
    const pending: Message = {
      id: pendingId,
      role: "assistant",
      time: Date.now(),
      status: "pending",
      retry: resend,
      text: "Updating your design… this usually takes 2–3 minutes.",
    };
    update((s) => ({ ...s, messages: [...s.messages, pending] }));
    let jobId: string;
    try {
      jobId = await startDesign({ mode: "edit", image: base.blob, prompt: text });
    } catch (err) {
      update((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === pendingId ? { ...m, status: "error", time: Date.now(), text: errorText(err), retry: isRetryable(err) ? resend : undefined } : m,
        ),
      }));
      return;
    } finally {
      inFlight.delete(pendingId);
    }
    // saved with the session → after leaving the page, coming back picks this job up again
    update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === pendingId ? { ...m, jobId } : m)) }));
    await followEdit({ ...pending, jobId }, update);
  }

  function onSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || working) return;
    update((s) => ({ ...s, messages: [...s.messages, { id: uid(), role: "user", time: Date.now(), text }] }));
    setInput("");
    edit(text, selected.id);
  }

  function retry(msg: Message) {
    if (!msg.retry || working) return;
    update((s) => ({ ...s, messages: s.messages.filter((x) => x.id !== msg.id) }));
    edit(msg.retry.text, msg.retry.baseId);
  }

  function toggleFavorite() {
    update((s) => ({ ...s, versions: s.versions.map((v) => (v.id === selected.id ? { ...v, favorite: !v.favorite } : v)) }));
  }

  async function share() {
    const file = new File([selected.blob], `oreo-nails-design.png`, { type: selected.blob.type || "image/png" });
    const data = { files: [file], title: "My Oreo Nails design", text: "Look at my custom nail design from Oreo Nails!" };
    try {
      if (navigator.canShare?.(data)) {
        await navigator.share(data);
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // customer closed the sheet
    }
    // no native sharing (most desktops): save the image instead
    const a = document.createElement("a");
    a.href = selected.url;
    a.download = file.name;
    a.click();
    showToast("Image saved — share it anywhere!");
  }

  function addToCart() {
    if (inCart) return;
    cart.add({ id: selected.id, sessionId: session.id, blob: selected.blob, price: DESIGN_PRICE });
    showToast("Added to cart");
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-[640px] px-4 pb-28 sm:px-6">
      {/* ───────────── Result + history ───────────── */}
      <section aria-label="Your nail design">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onNewDesign}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-base font-semibold text-cocoa-soft transition hover:bg-white/60 hover:text-cocoa"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            New design
          </button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-cocoa shadow-[0_20px_44px_-22px_rgba(90,50,40,0.75)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
          <img src={selected.url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
          <img
            src={selected.url}
            alt={selectedIndex === 0 ? "Your generated nail design" : `Updated nail design: ${selected.instruction}`}
            className={`absolute inset-0 h-full w-full object-contain transition duration-500 ${working ? "opacity-70 blur-[2px]" : ""}`}
          />

          <div className="absolute top-3 right-3 flex gap-2 lg:top-4 lg:right-4">
            <RoundButton label={selected.favorite ? "Remove from favorites" : "Add to favorites"} onClick={toggleFavorite}>
              <HeartIcon filled={selected.favorite} className={`h-5 w-5 ${selected.favorite ? "text-rose-400" : ""}`} />
            </RoundButton>
            <RoundButton label="Share" onClick={share}>
              <ShareIcon className="h-5 w-5" />
            </RoundButton>
          </div>

          {working && (
            <div className="absolute inset-0 grid place-items-center" role="status">
              <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-5 py-3 shadow-lg backdrop-blur">
                <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold-dark" />
                <span className="font-serif text-lg text-cocoa">Updating your design…</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={addToCart}
            disabled={inCart}
            className="btn-brown absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border-2 border-white/80 px-5 py-2.5 font-semibold whitespace-nowrap text-white transition active:scale-[0.98] disabled:cursor-default lg:bottom-4 lg:px-6"
          >
            <CartIcon className="h-6 w-6" />
            <span className="text-[17px]">{inCart ? "In Cart ✓" : "Add to Cart"}</span>
            <span className="h-6 w-px bg-white/50" aria-hidden />
            <span className="text-[17px]">{price}</span>
          </button>

          <div className="absolute right-3 bottom-3 lg:right-4 lg:bottom-4">
            <RoundButton label="View full screen" onClick={() => setLightbox(true)}>
              <ExpandIcon className="h-5 w-5" />
            </RoundButton>
          </div>
        </div>

        {/* history */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-cocoa">Design History</h2>
            {versions.length > 4 && (
              <button type="button" onClick={() => setViewAll((v) => !v)} className="text-[15px] font-semibold text-cocoa">
                {viewAll ? "Show less" : "View All ›"}
              </button>
            )}
          </div>
          <ul className={`mt-2 gap-2.5 ${viewAll ? "grid grid-cols-4" : "flex overflow-x-auto pb-1"}`}>
            {[...versions].reverse().map((v) => {
              const n = versions.indexOf(v) + 1;
              const active = v.id === selected.id;
              return (
                <li key={v.id} className={viewAll ? "" : "w-[calc(25%-0.47rem)] shrink-0"}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    aria-pressed={active}
                    aria-label={`Design ${n}${n === 1 ? " (original)" : `: ${v.instruction}`}`}
                    title={n === 1 ? "Original design" : v.instruction}
                    className={`relative block aspect-[4/3] w-full overflow-hidden rounded-xl border-[3px] shadow-md transition ${
                      active ? "border-[#5a3523]" : "border-white hover:-translate-y-0.5"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
                    <img src={v.url} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded-full bg-black/45 px-1.5 text-[11px] font-bold text-white">v{n}</span>
                    {v.favorite && <HeartIcon filled className="absolute top-1 right-1 h-4 w-4 text-rose-400 drop-shadow" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───────────── Refine with AI ───────────── */}
      <section aria-label="Refine your design" className="mt-5">
        <div className="flex flex-col">
          <h2 className="text-[17px] font-bold text-cocoa">Try Adding More Details</h2>
          <div className="-mx-4 mt-2 grid auto-cols-max grid-flow-col grid-rows-2 gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6">
            {REFINEMENTS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => addRefinement(r.text)}
                className="chip flex items-center gap-1 rounded-full px-2.5 py-1.5 font-sans text-[12.5px] font-medium text-cocoa transition hover:-translate-y-0.5 hover:border-gold"
              >
                <span aria-hidden>{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>

          <div
            ref={chatRef}
            className="mt-4 flex scroll-mb-28 flex-col gap-3 [&>*]:scroll-mb-28"
            aria-live="polite"
            aria-label="Chat with the Oreo Nails assistant"
          >
            {messages.map((m) =>
              m.role === "assistant" ? (
                <div key={m.id} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f3e3d6] text-cocoa" aria-hidden>
                    <SparkleIcon className="h-6 w-6" />
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl rounded-tl-md px-4 py-2.5 text-[16px] leading-snug ${
                      m.status === "error" ? "bg-wine/10 text-wine" : "bg-white/85 text-cocoa shadow-sm"
                    }`}
                  >
                    {m.status === "pending" && (
                      <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gold/30 border-t-gold-dark align-[-2px]" />
                    )}
                    {m.text}
                    {m.retry && (
                      <button
                        type="button"
                        onClick={() => retry(m)}
                        disabled={working}
                        className="btn-gold mt-2 block rounded-full px-4 py-1 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                  <time className="mt-1 ml-auto shrink-0 text-xs text-cocoa-soft">{fmtTime(m.time)}</time>
                </div>
              ) : (
                <div key={m.id} className="flex items-start justify-end gap-3">
                  <time className="mt-1 shrink-0 text-xs text-cocoa-soft">{fmtTime(m.time)}</time>
                  <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-[#74482f] px-4 py-2.5 text-[16px] leading-snug text-white">
                    {m.text}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* chat input: always fixed to the bottom, aligned with the 640px column */}
          <form
            onSubmit={onSend}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-gold/20 bg-[#f6eee6]/95 px-[max(1rem,calc((100%-640px)/2+1rem))] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-[max(1.5rem,calc((100%-640px)/2+1.5rem))]"
          >
            <button
              type="button"
              onClick={onNewPhoto}
              aria-label="Use a different hand photo"
              title="Use a different hand photo"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-cocoa transition hover:bg-white/70"
            >
              <GalleryIcon className="h-8 w-8" />
            </button>
            <label htmlFor="refine-input" className="sr-only">
              Describe a change to your design
            </label>
            <input
              id="refine-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_PROMPT}
              autoComplete="off"
              placeholder="Add more glitter and a small bow on ring finger"
              className="h-12 min-w-0 flex-1 rounded-full border border-gold/25 bg-white px-5 text-[16px] text-cocoa shadow-sm outline-none transition placeholder:text-cocoa-soft/70 focus:border-gold focus:ring-4 focus:ring-gold/15"
            />
            <button
              type="submit"
              disabled={!input.trim() || working}
              aria-label="Send"
              className="btn-brown grid h-12 w-14 shrink-0 place-items-center rounded-xl text-white transition active:scale-95 disabled:opacity-50"
            >
              {working ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <SendIcon className="h-6 w-6" />
              )}
            </button>
          </form>
        </div>
      </section>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nail design, full screen"
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => e.key === "Escape" && setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
          <img src={selected.url} alt="Your nail design" className="max-h-full max-w-full rounded-xl object-contain" />
          <button
            type="button"
            autoFocus
            onClick={() => setLightbox(false)}
            aria-label="Close full screen"
            className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-cocoa px-5 py-2.5 text-[15px] font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
