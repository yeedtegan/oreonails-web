"use client";

import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { CloseIcon, GalleryIcon } from "./icons";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_REFS } from "@/lib/constants";

/**
 * Reference photos the customer attaches to a request (inspiration for colors / art): pick, paste or drop,
 * up to MAX_REFS, JPG / PNG / WEBP, 10 MB each. `onError` gets a message for what was left out.
 */
export function useRefPhotos(onError: (message: string) => void) {
  const [refs, setRefs] = useState<File[]>([]);

  function add(files: Iterable<File>) {
    const next = [...refs];
    const problems = new Set<string>();
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        problems.add("Reference photos must be JPG, PNG or WEBP.");
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        problems.add(`${f.name} is over 10 MB.`);
        continue;
      }
      if (next.length >= MAX_REFS) {
        problems.add(`You can attach up to ${MAX_REFS} reference photos.`);
        break;
      }
      next.push(f);
    }
    setRefs(next);
    if (problems.size) onError([...problems].join(" "));
  }

  /** paste images from the clipboard into a text box */
  function onPaste(e: ClipboardEvent) {
    const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    add(files);
  }

  return {
    refs,
    add,
    onPaste,
    remove: (i: number) => setRefs((cur) => cur.filter((_, k) => k !== i)),
    clear: () => setRefs([]),
  };
}

/**
 * <img> of a Blob: the object URL is made in an effect and freed in its cleanup — so it is made again whenever the
 * effect runs again (React re-runs effects in dev / Strict Mode; a URL made once in useMemo would be freed and the
 * image would break). `onUrl` gets the current URL (to open it larger).
 */
function BlobImg({ blob, alt, className, onUrl }: { blob: Blob; alt: string; className?: string; onUrl?: (url: string) => void }) {
  const ref = useRef<HTMLImageElement>(null);
  const onUrlRef = useRef(onUrl);
  useEffect(() => {
    onUrlRef.current = onUrl;
  });
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (ref.current) ref.current.src = url;
    onUrlRef.current?.(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  // eslint-disable-next-line @next/next/no-img-element -- local image, src set by the effect above
  return <img ref={ref} alt={alt} className={className} />;
}

/** round "attach photos" button (a label around a hidden multi-file input) */
export function AttachButton({ onFiles, disabled, className = "" }: { onFiles: (files: File[]) => void; disabled?: boolean; className?: string }) {
  return (
    <label
      title="Add reference photos"
      className={`grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-brown transition hover:bg-pink-2 ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`}
    >
      <GalleryIcon className="h-[22px] w-[22px]" />
      <span className="sr-only">Attach reference photos</span>
      <input
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

/** thumbnails of the attached photos, each with a remove button */
export function RefStrip({ refs, onRemove, note, size = "md" }: { refs: File[]; onRemove: (i: number) => void; note?: string; size?: "sm" | "md" }) {
  if (!refs.length) return null;
  const box = size === "sm" ? "h-11 w-11 rounded-[10px]" : "h-[58px] w-[58px] rounded-xl";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {refs.map((r, i) => (
        <div key={`${r.name}-${r.size}-${i}`} className={`relative shrink-0 overflow-hidden border border-line soft-shadow ${box}`}>
          <BlobImg blob={r} alt={r.name} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove ${r.name}`}
            className="absolute top-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-cocoa/75 text-white"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
      <span className="text-[12.5px] text-cocoa-soft">
        {refs.length} reference photo{refs.length > 1 ? "s" : ""}
        {note ? ` · ${note}` : ""}
      </span>
    </div>
  );
}

/** the photos inside a chat bubble (tap → larger) */
export function RefGrid({ refs, onOpen }: { refs: Blob[]; onOpen: (url: string) => void }) {
  if (!refs.length) return null;
  return (
    <div className={`mb-1.5 grid max-w-[240px] gap-1 overflow-hidden rounded-xl ${refs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {refs.map((r, i) => (
        <RefGridItem key={i} blob={r} n={i + 1} wide={refs.length === 1} onOpen={onOpen} />
      ))}
    </div>
  );
}

/** one photo in a chat bubble; opens the URL its image is showing right now */
function RefGridItem({ blob, n, wide, onOpen }: { blob: Blob; n: number; wide: boolean; onOpen: (url: string) => void }) {
  const url = useRef("");
  return (
    <button type="button" onClick={() => url.current && onOpen(url.current)} aria-label={`Reference photo ${n}, larger`} className="block">
      <BlobImg blob={blob} alt="" onUrl={(u) => (url.current = u)} className={`w-full object-cover ${wide ? "aspect-[4/3]" : "aspect-square"}`} />
    </button>
  );
}
