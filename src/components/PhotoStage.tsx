"use client";

import type { DragEvent, ReactNode } from "react";
import { CloseIcon, CloudUploadIcon, SparkleIcon, UploadIcon } from "./icons";
import type { HandCheck } from "@/lib/handDetector";

export type GenError = { message: string; retryable: boolean };

type Props = {
  file: File | null;
  previewUrl: string | null;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  openPicker: () => void;
  removePhoto: () => void;
  loading: boolean;
  handCheck: HandCheck;
  genError: GenError | null;
  onRetry: () => void;
};

const CORNERS = [
  "top-0 left-0 border-t-2 border-l-2",
  "top-0 right-0 border-t-2 border-r-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
];

function Pill({ children, onClick, label }: { children: ReactNode; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/65"
    >
      {children}
    </button>
  );
}

/**
 * One frame for the whole photo flow: empty drop zone → uploaded photo →
 * checking → generating / error. The finished design opens in ResultView.
 */
export default function PhotoStage(p: Props) {
  const hasPhoto = !!p.previewUrl;
  const check = p.handCheck;
  const failed = check.status === "fail";

  return (
    <div
      role={hasPhoto ? undefined : "button"}
      tabIndex={hasPhoto ? undefined : 0}
      aria-label={hasPhoto ? undefined : "Upload a photo of your hand"}
      onClick={hasPhoto ? undefined : p.openPicker}
      onKeyDown={(e) => {
        if (!hasPhoto && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          p.openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        p.setDragging(true);
      }}
      onDragLeave={() => p.setDragging(false)}
      onDrop={p.onDrop}
      className={`relative aspect-[5/3] overflow-hidden rounded-2xl outline-none transition focus-visible:ring-4 focus-visible:ring-gold/30 ${
        hasPhoto
          ? "border-4 border-white bg-cocoa shadow-[0_18px_40px_-20px_rgba(90,50,40,0.6)]"
          : `cursor-pointer border-[3px] bg-[linear-gradient(135deg,#fbf6f3,#efe4df_50%,#f7efeb)] shadow-[0_14px_30px_-18px_rgba(90,50,40,0.6)] ${
              p.dragging ? "border-gold border-dashed" : "border-white"
            }`
      }`}
    >
      {/* ── empty state ── */}
      {!hasPhoto && (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <CloudUploadIcon className="h-14 w-14 text-gold-dark" strokeWidth={1.4} />
          <p className="mt-2 font-serif text-lg text-cocoa">
            <span className="pointer-fine:hidden">Tap to upload or take a photo</span>
            <span className="hidden pointer-fine:inline">Click or drag &amp; drop your hand photo</span>
          </p>
          <p className="mt-1 text-sm text-cocoa-soft">Your nail design will appear right here</p>
        </div>
      )}

      {/* ── photo ── */}
      {p.previewUrl && (
        <>
          {/* blurred fill so any photo ratio looks good in the frame */}
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={p.previewUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img
            src={p.previewUrl}
            alt="Your uploaded hand"
            className={`absolute inset-0 h-full w-full object-contain transition ${p.loading ? "scale-[1.02] opacity-60 blur-[2px]" : ""}`}
          />
        </>
      )}

      {/* scan-frame corners */}
      {hasPhoto && (
        <div className="pointer-events-none absolute inset-3" aria-hidden>
          {CORNERS.map((c) => (
            <span key={c} className={`absolute h-7 w-7 rounded-[0.25rem] border-white ${c}`} />
          ))}
        </div>
      )}

      {/* ── generating ── */}
      {p.loading && (
        <div className="absolute inset-0 grid place-items-center bg-cocoa/25" role="status">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/85 px-6 py-4 shadow-lg backdrop-blur">
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold-dark" />
            <span className="font-serif text-lg text-cocoa">Designing your nails…</span>
            <span className="-mt-2 text-sm text-cocoa-soft">This usually takes 2–3 minutes</span>
          </div>
        </div>
      )}

      {/* ── toolbar ── */}
      {hasPhoto && !p.loading && (
        <div className="absolute top-3 right-3 flex items-start gap-2">
          <div className="flex gap-2">
            <Pill onClick={p.openPicker} label="Change photo">
              <UploadIcon className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Change</span>
            </Pill>
            <Pill onClick={p.removePhoto} label="Remove photo">
              <CloseIcon className="h-4 w-4" />
            </Pill>
          </div>
        </div>
      )}

      {/* ── generation failed ── */}
      {p.genError && !p.loading && (
        <div className={`absolute inset-0 grid place-items-center bg-cocoa/35 backdrop-blur-[2px] p-2 sm:p-4`} role="alert">
          <div className={`max-w-sm rounded-2xl bg-white/95 text-center shadow-xl px-3 py-2.5 sm:px-5 sm:py-4`}>
            <p className={`font-serif leading-snug text-wine text-base sm:text-lg`}>We couldn&apos;t create your design</p>
            <p className={`mt-1 leading-snug text-cocoa line-clamp-3 text-[13px] sm:line-clamp-none sm:text-sm`}>{p.genError.message}</p>
            <div className={`flex justify-center gap-2 mt-2 sm:mt-3`}>
              {p.genError.retryable ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onRetry();
                  }}
                  className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-1.5 font-serif text-base text-white"
                >
                  <SparkleIcon className="h-4 w-4" />
                  Try again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    p.openPicker();
                  }}
                  className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-1.5 font-serif text-base text-white"
                >
                  <UploadIcon className="h-4 w-4" />
                  Choose another photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── hand check ── */}
      {hasPhoto && !p.loading && !p.genError && (
        <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]" role="status" aria-live="polite">
          {check.status === "checking" && (
            <span className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Checking your photo…
            </span>
          )}
          {check.status === "ok" && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-700/85 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
              ✓ {check.message}
            </span>
          )}
          {(check.status === "warn" || check.status === "error") && (
            <span
              className={`flex items-start gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white backdrop-blur ${
                check.status === "warn" ? "bg-amber-700/85" : "bg-black/55"
              }`}
            >
              <span aria-hidden>!</span>
              {check.message}
            </span>
          )}
        </div>
      )}

      {failed && !p.loading && (
        <div className="absolute inset-0 grid place-items-center bg-wine/35 p-4 backdrop-blur-[2px]" role="alert">
          <div className="max-w-sm rounded-2xl bg-white/95 px-5 py-4 text-center shadow-xl">
            <p className="font-serif text-lg leading-snug text-wine">No hand found</p>
            <p className="mt-1 text-sm leading-snug text-cocoa">{check.message}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                p.openPicker();
              }}
              className="btn-gold mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2 font-serif text-base text-white"
            >
              <UploadIcon className="h-4 w-4" />
              Choose another photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
