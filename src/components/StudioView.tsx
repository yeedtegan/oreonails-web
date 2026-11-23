"use client";

import type { Dispatch, DragEvent, RefObject, SetStateAction } from "react";
import NailThumb, { type NailStyleId } from "./NailThumb";
import PhotoStage, { type GenError } from "./PhotoStage";
import type { HandCheck } from "@/lib/handDetector";
import { CameraIcon, ChevronRightIcon, PencilIcon, SparkleIcon, UploadIcon } from "./icons";
import { MAX_PROMPT, MORE_STYLES, STYLES } from "@/lib/constants";

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
  styles: NailStyleId[];
  toggleStyle: (id: NailStyleId) => void;
  showMore: boolean;
  setShowMore: Dispatch<SetStateAction<boolean>>;
  error: string | null;
  loading: boolean;
  handCheck: HandCheck;
  genError: GenError | null;
  onRetry: () => void;
};

function StepBadge({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="-mt-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-full pb-px bg-[linear-gradient(180deg,#8e5d40,#6e412a)] font-serif text-[22px] font-semibold leading-none text-white [font-variant-numeric:lining-nums] shadow-[0_4px_10px_-4px_rgba(120,85,50,0.7)]"
    >
      {n}
    </span>
  );
}

function GridIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

/** Design studio (upload → describe → styles → generate), one centred column on every screen size. */
export default function StudioView({ textareaRef, ...p }: Props) {
  const allStyles = p.showMore ? [...STYLES, ...MORE_STYLES] : STYLES;

  return (
    <div className="relative z-10 mx-auto w-full max-w-[640px] px-4 pb-10 sm:px-6">
      <header className="pt-6 text-center">
        <h1 className="font-serif text-[30px] font-semibold leading-tight text-cocoa sm:text-4xl">
          Create Your <span className="font-highlight font-normal text-gold-dark">Custom</span> Nails
        </h1>
        <p className="mt-1 text-[17px] text-cocoa">Upload your hand photo and describe the nail design you want</p>
      </header>

      {/* Step 1 — upload */}
      <section className="glass-card mt-5 rounded-[18px] p-4 sm:p-5" aria-labelledby="m-upload-title">
        <div className="flex items-start gap-3">
          <StepBadge n={1} />
          <div>
            <h2 id="m-upload-title" className="font-serif text-[22px] font-semibold leading-tight text-cocoa">
              Upload Your Hand Photo
            </h2>
            <p className="text-[15px] text-cocoa">Use a clear, well-lit photo of your hand</p>
          </div>
        </div>

        <div className="mt-3">
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
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={p.openPicker}
            className="btn-brown flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 pointer-fine:max-w-72 pointer-fine:hover:brightness-110 btn-label text-[16px] whitespace-nowrap text-white transition active:scale-[0.98]"
          >
            <UploadIcon className="h-5 w-5 shrink-0" />
            {p.file ? "Change Photo" : "Choose Photo"}
          </button>
          <button
            type="button"
            onClick={p.openCamera}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#74482f] pointer-fine:hidden bg-white/70 px-4 py-2.5 btn-label text-[16px] whitespace-nowrap text-[#5a3523] transition active:scale-[0.98]"
          >
            <CameraIcon className="h-5 w-5 shrink-0" />
            Take Photo
          </button>
        </div>
        <p className="mt-2 text-center text-sm text-cocoa">
          {p.file ? (
            <span className="font-semibold text-gold-dark">{p.file.name}</span>
          ) : (
            "JPG, PNG, WEBP • Max 10 MB"
          )}
        </p>
      </section>

      {/* Step 2 — describe */}
      <section className="glass-card mt-4 rounded-[18px] p-4 sm:p-5" aria-labelledby="m-describe-title">
        <div className="flex items-start gap-3">
          <StepBadge n={2} />
          <div>
            <h2 id="m-describe-title" className="font-serif text-[22px] font-semibold leading-tight text-cocoa">
              Describe Your Nail Design
            </h2>
            <p className="text-[15px] text-cocoa">Tell us the style, color, theme, or any special details you want</p>
          </div>
        </div>
        <div className="relative mt-3">
          <PencilIcon className="pointer-events-none absolute top-3.5 left-4 h-6 w-6 text-cocoa-soft" />
          <label htmlFor="m-prompt" className="sr-only">
            Describe your nail design
          </label>
          <textarea
            id="m-prompt"
            ref={textareaRef}
            value={p.prompt}
            maxLength={MAX_PROMPT}
            onChange={(e) => p.setPrompt(e.target.value)}
            rows={3}
            placeholder={"E.g. “Elegant almond nails with a rose gold theme, 3D flowers, and a glossy finish”"}
            className="min-h-[7.5rem] w-full resize-none rounded-2xl border border-gold/30 bg-white/80 py-3 pr-4 pb-8 pl-13 [field-sizing:content] text-[17px] text-cocoa shadow-[0_6px_16px_-10px_rgba(90,50,40,0.5)] outline-none transition placeholder:text-cocoa-soft focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
          <span className="pointer-events-none absolute right-4 bottom-3 text-sm text-cocoa">
            {p.prompt.length} / {MAX_PROMPT}
          </span>
        </div>
      </section>

      {/* styles */}
      <section className="mt-5" aria-labelledby="m-styles-title">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gold/40" />
          <h2 id="m-styles-title" className="text-center font-serif text-lg font-semibold text-cocoa sm:text-xl">
            Or Choose a Nail Style to Get Inspired
          </h2>
          <span className="h-px flex-1 bg-gold/40" />
        </div>
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
          {allStyles.map(({ id, label }) => {
            const active = p.styles.includes(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => p.toggleStyle(id)}
                  aria-pressed={active}
                  className={`relative block w-full overflow-hidden rounded-xl border-2 bg-ivory pb-1 text-center shadow-[0_6px_14px_-8px_rgba(90,50,40,0.6)] transition active:scale-95 ${
                    active ? "border-gold ring-2 ring-gold/30" : "border-white"
                  }`}
                >
                  <NailThumb id={id} className="aspect-[5/3] w-full" />
                  <span className="block whitespace-nowrap px-0.5 pt-1 font-serif text-[clamp(10px,2.8vw,14px)] font-semibold tracking-tight text-cocoa">
                    {label}
                  </span>
                  {active && (
                    <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-[9px] text-white">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => p.setShowMore((v) => !v)}
              aria-expanded={p.showMore}
              className="flex h-full min-h-[72px] w-full flex-col items-center justify-center rounded-xl border-2 border-white bg-ivory text-gold shadow-[0_6px_14px_-8px_rgba(90,50,40,0.6)]"
            >
              <GridIcon className="h-6 w-6" />
              <span className="mt-1 font-serif text-[13px] font-semibold leading-tight text-cocoa">
                {p.showMore ? "Fewer" : "More"}
                <br />
                Styles
              </span>
            </button>
          </li>
        </ul>
      </section>

      {p.error && (
        <p role="alert" className="mt-5 rounded-xl bg-wine/10 px-4 py-3 text-center font-semibold text-wine">
          {p.error}
        </p>
      )}

      <button
        type="submit"
        disabled={p.loading}
        className="btn-brown shimmer relative mx-auto mt-5 flex w-full max-w-md items-center justify-center gap-3 overflow-hidden rounded-full px-6 py-4 btn-label text-[19px] whitespace-nowrap text-white transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
      >
        {p.loading ? (
          <>
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
            Designing your nails…
          </>
        ) : (
          <>
            <SparkleIcon className="h-7 w-7" />
            Generate Nail Design
            <ChevronRightIcon className="absolute right-5 h-6 w-6" />
          </>
        )}
      </button>
    </div>
  );
}
