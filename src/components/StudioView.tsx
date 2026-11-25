"use client";

import { useEffect, useRef, useState, type DragEvent, type RefObject } from "react";
import { ErrorOverlay, GeneratingOverlay, type GenError } from "./PhotoStage";
import { CameraIcon, CheckIcon, ChevronRightIcon, PencilIcon, SparkleIcon } from "./icons";
import { MAX_PROMPT, QUICK_ADD } from "@/lib/constants";

type Props = {
  file: File | null;
  previewUrl: string | null;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  openPicker: () => void;
  prompt: string;
  setPrompt: (v: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** Quick Add details picked for the first design */
  quick: string[];
  toggleQuick: (id: string) => void;
  error: string | null;
  loading: boolean;
  genError: GenError | null;
  onRetry: () => void;
};

/** two soft photo frames with the upload cloud in front (empty upload area) — shrinks on short screens */
function UploadArt() {
  return (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mx-auto mb-1 block h-[clamp(56px,16vh,130px)] min-h-0 w-auto shrink tab:mb-1.5 tab:h-[clamp(60px,17vh,150px)] [@media(max-height:600px)]:hidden"
    >
      <g transform="rotate(-12 70 60)">
        <rect x="22" y="22" width="96" height="78" rx="10" fill="#f6e6df" stroke="#ead6cd" strokeWidth="4" />
        <path d="M36 88l22-28 16 18 10-10 20 20z" fill="#ead6cd" />
      </g>
      <g transform="rotate(8 130 70)">
        <rect x="86" y="30" width="96" height="84" rx="10" fill="#f8ebe5" stroke="#ead6cd" strokeWidth="4" />
        <path d="M98 102l24-32 18 20 10-10 22 22z" fill="#ecd8cf" />
        <circle cx="158" cy="52" r="8" fill="#ecd8cf" />
      </g>
      <path d="M78 128h-6a20 20 0 0 1-2-40 26 26 0 0 1 50-6 18 18 0 0 1 10 34 14 14 0 0 1-6 2h-4" stroke="#7a4a33" strokeWidth="6" fill="#fbf2ee" />
      <path d="M100 146V100M86 114l14-14 14 14" stroke="#7a4a33" strokeWidth="6" />
    </svg>
  );
}

/** Quick Add strip: one row that scrolls sideways (dots show where you are) · "See All" opens the full grid */
function QuickAdd({ quick, toggleQuick }: { quick: string[]; toggleQuick: (id: string) => void }) {
  const [all, setAll] = useState(false);
  const rowRef = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState({ i: 0, n: 1 });
  useEffect(() => {
    const row = rowRef.current;
    if (!row || all) return;
    const measure = () => {
      const n = Math.max(1, Math.ceil(row.scrollWidth / row.clientWidth - 0.05));
      const max = row.scrollWidth - row.clientWidth;
      const i = max > 0 ? Math.round((row.scrollLeft / max) * (n - 1)) : 0;
      setPage((p) => (p.i === i && p.n === n ? p : { i, n }));
    };
    measure();
    row.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      row.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [all]);

  const goTo = (i: number) => {
    const row = rowRef.current;
    if (row) row.scrollTo({ left: (i / Math.max(1, page.n - 1)) * (row.scrollWidth - row.clientWidth), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="quick-title" className="flex-none">
      <div className="mt-3 mb-2 flex items-center gap-2.5 px-0.5 tab:mt-4 tab:mb-2.5 [@media(max-height:600px)]:mt-2 [@media(max-height:600px)]:mb-1.5">
        <h2 id="quick-title" className="flex items-center gap-2.5 text-[17px] font-medium text-cocoa tab:text-[20px]">
          <SparkleIcon className="h-[22px] w-[22px] tab:h-[26px] tab:w-[26px]" />
          Quick Add
          {quick.length > 0 && <span className="rounded-full bg-pink px-2 py-px text-[13px] font-medium">{quick.length}</span>}
        </h2>
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="ml-auto flex items-center gap-0.5 py-1 text-[14px] text-cocoa">
          {all ? "Show less" : "See All"}
          <ChevronRightIcon className={`h-4 w-4 transition ${all ? "-rotate-90" : ""}`} />
        </button>
      </div>
      <ul
        ref={rowRef}
        className={
          all
            ? "grid max-h-[38vh] grid-cols-4 gap-2.5 overflow-y-auto overscroll-contain px-0.5 pt-0.5 pb-1 tab:max-h-[34vh]"
            : "flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-0.5 pt-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {QUICK_ADD.map((q) => {
          const on = quick.includes(q.id);
          return (
            <li key={q.id} className={all ? "" : "shrink-0 grow-0 basis-[calc((100%-40px)/5)] snap-start tab:basis-[calc((100%-40px)/4.6)]"}>
              <button
                type="button"
                onClick={() => toggleQuick(q.id)}
                aria-pressed={on}
                className="relative block w-full text-center text-[12px] font-medium whitespace-nowrap text-cocoa transition active:scale-95 tab:text-[13.5px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small static tile */}
                <img
                  src={q.image}
                  alt=""
                  className={`mb-[3px] aspect-[.93] w-full rounded-[14px] border-2 object-cover tab:mb-1.5 tab:rounded-2xl ${on ? "border-brown" : "border-transparent"}`}
                />
                {q.label}
                {on && (
                  <span className="absolute top-1.5 right-1.5 grid h-[22px] w-[22px] place-items-center rounded-full bg-cocoa text-white" aria-hidden>
                    <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {!all && page.n > 1 && (
        <div className="mt-1.5 flex justify-center gap-[7px] tab:mt-2.5 [@media(max-height:600px)]:mt-1">
          {Array.from({ length: page.n }, (_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`Quick Add page ${k + 1}`}
              aria-current={k === page.i}
              onClick={() => goTo(k)}
              className={`h-2 w-2 rounded-full transition ${k === page.i ? "bg-brown" : "bg-[#e2d2ca]"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Design studio start screen (upload → quick add / describe → generate): one centred column that fills the screen
 * under the header — the photo card takes the free height, describe + Generate sit at the bottom.
 */
export default function StudioView({ textareaRef, ...p }: Props) {
  const hasPhoto = !!p.previewUrl;
  const busy = p.loading;
  /** Generate without a photo: the upload card shakes */
  const [shake, setShake] = useState(false);

  // app-like screen: no footer under it
  useEffect(() => {
    document.body.classList.add("studio-start");
    return () => document.body.classList.remove("studio-start");
  }, []);

  const pick = () => {
    if (!busy) p.openPicker();
  };

  return (
    // a fixed height: a growing description shrinks the photo card instead of pushing Generate down
    // (too little room → this column scrolls)
    <div className="relative z-10 flex h-[calc(100dvh-77px)] flex-col overflow-y-auto overscroll-contain px-[clamp(14px,3vw,40px)] nav:h-[calc(100dvh-85px)]">
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] tab:pt-4 tab:pb-[18px]">
        {/* no visible title — kept for screen readers / the page outline */}
        <h1 className="sr-only">Custom Nails</h1>

        {/* upload: the whole dashed area opens the photo picker (phones offer camera or library there) */}
        <section
          aria-label="Your hand photo"
          onAnimationEnd={() => setShake(false)}
          className={`flex min-h-[220px] flex-1 rounded-[24px] bg-ivory p-2.5 shadow-[0_10px_30px_rgba(110,65,42,.10)] tab:min-h-[190px] tab:rounded-[28px] tab:p-3.5 [@media(max-height:600px)]:min-h-[150px] ${
            shake ? "animate-[shake_.4s]" : ""
          }`}
        >
          <div
            role={hasPhoto ? undefined : "button"}
            tabIndex={hasPhoto ? undefined : 0}
            aria-label={hasPhoto ? undefined : "Take a photo or upload a photo of your hand"}
            onClick={hasPhoto ? undefined : pick}
            onKeyDown={(e) => {
              if (!hasPhoto && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                pick();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              p.setDragging(true);
            }}
            onDragLeave={() => p.setDragging(false)}
            onDrop={p.onDrop}
            className={`relative flex min-h-0 flex-1 flex-col justify-center rounded-[22px] border-2 border-dashed px-4 py-3 text-center transition tab:px-[22px] tab:py-[18px] ${
              hasPhoto ? "" : "cursor-pointer outline-none hover:border-[#d6b3a3] focus-visible:border-brown"
            } ${p.dragging ? "border-brown bg-pink-2" : shake ? "border-brown" : "border-[#e6cec3]"}`}
          >
            {hasPhoto ? (
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img
                  src={p.previewUrl!}
                  alt="Your hand photo"
                  className={`absolute inset-0 h-full w-full object-cover transition ${busy ? "scale-[1.02] opacity-60 blur-[2px]" : ""}`}
                />
                {busy && <GeneratingOverlay />}
                {p.genError && !busy && <ErrorOverlay error={p.genError} onRetry={p.onRetry} openPicker={p.openPicker} />}
                {!busy && !p.genError && (
                  <button
                    type="button"
                    onClick={pick}
                    className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-cocoa/75 px-3.5 py-[7px] text-[13px] whitespace-nowrap text-white transition hover:bg-cocoa/90"
                  >
                    <CameraIcon className="h-4 w-4" />
                    <span className="pointer-fine:hidden">Tap to change photo</span>
                    <span className="hidden pointer-fine:inline">Change photo</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <UploadArt />
                <h2 className="mb-1 text-[clamp(18px,5.2vw,22px)] leading-tight font-semibold text-balance text-brown tab:text-[26px]">
                  Take a photo or upload a photo of your hand
                </h2>
                <p className="text-[12.5px] text-cocoa-soft tab:text-[14px]">JPG, PNG, WEBP · max 10 MB</p>
              </>
            )}
          </div>
        </section>

        <QuickAdd quick={p.quick} toggleQuick={p.toggleQuick} />

        {/* describe */}
        <label className="relative mt-2.5 flex flex-none items-start gap-3 rounded-2xl border border-line bg-[#fffaf8] px-3.5 py-2.5 transition focus-within:border-brown-2 tab:mt-3 tab:rounded-[18px] tab:px-4 tab:py-3.5 [@media(max-height:600px)]:py-2">
          <PencilIcon className="mt-0.5 h-[22px] w-[22px] shrink-0 text-cocoa-soft" />
          <span className="sr-only">Describe your nail design</span>
          <textarea
            id="m-prompt"
            ref={textareaRef}
            value={p.prompt}
            maxLength={MAX_PROMPT}
            onChange={(e) => p.setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe your design..."
            // always 3 lines high (3 × 23px); longer text scrolls inside
            className="h-[70px] w-full min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-[16px] leading-[1.45] text-cocoa outline-none placeholder:text-cocoa-soft"
          />
          {p.prompt.length > 0 && (
            <span className="pointer-events-none absolute right-3 bottom-1 text-[11px] text-cocoa-soft">
              {p.prompt.length} / {MAX_PROMPT}
            </span>
          )}
        </label>

        {p.error && (
          <p role="alert" className="mt-3 flex-none rounded-xl bg-wine/10 px-4 py-2.5 text-center text-[14px] font-medium text-wine">
            {p.error}
          </p>
        )}

        <div className="mt-3 flex flex-none justify-center tab:mt-3.5 [@media(max-height:600px)]:mt-2.5">
          <button
            type="submit"
            disabled={busy}
            onClick={() => {
              if (hasPhoto) return;
              setShake(false);
              requestAnimationFrame(() => setShake(true)); // restart the shake on every tap
            }}
            className="btn-brown flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full px-8 text-[18px] font-semibold whitespace-nowrap text-white shadow-[0_4px_14px_rgba(110,65,42,.25)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-80 tab:min-h-[54px] tab:w-auto tab:px-[54px] tab:text-[19px] [@media(max-height:600px)]:min-h-[46px]"
          >
            {busy ? (
              <>
                <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
                Designing…
              </>
            ) : (
              <>
                Generate
                <SparkleIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
