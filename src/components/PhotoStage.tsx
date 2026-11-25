"use client";

import { SparkleIcon, UploadIcon } from "./icons";

export type GenError = { message: string; retryable: boolean };

/** Over the hand photo while the first design is being made. */
export function GeneratingOverlay() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-cocoa/25" role="status">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/85 px-6 py-4 shadow-lg backdrop-blur">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold-dark" />
        <span className="font-serif text-lg text-cocoa">Designing your nails…</span>
        <span className="-mt-2 text-sm text-cocoa-soft">This usually takes 2–3 minutes</span>
      </div>
    </div>
  );
}

/** Over the hand photo when the first design failed: try again, or pick another photo. */
export function ErrorOverlay({ error, onRetry, openPicker }: { error: GenError; onRetry: () => void; openPicker: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-cocoa/35 p-2 backdrop-blur-[2px] sm:p-4" role="alert">
      <div className="max-w-sm rounded-2xl bg-white/95 px-3 py-2.5 text-center shadow-xl sm:px-5 sm:py-4">
        <p className="font-serif text-base leading-snug text-wine sm:text-lg">We couldn&apos;t create your design</p>
        <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-cocoa sm:line-clamp-none sm:text-sm">{error.message}</p>
        <div className="mt-2 flex justify-center gap-2 sm:mt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (error.retryable) onRetry();
              else openPicker();
            }}
            className="btn-gold btn-label inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-[15px] text-white"
          >
            {error.retryable ? <SparkleIcon className="h-4 w-4" /> : <UploadIcon className="h-4 w-4" />}
            {error.retryable ? "Try again" : "Choose another photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
