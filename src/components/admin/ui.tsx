"use client";
/* eslint-disable @next/next/no-img-element -- previews of uploaded images */

import { useEffect, useRef, useState } from "react";
import type { Pattern } from "@/lib/data";
import NailArt from "../NailArt";
import { CloseIcon } from "../Icons";
import { useAdmin } from "./AdminContext";

export const inputCls =
  "h-10 w-full rounded-lg border border-[#ddd5db] bg-white px-3 text-[14px] text-plum outline-none transition placeholder:text-[#a59ba3] focus:border-plum focus:ring-2 focus:ring-plum/15 disabled:bg-[#f6f3f5]";
export const textareaCls = inputCls.replace("h-10", "min-h-[110px] py-2.5");

export const PATTERNS: Pattern[] = ["solid", "french", "dots", "stripes", "stars", "plaid", "ombre", "hearts", "flowers", "leopard", "chrome", "lights"];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] leading-tight font-medium">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "" }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[#ebe4e9] bg-white p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

type BtnKind = "primary" | "secondary" | "danger" | "ghost";
const BTN: Record<BtnKind, string> = {
  primary: "bg-plum text-white hover:bg-plum-light",
  secondary: "border border-[#ddd5db] bg-white hover:bg-[#f6f3f5]",
  danger: "border border-[#f0c8cf] bg-white text-[#b0263c] hover:bg-[#fdf1f3]",
  ghost: "hover:bg-[#f3eef1]",
};
export function Button({ kind = "secondary", small, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: BtnKind; small?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${small ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]"} ${BTN[kind]} ${className}`}
    />
  );
}

const STATUS_COLORS: Record<string, string> = {
  Processing: "bg-[#fff4d6] text-[#8a6100]",
  "In production": "bg-[#e7effc] text-[#2a5bb5]",
  Shipped: "bg-[#efe7fb] text-[#6b3fb3]",
  Delivered: "bg-[#e3f5ea] text-[#1f7a46]",
  Cancelled: "bg-[#f3f3f3] text-[#777]",
  Active: "bg-[#e3f5ea] text-[#1f7a46]",
  Hidden: "bg-[#f3f3f3] text-[#777]",
};
export function Badge({ children }: { children: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap ${STATUS_COLORS[children] ?? "bg-[#f3eef1] text-plum"}`}>{children}</span>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 text-[14px]">
      <span className={`relative h-6 w-10 rounded-full transition ${checked ? "bg-plum" : "bg-[#d9d1d7]"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={`animate-fadein relative w-full rounded-xl bg-white p-6 shadow-2xl ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close"><CloseIcon width={20} height={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-12 text-center text-[14px] text-muted">{children}</p>;
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg border border-[#f0c8cf] bg-[#fdf1f3] px-3 py-2 text-[13.5px] text-[#b0263c]">{children}</p>;
}

/** Table wrapper with horizontal scroll on small screens. */
export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#ebe4e9] bg-white">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <thead className="border-b border-[#ebe4e9] bg-[#faf7f9] text-[12px] font-semibold uppercase tracking-wide text-muted">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#f1ecef]">{children}</tbody>
      </table>
    </div>
  );
}

/** Four colour pickers + pattern select with a live preview of the generated artwork. */
export function ArtEditor({
  palette,
  pattern,
  shape,
  onChange,
  variant = "hand",
}: {
  palette: [string, string, string, string];
  pattern: Pattern;
  shape?: string;
  onChange: (v: { palette: [string, string, string, string]; pattern: Pattern }) => void;
  variant?: "hand" | "set" | "bundle" | "tool";
}) {
  const labels = ["Background", "Base", "Accent", "Detail"];
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {palette.map((c, i) => (
            <label key={i} className="text-center text-[11.5px] text-muted">
              <input
                type="color"
                value={c}
                onChange={(e) => {
                  const next = [...palette] as [string, string, string, string];
                  next[i] = e.target.value;
                  onChange({ palette: next, pattern });
                }}
                className="h-10 w-full cursor-pointer rounded-lg border border-[#ddd5db] bg-white p-1"
              />
              {labels[i]}
            </label>
          ))}
        </div>
        <Field label="Pattern">
          <select className={inputCls} value={pattern} onChange={(e) => onChange({ palette, pattern: e.target.value as Pattern })}>
            {PATTERNS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <NailArt palette={palette} pattern={pattern} shape={shape} variant={variant} className="aspect-square w-full rounded-lg border border-[#ebe4e9]" />
    </div>
  );
}

/** Multi-image uploader with drag & drop, reordering and removal. The first image is the cover. */
export function ImageList({ value, onChange, max = 12 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const { upload, notify } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [over, setOver] = useState(false);

  const add = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    if (!list.length) return;
    setBusy(list.length);
    const urls: string[] = [];
    for (const f of list) {
      try {
        urls.push(await upload(f));
      } catch (e) {
        notify(`${f.name}: ${(e as Error).message}`, "error");
      }
      setBusy((b) => b - 1);
    }
    onChange([...value, ...urls]);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-[#ebe4e9] bg-card">
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-plum px-1.5 py-0.5 text-[10px] font-bold text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/45 p-1 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="rounded px-1.5 text-white disabled:opacity-30" disabled={i === 0} aria-label="Move left">←</button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded px-1.5 text-[12px] text-white">Remove</button>
              <button type="button" onClick={() => move(i, 1)} className="rounded px-1.5 text-white disabled:opacity-30" disabled={i === value.length - 1} aria-label="Move right">→</button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              add(e.dataTransfer.files);
            }}
            className={`grid aspect-square place-items-center rounded-lg border-2 border-dashed text-center text-[12.5px] text-muted transition ${over ? "border-plum bg-pink-soft" : "border-[#ddd5db] hover:border-plum"}`}
          >
            {busy ? `Uploading ${busy}…` : <span>+ Add images<br /><span className="text-[11px]">or drop here</span></span>}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden onChange={(e) => e.target.files && add(e.target.files)} />
      <p className="mt-2 text-[12px] text-muted">JPG, PNG, WebP, GIF or AVIF up to 8 MB. Without images the store shows the generated artwork.</p>
    </div>
  );
}

/** Single image field (cover image for collections and articles). */
export function SingleImage({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  return <ImageList value={value ? [value] : []} onChange={(v) => onChange(v[0] ?? null)} max={1} />;
}

export const money = (n: number) => `$${n.toFixed(2)}`;
export const dateTime = (s: string) => new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
