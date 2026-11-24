"use client";

import { useEffect, useRef, useState, type ComponentType, type FormEvent, type SVGProps } from "react";
import { useCart } from "./CartContext";
import {
  ArrowLeftIcon,
  CameraIcon,
  CartIcon,
  ChatIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  ExpandIcon,
  GalleryIcon,
  HeartIcon,
  HistoryIcon,
  PencilIcon,
  SendIcon,
  ShareIcon,
  SparkleIcon,
  UserIcon,
} from "./icons";
import { DESIGN_PRICE, MAX_HISTORY, MAX_PROMPT, QUICK_ADD, QUICK_ADD_CATEGORIES, type QuickAddCategory } from "@/lib/constants";
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

/**
 * What was asked for to get to `base`, oldest first (first prompt, then each edit) — sent with an edit so a
 * nail length asked for earlier is kept. Older saved versions have no baseId: the one before them is assumed.
 */
function requestsLeadingTo(versions: DesignVersion[], base: DesignVersion): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let v: DesignVersion | undefined = base; v && !seen.has(v.id); ) {
    seen.add(v.id);
    if (v.instruction) out.unshift(v.instruction);
    const i = versions.indexOf(v);
    v = v.baseId ? versions.find((x) => x.id === v!.baseId) : i > 0 ? versions[i - 1] : undefined;
  }
  return out.slice(-MAX_HISTORY);
}

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

/** "Today", "Yesterday" or "Nov 19, 2026" */
function dayLabel(t: number) {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(new Date(t))) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Tab = "chat" | "quick" | "history";
/** Quick Add is its own column from 1180px — its tab is only shown below that */
const TABS: { id: Tab; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; className?: string }[] = [
  { id: "chat", label: "Chat", icon: ChatIcon },
  { id: "quick", label: "Quick Add", icon: SparkleIcon, className: "nav:hidden" },
  { id: "history", label: "History", icon: GalleryIcon },
];

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
    const version: DesignVersion = {
      id,
      blob,
      url: URL.createObjectURL(blob),
      instruction: msg.retry?.text ?? "",
      baseId: msg.retry?.baseId,
      favorite: false,
      createdAt: Date.now(),
    };
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
  /** which panel shows in the middle column (phones: under the design) */
  const [tab, setTab] = useState<Tab>("chat");
  /** Quick Add details picked for the next "Generate" */
  const [picked, setPicked] = useState<string[]>([]);
  const [filter, setFilter] = useState<QuickAddCategory | "all">("all");
  const [toast, setToast] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // the chat scrolls in its own box: start at the latest message, follow new ones
  // (scrolling the box itself, never the page — on phones the page is fixed)
  const seenMessages = useRef(-1);
  useEffect(() => {
    const box = chatRef.current;
    if (box && messages.length !== seenMessages.current) {
      box.scrollTo({ top: box.scrollHeight, behavior: seenMessages.current < 0 ? "auto" : "smooth" });
    }
    seenMessages.current = messages.length;
  }, [messages]);

  /**
   * Phones (< 820px) — "app mode": the page doesn't scroll; the design stays on top and only the panel under it
   * scrolls. While the on-screen keyboard is up the design is hidden (back when the keyboard closes).
   */
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 819.98px)");
    const touch = window.matchMedia("(pointer: coarse)");
    const root = document.documentElement;
    const vv = window.visualViewport;
    // the tallest viewport seen at this width = the screen without a keyboard (Android may shrink innerHeight too)
    let full = 0;
    let fullWidth = 0;
    let focusedAt = 0;
    let lastH = "";
    const apply = () => {
      const app = phone.matches;
      document.body.classList.toggle("studio-app", app);
      const h = vv ? vv.height : window.innerHeight;
      const px = `${Math.round(h)}px`;
      if (px !== lastH) root.style.setProperty("--vvh", (lastH = px)); // re-layout only when the height changes
      root.style.setProperty("--vvt", `${app && vv ? Math.max(0, Math.round(vv.offsetTop)) : 0}px`);
      if (window.innerWidth !== fullWidth) {
        fullWidth = window.innerWidth;
        full = 0;
      }
      full = Math.max(full, h, window.innerHeight);
      const el = document.activeElement;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && touch.matches;
      // the focused field only counts right after focusing (before the viewport has shrunk): a keyboard closed
      // with the back gesture leaves the field focused, and the design must come back then
      const opening = typing && Date.now() - focusedAt < 700;
      setKeyboard(app && (full - h > 140 || opening));
      if (app && window.scrollY) window.scrollTo(0, 0); // iOS scrolls the page up to the field
    };
    // viewport events come in bursts while the keyboard slides: handle at most one per frame
    let frame = 0;
    const onViewport = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), apply()));
    };
    const onScroll = () => {
      if (phone.matches && window.scrollY) onViewport();
    };
    /* iOS: a swipe that no panel can take moves the whole page (with the keyboard up even past overflow:hidden).
       Swipes are only let through inside a panel that can still scroll that way. */
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!phone.matches || e.touches.length > 1) return; // pinch zoom stays possible
      const dy = (e.touches[0]?.clientY ?? 0) - startY; // > 0: finger moves down = scrolling up
      for (let el = e.target as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
          const atTop = el.scrollTop <= 0;
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          if ((dy > 0 && atTop) || (dy < 0 && atBottom)) break; // would chain to the page
          return;
        }
      }
      if (e.cancelable) e.preventDefault();
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (e: Event) => {
      if (e.type === "focusin") {
        focusedAt = Date.now();
        timers.push(setTimeout(apply, 800)); // re-check once the "just focused" window is over
      }
      timers.push(setTimeout(apply, 60));
    };
    const raf = requestAnimationFrame(apply);
    vv?.addEventListener("resize", onViewport);
    vv?.addEventListener("scroll", onViewport);
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    phone.addEventListener("change", apply);
    document.addEventListener("focusin", later);
    document.addEventListener("focusout", later);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      vv?.removeEventListener("resize", onViewport);
      vv?.removeEventListener("scroll", onViewport);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      phone.removeEventListener("change", apply);
      document.removeEventListener("focusin", later);
      document.removeEventListener("focusout", later);
      document.body.classList.remove("studio-app");
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vvt");
    };
  }, []);

  const selectedIndex = Math.max(0, versions.findIndex((v) => v.id === selectedId));
  const selected = versions[selectedIndex];
  const inCart = cart.has(selected.id);

  // newest first, grouped by day (designs saved before dates were kept use the session's date)
  const historyGroups: { label: string; items: { v: DesignVersion; n: number }[] }[] = [];
  versions
    .map((v, i) => ({ v, n: i + 1, t: v.createdAt ?? session.createdAt }))
    .reverse()
    .forEach(({ v, n, t }) => {
      const label = dayLabel(t);
      const group = historyGroups.find((g) => g.label === label);
      if (group) group.items.push({ v, n });
      else historyGroups.push({ label, items: [{ v, n }] });
    });

  function showToast(text: string) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

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
      jobId = await startDesign({ mode: "edit", image: base.blob, prompt: text, history: requestsLeadingTo(versions, base) });
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
    setInput("");
    send(text);
    inputRef.current?.blur(); // close the keyboard so the design (and its update) is in view
  }

  function retry(msg: Message) {
    if (!msg.retry || working) return;
    update((s) => ({ ...s, messages: s.messages.filter((x) => x.id !== msg.id) }));
    edit(msg.retry.text, msg.retry.baseId);
  }

  function toggleFavorite(id: string) {
    update((s) => ({ ...s, versions: s.versions.map((v) => (v.id === id ? { ...v, favorite: !v.favorite } : v)) }));
  }

  function send(text: string) {
    update((s) => ({ ...s, messages: [...s.messages, { id: uid(), role: "user", time: Date.now(), text }] }));
    edit(text, selected.id);
  }

  /** the picked Quick Add details as one edit */
  function generatePicked() {
    if (working) return;
    if (!picked.length) return showToast("Pick at least one detail");
    const parts = QUICK_ADD.filter((q) => picked.includes(q.id)).map((q) => q.text);
    const text = parts.join(", ");
    send(text.charAt(0).toUpperCase() + text.slice(1));
    setPicked([]);
    setTab("chat");
  }

  /** History → pencil: keep editing from that version */
  function editFrom(id: string) {
    setSelectedId(id);
    setTab("chat");
    setTimeout(() => inputRef.current?.focus());
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

  const designLabel = (n: number, v: DesignVersion) => `Design ${n}${n === 1 ? " (original)" : `: ${v.instruction}`}`;
  const pickedItems = QUICK_ADD.filter((q) => picked.includes(q.id));
  /** at 1180px+ the Quick Add tab doesn't exist: the middle column shows the chat instead */
  const show = (t: Tab) => (tab === t ? "flex" : t === "chat" && tab === "quick" ? "hidden nav:flex" : "hidden");
  const pane = "tab:rounded-[18px] tab:border tab:border-line tab:bg-ivory tab:px-[18px] tab:py-4 tab:soft-shadow";
  const overlayBtn = "grid h-[46px] w-[46px] place-items-center rounded-full bg-cocoa/70 text-white transition hover:bg-cocoa/85";

  /** compact: the small centred pill of the Quick Add tab · otherwise the full-width button of the desktop column */
  const generateButton = (compact: boolean) => (
    <button
      type="button"
      onClick={generatePicked}
      disabled={working}
      className={`btn-brown inline-flex items-center justify-center rounded-full font-medium text-white disabled:opacity-60 ${
        compact ? "min-h-10 gap-2 px-[26px] text-[15px]" : "mt-4 min-h-11 w-full flex-none gap-2.5 px-[22px] text-[15px]"
      }`}
    >
      {working ? (
        <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <SparkleIcon className="h-[18px] w-[18px]" />
      )}
      {working ? "Updating…" : "Generate"}
    </button>
  );

  return (
    // phones: design, then tabs (Chat · Quick Add · History) with the chat input / Generate fixed at the bottom
    // tablet: design + history · chat/quick/history tabs — desktop (1180px+): + a Quick Add Details column
    // tablet+: the columns fill the screen under the header, and each one scrolls on its own
    <div className="mx-auto flex w-full max-w-[97.5rem] flex-col px-[clamp(14px,3vw,40px)] max-tab:h-[calc(var(--vvh,100dvh)-77px)] tab:h-[calc(100dvh-77px)] tab:min-h-[560px] nav:h-[calc(100dvh-85px)]">
      <div
        className="flex min-h-0 flex-1 flex-col gap-2 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] tab:grid tab:grid-cols-2 tab:grid-rows-[minmax(0,1fr)] tab:gap-[18px] tab:pt-[18px] tab:pb-[30px] nav:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.62fr)]"
      >
        {/* ───────────── Design + history ───────────── */}
        <section aria-label="Your nail design" className={`flex flex-none flex-col tab:min-h-0 tab:overflow-y-auto tab:overscroll-contain ${pane} ${keyboard ? "max-tab:hidden" : ""}`}>
          <button type="button" onClick={onNewDesign} className="mb-3.5 hidden items-center gap-2.5 self-start text-[16px] tab:flex">
            <ArrowLeftIcon className="h-[22px] w-[22px]" />
            New Design
          </button>

          <div className="relative overflow-hidden rounded-[20px] bg-[#ddd] max-tab:h-[min(calc((100vw-28px)/1.21),42vh)] tab:aspect-[1.21]">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
            <img src={selected.url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 transform-gpu object-cover opacity-60 blur-xl will-change-transform" />
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
            <img
              src={selected.url}
              alt={selectedIndex === 0 ? "Your generated nail design" : `Updated nail design: ${selected.instruction}`}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
            />

            {working && (
              <div className="absolute inset-0 grid place-items-center bg-cream/55 font-medium" role="status">
                <span className="typing-dots">
                  Updating your design <span />
                  <span />
                  <span />
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={addToCart}
              disabled={inCart}
              className="absolute bottom-5 left-1/2 flex min-h-[46px] -translate-x-1/2 items-center gap-3.5 rounded-full border-[1.5px] border-white/70 bg-[rgba(90,52,33,.9)] px-6 whitespace-nowrap text-white disabled:cursor-default"
            >
              <CartIcon className="h-[22px] w-[22px]" />
              {inCart ? "In Cart ✓" : "Add to Cart"}
              <i className="h-[22px] w-px bg-white/40" aria-hidden />
              <b className="font-medium">{price}</b>
            </button>

            <button
              type="button"
              onClick={onNewPhoto}
              aria-label="Upload a different hand photo"
              title="Upload a different hand photo"
              className={`${overlayBtn} absolute top-3.5 left-3.5 tab:top-4 tab:left-4`}
            >
              <CameraIcon className="h-5 w-5" />
            </button>

            {/* share: top right · view larger: next to it on phones, bottom right from tablet up */}
            <div className="absolute top-3.5 right-3.5 flex gap-2">
              <button type="button" aria-label="Share" title="Share" onClick={share} className={overlayBtn}>
                <ShareIcon className="h-5 w-5" />
              </button>
              <button type="button" aria-label="View larger" title="View larger" onClick={() => setLightbox(true)} className={`${overlayBtn} tab:hidden`}>
                <ExpandIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              aria-label="View larger"
              title="View larger"
              onClick={() => setLightbox(true)}
              className={`${overlayBtn} absolute right-4 bottom-5 hidden tab:grid`}
            >
              <ExpandIcon className="h-5 w-5" />
            </button>
          </div>

          {pickedItems.length > 0 && (
            <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap tab:flex-wrap">
              <span>Selected:</span>
              {pickedItems.map((q) => (
                <button key={q.id} type="button" onClick={() => togglePick(q.id)} aria-label={`Remove ${q.label}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pink-2 px-3.5 py-1.5 text-[14px]">
                  <SparkleIcon className="h-3.5 w-3.5" />
                  {q.label}
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}

          {/* tablet+: history strip */}
          <div className="hidden tab:block">
            <div className="mt-4 mb-2 flex items-center justify-between text-[16px]">
              <span>Design History</span>
              <button type="button" onClick={() => setTab("history")} className="flex items-center gap-1 text-[14px]">
                View All
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
            <ul className="flex gap-2.5 overflow-x-auto pb-1">
              {[...versions]
                .reverse()
                .slice(0, 6)
                .map((v) => {
                  const n = versions.indexOf(v) + 1;
                  return (
                    <li key={v.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedId(v.id)}
                        aria-pressed={v.id === selected.id}
                        aria-label={designLabel(n, v)}
                        title={n === 1 ? "Original design" : v.instruction}
                        className={`block h-[46px] w-[76px] overflow-hidden rounded-lg border-2 ${v.id === selected.id ? "border-brown" : "border-transparent"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
                        <img src={v.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </section>

        {/* ───────────── Chat · Quick Add · History ───────────── */}
        <section aria-label="Edit your design" className={`flex min-h-0 min-w-0 flex-1 flex-col ${pane}`}>
          <div role="tablist" aria-label="Design tools" className="mb-1 flex flex-none border-b border-line tab:mb-3">
            {TABS.map(({ id, label, icon: Icon, className = "" }, k) => {
              return (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`-mb-px flex flex-1 items-center justify-center gap-[5px] border-b-2 px-1 py-[7px] text-[13.5px] whitespace-nowrap tab:flex-none tab:gap-2.5 tab:border-b-[3px] tab:px-5 tab:py-3 tab:text-[16px] ${
                    tab === id ? "border-brown" : id === "chat" && tab === "quick" ? "border-transparent nav:border-brown" : "border-transparent"
                  } ${k < TABS.length - 1 ? "max-tab:border-r max-tab:border-r-line" : ""} ${className}`}
                >
                  <Icon className="h-[17px] w-[17px] tab:h-[22px] tab:w-[22px]" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* chat */}
          <div className={`min-h-0 flex-1 flex-col ${show("chat")}`}>
            <div
              ref={chatRef}
              className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-1 py-2.5"
              aria-live="polite"
              aria-label="Chat with the Oreo Nails assistant"
            >
              {messages.map((m) => {
                const me = m.role === "user";
                return (
                  <div key={m.id} className={`flex items-start gap-3 ${me ? "flex-row-reverse" : ""}`}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-2" aria-hidden>
                      {me ? <UserIcon className="h-5 w-5" /> : <SparkleIcon className="h-5 w-5" />}
                    </span>
                    <div
                      className={`max-w-full rounded-[18px] px-[18px] py-3 min-[481px]:max-w-[72%] ${
                        me ? "rounded-br-[4px] bg-pink" : m.status === "error" ? "bg-wine/10 text-wine" : "bg-pink-2"
                      }`}
                    >
                      {m.status === "pending" && (
                        <span className="typing-dots mr-1.5 inline-block" aria-hidden>
                          <span />
                          <span />
                          <span />
                        </span>
                      )}
                      {m.text}
                      {m.retry && (
                        <button type="button" onClick={() => retry(m)} disabled={working} className="btn-brown btn-label mt-2 block rounded-full px-4 py-1 text-sm text-white disabled:opacity-60">
                          Try again
                        </button>
                      )}
                    </div>
                    <time className={`hidden pt-3 text-[12.5px] whitespace-nowrap text-cocoa-soft min-[481px]:block ${me ? "mr-auto" : "ml-auto"}`}>{fmtTime(m.time)}</time>
                  </div>
                );
              })}
            </div>

            {/* phones: fixed to the bottom of the screen · tablet+: bottom of the panel */}
            <form
              onSubmit={onSend}
              className="flex-none"
            >
              <div className="mt-2 flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pr-2 pl-[18px] soft-shadow focus-within:border-brown tab:mt-3">
                <button type="button" onClick={onNewPhoto} aria-label="Use a different hand photo" title="Use a different hand photo" className="shrink-0">
                  <GalleryIcon className="h-[22px] w-[22px]" />
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
                  placeholder="Type your request to edit the design…"
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-cocoa-soft"
                />
                <button type="submit" disabled={!input.trim() || working} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full disabled:opacity-40">
                  {working ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brown" /> : <SendIcon className="h-[22px] w-[22px]" />}
                </button>
              </div>
            </form>
          </div>

          {/* quick add tiles (below 1180px) */}
          <div className={`min-h-0 flex-1 flex-col nav:hidden ${tab === "quick" ? "flex" : "hidden"}`}>
            <div className="flex flex-none gap-1.5 overflow-x-auto pt-0.5 pb-1.5 tab:gap-2 tab:pt-0 tab:pb-2.5">
              {[{ id: "all" as const, label: "All" }, ...QUICK_ADD_CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={filter === c.id}
                  onClick={() => setFilter(c.id)}
                  className={`min-h-[30px] shrink-0 rounded-full border px-3 py-[3px] text-[13px] whitespace-nowrap tab:min-h-0 tab:px-4 tab:py-[7px] tab:text-[15px] ${filter === c.id ? "border-brown bg-brown text-white" : "border-line bg-white"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <ul className="grid min-h-0 flex-1 grid-cols-4 content-start gap-[7px] overflow-y-auto overscroll-contain min-[481px]:gap-2.5">
              {QUICK_ADD.filter((q) => filter === "all" || q.category === filter).map((q) => {
                const on = picked.includes(q.id);
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePick(q.id)}
                      className={`relative w-full overflow-hidden rounded-[14px] bg-white pb-2 text-[12.5px] min-[481px]:text-[14px] ${on ? "border-2 border-brown" : "border border-line"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- small static photo */}
                      <img src={q.image} alt="" className="mb-1.5 aspect-[1.38] w-full object-cover" />
                      {q.label}
                      <span
                        className={`absolute top-[5px] right-[5px] grid h-5 w-5 place-items-center rounded-full border-[1.5px] min-[481px]:top-[7px] min-[481px]:right-[7px] min-[481px]:h-6 min-[481px]:w-6 ${
                          on ? "border-cocoa bg-cocoa text-white" : "border-[#6d5a52] bg-white"
                        }`}
                      >
                        {on && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex-none pt-2.5 pb-1 text-center">
              {generateButton(true)}
            </div>
          </div>

          {/* history */}
          <div className={`min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain ${show("history")}`}>
            <div className="flex items-center gap-2.5 pb-0.5 tab:py-1">
              <HistoryIcon className="h-[22px] w-[22px]" />
              <h2 className="text-[16px] font-semibold tab:text-[20px]">Design History</h2>
              <span className="ml-auto text-[14px] text-cocoa-soft">
                {versions.length} {versions.length === 1 ? "Design" : "Designs"}
              </span>
            </div>
            {historyGroups.map((g) => (
              <div key={g.label}>
                <h3 className="mt-2 mb-1.5 inline-block rounded-full bg-pink px-3.5 py-[3px] text-[14px] font-medium tab:mt-3.5 tab:mb-2.5">{g.label}</h3>
                <ul className="grid grid-cols-4 gap-[7px] min-[481px]:gap-2.5">
                  {g.items.map(({ v, n }) => {
                    const on = v.id === selected.id;
                    return (
                      <li key={v.id} className={`relative aspect-square overflow-hidden rounded-xl border-2 ${on ? "border-cocoa" : "border-transparent"}`}>
                        <button type="button" onClick={() => setSelectedId(v.id)} aria-pressed={on} aria-label={designLabel(n, v)} className="block h-full w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
                          <img src={v.url} alt="" className="h-full w-full object-cover" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(v.id)}
                          aria-label={v.favorite ? `Remove design ${n} from favorites` : `Favourite design ${n}`}
                          className="absolute bottom-1 left-1 grid h-[26px] w-[26px] place-items-center rounded-full bg-white/90 min-[481px]:bottom-1.5 min-[481px]:left-1.5 min-[481px]:h-[30px] min-[481px]:w-[30px]"
                        >
                          <HeartIcon filled={v.favorite} className={`h-4 w-4 ${v.favorite ? "text-wine" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => editFrom(v.id)}
                          aria-label={`Edit design ${n}`}
                          className="absolute right-1 bottom-1 grid h-[26px] w-[26px] place-items-center rounded-full bg-white/90 min-[481px]:right-1.5 min-[481px]:bottom-1.5 min-[481px]:h-[30px] min-[481px]:w-[30px]"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── Quick Add Details (1180px+) ───────────── */}
        <section aria-labelledby="quick-add-title" className={`hidden min-h-0 flex-col nav:flex ${pane}`}>
          <h2 id="quick-add-title" className="flex flex-none items-center gap-2.5 pb-3 text-[17px] font-medium">
            <SparkleIcon className="h-[22px] w-[22px]" />
            Quick Add Details
          </h2>
          <ul className="-mx-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-1 pb-1">
            {QUICK_ADD.map((q) => {
              const on = picked.includes(q.id);
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => togglePick(q.id)}
                    className={`flex min-h-[50px] w-full items-center gap-3.5 rounded-full border py-1.5 pr-4 pl-1.5 text-left text-[15px] ${on ? "border-brown bg-pink-2" : "border-line bg-white"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- small static photo */}
                    <img src={q.image} alt="" className="h-[38px] w-[38px] rounded-full object-cover" />
                    Add {q.label}
                    {on && <CheckIcon className="ml-auto h-[18px] w-[18px] text-brown" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {generateButton(false)}
        </section>
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nail design, larger"
          className="fixed inset-0 z-[60] grid place-items-center bg-cocoa/45 p-5"
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => e.key === "Escape" && setLightbox(false)}
        >
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
            <img src={selected.url} alt="Your nail design" className="max-h-[70vh] rounded-2xl" />
            <button type="button" autoFocus onClick={() => setLightbox(false)} className="btn-brown btn-label mt-3 min-h-11 rounded-full px-[22px] text-white">
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-cocoa px-[22px] py-3 text-[14px] whitespace-nowrap text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
