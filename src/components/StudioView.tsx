"use client";

import { useEffect, useRef, useState, type DragEvent, type RefObject } from "react";
import PhotoStage, { type GenError } from "./PhotoStage";
import type { HandCheck } from "@/lib/handDetector";
import { CameraIcon, CheckIcon, ChevronRightIcon, GalleryIcon, PencilIcon, SparkleIcon } from "./icons";
import { MAX_PROMPT, QUICK_ADD } from "@/lib/constants";

type Props = {
  file: File | null;
  previewUrl: string | null;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  openPicker: () => void;
  openCamera: () => void;
  removePhoto: () => void;
  prompt: string;
  setPrompt: (v: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** Quick Add details picked for the first design */
  quick: string[];
  toggleQuick: (id: string) => void;
  error: string | null;
  loading: boolean;
  handCheck: HandCheck;
  genError: GenError | null;
  onRetry: () => void;
};

/** two soft photo frames with the upload cloud in front (empty upload area) */
function UploadArt() {
  return (
    <svg viewBox="0 0 160 130" className="h-[118px] w-[146px]" aria-hidden fill="none">
      <g stroke="#ead6cc" strokeWidth="5" strokeLinejoin="round">
        <rect x="14" y="20" width="70" height="62" rx="8" transform="rotate(-14 49 51)" fill="#f6e7e0" />
        <rect x="62" y="16" width="70" height="62" rx="8" transform="rotate(10 97 47)" fill="#f6e7e0" />
      </g>
      <g fill="#ecd9cf">
        <path d="M24 74 40 50l13 18 7-8 13 16z" transform="rotate(-14 49 51)" />
        <path d="M72 70l16-24 13 18 7-8 13 16z" transform="rotate(10 97 47)" />
        <circle cx="117" cy="32" r="6" />
      </g>
      <path
        d="M58 104h-6a16 16 0 0 1-2-31.9A22 22 0 0 1 92 66a14 14 0 0 1 18 18 12 12 0 0 1-4 20h-4"
        stroke="#6e412a"
        strokeWidth="5"
        strokeLinecap="round"
        fill="#fbf2ee"
      />
      <path d="M80 122V86m0 0-12 12m12-12 12 12" stroke="#6e412a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
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
    <section className="mt-6" aria-labelledby="quick-title">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 id="quick-title" className="flex items-center gap-2.5 text-[20px] font-medium text-cocoa">
          <SparkleIcon className="h-6 w-6" />
          Quick Add
          {quick.length > 0 && <span className="rounded-full bg-pink px-2 py-px text-[13px] font-medium">{quick.length}</span>}
        </h2>
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="flex items-center gap-1 py-1 text-[15px] text-cocoa">
          {all ? "Show Less" : "See All"}
          <ChevronRightIcon className={`h-4 w-4 transition ${all ? "-rotate-90" : ""}`} />
        </button>
      </div>
      <ul
        ref={rowRef}
        className={
          all
            ? "mt-3 grid grid-cols-4 gap-x-2.5 gap-y-3 min-[481px]:grid-cols-5"
            : "-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        }
      >
        {QUICK_ADD.map((q) => {
          const on = quick.includes(q.id);
          return (
            <li key={q.id} className={all ? "" : "w-[calc((100%-4*10px)/4.4)] max-w-[120px] shrink-0 snap-start"}>
              <button type="button" onClick={() => toggleQuick(q.id)} aria-pressed={on} className="group block w-full text-center">
                <span
                  className={`relative block aspect-[1/1.08] overflow-hidden rounded-[18px] border-2 transition group-active:scale-95 ${
                    on ? "border-brown shadow-[0_0_0_3px_rgba(110,65,42,.18)]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- small static tile */}
                  <img src={q.image} alt="" className="h-full w-full object-cover" />
                  {on && (
                    <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-brown text-white">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block truncate text-[14px] text-cocoa">{q.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {!all && page.n > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {Array.from({ length: page.n }, (_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`Quick Add page ${k + 1}`}
              aria-current={k === page.i}
              onClick={() => goTo(k)}
              className={`h-2 w-2 rounded-full transition ${k === page.i ? "bg-cocoa" : "bg-line"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Design studio (upload → quick add / describe → generate), one centred column on every screen size. */
export default function StudioView({ textareaRef, ...p }: Props) {
  const hasPhoto = !!p.previewUrl;
  const busy = p.loading;

  const buttons = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={p.openPicker}
        disabled={busy}
        className="btn-brown flex min-h-[50px] flex-[1.75] items-center justify-center gap-2.5 rounded-full px-4 text-[17px] font-medium whitespace-nowrap text-white transition active:scale-[0.98] disabled:opacity-60 pointer-fine:hover:brightness-110"
      >
        <GalleryIcon className="h-6 w-6 shrink-0" />
        {hasPhoto ? "Change Photo" : "Upload"}
      </button>
      <button
        type="button"
        onClick={p.openCamera}
        disabled={busy}
        aria-label="Take a photo of your hand"
        className="flex min-h-[50px] flex-1 items-center justify-center rounded-full border-[1.5px] border-brown bg-ivory text-brown transition active:scale-[0.98] disabled:opacity-60 tab:pointer-fine:hidden"
      >
        <CameraIcon className="h-6 w-6" />
      </button>
    </div>
  );

  return (
    <div className="relative z-10 mx-auto w-full max-w-[640px] px-4 pb-10 sm:px-6">
      <header className="flex items-center justify-center gap-5 pt-6">
        <span aria-hidden className="h-px w-11 bg-cocoa/60" />
        <h1 className="text-[26px] leading-tight text-cocoa">
          <span className="font-highlight text-brown">Custom</span> Nails
        </h1>
        <span aria-hidden className="h-px w-11 bg-cocoa/60" />
      </header>

      {/* upload */}
      <section aria-label="Your hand photo" className="glass-card mt-5 rounded-[26px] p-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            p.setDragging(true);
          }}
          onDragLeave={() => p.setDragging(false)}
          onDrop={p.onDrop}
          className={`rounded-[20px] border-2 border-dashed p-3 transition sm:p-4 ${p.dragging ? "border-brown bg-pink-2" : "border-[#ead6cc]"}`}
        >
          {hasPhoto ? (
            <>
              <PhotoStage
                file={p.file}
                previewUrl={p.previewUrl}
                dragging={p.dragging}
                setDragging={p.setDragging}
                onDrop={p.onDrop}
                openPicker={p.openPicker}
                removePhoto={p.removePhoto}
                loading={p.loading}
                handCheck={p.handCheck}
                genError={p.genError}
                onRetry={p.onRetry}
              />
              <div className="mt-3.5 px-1 pb-1">{buttons}</div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={p.openPicker}
                className="flex w-full flex-col items-center px-2 pt-7 pb-8 text-center"
              >
                <UploadArt />
                <span className="mt-3 text-[clamp(18px,5.5vw,25px)] font-semibold whitespace-nowrap text-brown">Upload Your Hand Photo</span>
                <span className="mt-1 text-[14px] text-cocoa-soft">
                  <span className="hidden tab:pointer-fine:inline">Click or drop a photo here · </span>
                  JPG, PNG, WEBP · max 10 MB
                </span>
              </button>
              <div className="px-2 pb-2 sm:px-6">{buttons}</div>
            </>
          )}
        </div>
      </section>

      <QuickAdd quick={p.quick} toggleQuick={p.toggleQuick} />

      {/* describe */}
      <div className="relative mt-5">
        <PencilIcon className="pointer-events-none absolute top-[15px] left-4 h-[22px] w-[22px] text-cocoa-soft" />
        <label htmlFor="m-prompt" className="sr-only">
          Describe your nail design
        </label>
        <textarea
          id="m-prompt"
          ref={textareaRef}
          value={p.prompt}
          maxLength={MAX_PROMPT}
          onChange={(e) => p.setPrompt(e.target.value)}
          rows={2}
          placeholder="Describe your design…"
          className="min-h-[92px] w-full resize-none rounded-[20px] border border-line bg-ivory py-3.5 pr-4 pb-7 pl-12 [field-sizing:content] text-[16px] text-cocoa outline-none transition placeholder:text-cocoa-soft focus:border-brown-2"
        />
        {p.prompt.length > 0 && (
          <span className="pointer-events-none absolute right-4 bottom-2.5 text-[12px] text-cocoa-soft">
            {p.prompt.length} / {MAX_PROMPT}
          </span>
        )}
      </div>

      {p.error && (
        <p role="alert" className="mt-4 rounded-xl bg-wine/10 px-4 py-3 text-center font-medium text-wine">
          {p.error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-brown mx-auto mt-7 flex min-h-[56px] w-[min(100%,300px)] items-center justify-center gap-3 rounded-full px-8 text-[20px] font-semibold whitespace-nowrap text-white shadow-[0_12px_24px_-10px_rgba(110,65,42,.6)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
      >
        {busy ? (
          <>
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
            Designing…
          </>
        ) : (
          <>
            Generate
            <SparkleIcon className="h-6 w-6" />
          </>
        )}
      </button>
    </div>
  );
}
