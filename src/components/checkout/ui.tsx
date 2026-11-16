"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Logo } from "@/components/Icons";
import { ProductArt } from "@/components/Art";
import { money } from "@/lib/pricing";
import type { Product } from "@/lib/data";

/*
 * Building blocks for the one-page checkout. The look follows Shopify's checkout: system font,
 * 5px radius, #dedede borders, floating labels, a grey order-summary column, and the store colour
 * as the accent.
 */

export const ACCENT = "#4b384c";
/** sessionStorage key holding the order number being paid, so the thank-you page knows to clear the cart. */
export const CHECKOUT_SESSION_KEY = "oreonails-checkout";
export const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const fieldBase =
  "peer block h-[50px] w-full rounded-[5px] border bg-white px-[11px] text-[14px] text-black outline-none transition-[box-shadow,border-color] placeholder:text-transparent";
const fieldState = (error?: string) =>
  error
    ? "border-[#dd1d1d] shadow-[0_0_0_1px_#dd1d1d]"
    : "border-[#dedede] focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_var(--accent)]";

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-4 text-[#dd1d1d]">
      <svg width="14" height="14" viewBox="0 0 14 14" className="mt-px shrink-0" aria-hidden>
        <circle cx="7" cy="7" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 3.8v4M7 9.6v.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {error}
    </p>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  value: string;
  onValue: (v: string) => void;
  error?: string;
  /** Icon or button shown inside the right edge. */
  suffix?: React.ReactNode;
};

/** Text input whose label sits inside as the placeholder and shrinks to the top once there's a value. */
export function FloatingInput({ label, value, onValue, error, suffix, className = "", id: idProp, ...rest }: InputProps) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={className}>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`${fieldBase} ${fieldState(error)} pb-[4px] pt-[19px] placeholder-shown:py-0 ${suffix ? "pr-10" : ""}`}
          {...rest}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-[12px] top-[6px] max-w-[calc(100%-24px)] truncate text-[12px] leading-4 text-[#707070] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[14px]"
        >
          {label}
        </label>
        {suffix && <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#707070]">{suffix}</div>}
      </div>
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

/** Select with the label always shown small at the top, as in Shopify. */
export function FloatingSelect({
  label,
  value,
  onValue,
  options,
  error,
  placeholder,
  className = "",
  autoComplete,
}: {
  label: string;
  value: string;
  onValue: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={`${fieldBase} ${fieldState(error)} appearance-none pb-[4px] pr-9 pt-[19px] ${value ? "" : "text-[#707070]"}`}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label htmlFor={id} className="pointer-events-none absolute left-[12px] top-[6px] text-[12px] leading-4 text-[#707070]">{label}</label>
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#707070]" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-[10px] text-[14px] text-black">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)] ${
          checked ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[#dedede] bg-white"
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="m2.5 6.2 2.3 2.3 4.7-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </span>
      {children}
    </label>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${checked ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[#dedede] bg-white"}`}>
      {checked && <span className="h-[6px] w-[6px] rounded-full bg-white" />}
    </span>
  );
}

export const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><rect x="3" y="7" width="10" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
);

export function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative flex">
      <button type="button" aria-label={text} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M6.3 6.2a1.8 1.8 0 0 1 3.5.5c0 1.2-1.8 1.4-1.8 2.6M8 11.2v.3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <span role="tooltip" className="absolute bottom-[calc(100%+8px)] right-[-8px] z-10 w-[220px] rounded-[5px] bg-[#333] px-3 py-2 text-[12px] leading-4 text-white shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

export const TagIcon = (p: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className={p.className}><path d="M2 8.6V2.8a.8.8 0 0 1 .8-.8h5.8l5.6 5.6a.8.8 0 0 1 0 1.1l-4.9 4.9a.8.8 0 0 1-1.1 0Z" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="5.3" cy="5.3" r="1" fill="currentColor" /></svg>
);

/* ---------------- payment brand badges ---------------- */

function Badge({ children, bg = "#fff", label }: { children: React.ReactNode; bg?: string; label: string }) {
  return (
    <span role="img" aria-label={label} className="grid h-[20px] w-[32px] place-items-center overflow-hidden rounded-[3px] border border-[#d9d9d9]" style={{ background: bg }}>
      {children}
    </span>
  );
}

export const VisaBadge = () => (
  <Badge label="Visa"><span className="text-[9px] font-black italic tracking-tight text-[#1a1f71]">VISA</span></Badge>
);
export const MastercardBadge = () => (
  <Badge label="Mastercard">
    <svg width="22" height="14" viewBox="0 0 22 14"><circle cx="8" cy="7" r="6" fill="#eb001b" /><circle cx="14" cy="7" r="6" fill="#f79e1b" /><path d="M11 2.2a6 6 0 0 1 0 9.6 6 6 0 0 1 0-9.6Z" fill="#ff5f00" /></svg>
  </Badge>
);
export const AmexBadge = () => (
  <Badge label="American Express" bg="#1f72cd"><span className="text-[6.5px] font-black tracking-tight text-white">AMEX</span></Badge>
);
export const DiscoverBadge = () => (
  <Badge label="Discover"><span className="flex items-center text-[5.5px] font-bold tracking-tight text-black">DISC<span className="mx-[0.5px] inline-block h-[5px] w-[5px] rounded-full bg-[#f48120]" />VER</span></Badge>
);
export const PaypalWordmark = ({ className = "" }: { className?: string }) => (
  <span aria-label="PayPal" className={`font-sans text-[17px] font-extrabold italic tracking-tight ${className}`}>
    <span className="text-[#003087]">Pay</span>
    <span className="text-[#009cde]">Pal</span>
  </span>
);

export function CardBadges({ extra = 0 }: { extra?: number }) {
  return (
    <span className="flex items-center gap-[5px]">
      <VisaBadge />
      <MastercardBadge />
      <AmexBadge />
      <span className="hidden sm:flex"><DiscoverBadge /></span>
      {extra > 0 && <span className="grid h-[20px] min-w-[32px] place-items-center rounded-[3px] border border-[#d9d9d9] bg-white px-1 text-[11px] text-[#707070]">+{extra}</span>}
    </span>
  );
}

/* ---------------- page frame ---------------- */

export function CheckoutHeader() {
  return (
    <header className="border-b border-[#dedede] bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1104px] items-center justify-between px-[21px] lg:h-[90px] lg:px-[38px]">
        <Link href="/" aria-label="Oreo Nails home" className="text-black">
          <Logo className="scale-[1.15] origin-left items-start" />
        </Link>
        <Link href="/cart" aria-label="Cart" className="text-[var(--accent)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M5 8h14l-1 12.2a1 1 0 0 1-1 .8H7a1 1 0 0 1-1-.8L5 8Z" />
            <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

const POLICIES = [
  { label: "Refund policy", href: "/pages/return-policy" },
  { label: "Shipping", href: "/pages/shipping-policy" },
  { label: "Privacy policy", href: "/pages/privacy-policy" },
  { label: "Terms of service", href: "/pages/terms-of-service" },
  { label: "Contact", href: "/pages/contact" },
];

export function CheckoutFooter() {
  return (
    <footer className="mt-8 flex flex-wrap gap-x-[18px] gap-y-2 border-t border-[#dedede] py-[18px] text-[12px]">
      {POLICIES.map((p) => (
        <Link key={p.href} href={p.href} className="text-[var(--accent)] underline underline-offset-2">{p.label}</Link>
      ))}
    </footer>
  );
}

/** Two-column frame: white main column, grey summary column filling the right half on desktop. */
export function CheckoutFrame({ main, summary, mobileSummary }: { main: React.ReactNode; summary: React.ReactNode; mobileSummary?: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-white text-[14px] text-black antialiased"
      style={{ ["--accent" as string]: ACCENT, fontFamily: SYSTEM_FONT }}
    >
      <CheckoutHeader />
      {mobileSummary}
      <div className="lg:grid lg:min-h-[calc(100vh-90px)] lg:grid-cols-2">
        <div className="lg:flex lg:justify-end lg:border-r lg:border-[#dedede]">
          <div className="w-full px-[21px] pb-4 pt-[21px] lg:max-w-[590px] lg:px-[38px] lg:pt-[38px]">{main}</div>
        </div>
        <aside className="hidden bg-[#f5f5f5] lg:block">
          <div className="sticky top-0 w-full max-w-[510px] px-[38px] py-[38px]">{summary}</div>
        </aside>
      </div>
    </div>
  );
}

/** "Order summary ⌄ $00.00" bar that expands the summary on phones and tablets. */
export function MobileSummary({ total, children }: { total: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#dedede] bg-[#f5f5f5] lg:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-[60px] w-full items-center justify-between px-[21px]">
        <span className="flex items-center gap-1.5 text-[14px] text-[var(--accent)]">
          {open ? "Hide order summary" : "Order summary"}
          <svg width="14" height="14" viewBox="0 0 14 14" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className="text-[19px] font-semibold">{total}</span>
      </button>
      {open && <div className="border-t border-[#dedede] px-[21px] pb-[21px] pt-[21px]">{children}</div>}
    </div>
  );
}

/* ---------------- order summary ---------------- */

export interface SummaryLine {
  key: string;
  title: string;
  variant?: string;
  qty: number;
  total: number;
  product?: Product;
  shape?: string;
}

export function SummaryItems({ lines }: { lines: SummaryLine[] }) {
  return (
    <ul className="space-y-[14px]">
      {lines.map((l) => (
        <li key={l.key} className="flex items-center gap-[14px]">
          <span className="relative shrink-0">
            <span className="block h-[64px] w-[64px] overflow-hidden rounded-[8px] border border-[#dedede] bg-white">
              {l.product ? <ProductArt product={l.product} shape={l.shape} className="h-full w-full" /> : <span className="block h-full w-full bg-[#ece7eb]" />}
            </span>
            <span className="absolute -right-[9px] -top-[9px] grid h-[21px] min-w-[21px] place-items-center rounded-full bg-[#666] px-[6px] text-[12px] font-medium text-white">{l.qty}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium leading-[18px]">{l.title}</span>
            {l.variant && <span className="mt-0.5 block text-[12px] leading-4 text-[#707070]">{l.variant}</span>}
          </span>
          <span className="text-[14px]">{money(l.total)}</span>
        </li>
      ))}
    </ul>
  );
}

export function SummaryRow({ label, value, muted, children }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[14px]">
      <span>
        {label}
        {children}
      </span>
      <span className={muted ? "text-[#707070]" : ""}>{value}</span>
    </div>
  );
}

export function SummaryTotal({ total, savings }: { total: number; savings: number }) {
  return (
    <>
      <div className="flex items-baseline justify-between pt-1">
        <span className="text-[19px] font-semibold">Total</span>
        <span className="flex items-baseline gap-2">
          <span className="text-[12px] text-[#707070]">USD</span>
          <span className="text-[19px] font-semibold">{money(total)}</span>
        </span>
      </div>
      {savings > 0 && (
        <p className="flex items-center gap-1.5 text-[14px] font-semibold">
          <TagIcon />
          TOTAL SAVINGS <span className="ml-1">{money(savings)}</span>
        </p>
      )}
    </>
  );
}
