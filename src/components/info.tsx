import Link from "next/link";
import { CheckIcon } from "./Icons";

/*
 * Building blocks for the reference "info page" template: plum dotted hero, lavender page,
 * white 828px cards overlapping the hero, icon-square card headers, checklists, tiles, callouts.
 */

const DOTS =
  "radial-gradient(rgba(255,255,255,0.22) 1.2px, transparent 1.3px) 0 0 / 28px 28px, radial-gradient(ellipse at 85% 0%, rgba(255,255,255,0.10), transparent 55%), linear-gradient(180deg, #4b384c 0%, #4a3549 100%)";

export function InfoHero({
  eyebrow,
  title,
  intro,
  actions,
  anchors,
  center,
  width = 828,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  actions?: React.ReactNode;
  anchors?: { id: string; label: string }[];
  center?: boolean;
  width?: number;
}) {
  return (
    <section className="text-white" style={{ background: DOTS }}>
      <div className={`mx-auto px-4 pt-11 pb-[88px] md:px-0 ${center ? "text-center" : ""}`} style={{ maxWidth: width }}>
        {eyebrow && <p className="font-work text-[11px] font-semibold uppercase tracking-[2.2px] text-white/85">{eyebrow}</p>}
        <h1 className="mt-2 font-playfair-display text-[36px] leading-[1.15] font-normal md:text-[48px]">{title}</h1>
        {intro && <div className={`mt-2.5 text-[15.5px] leading-[1.7] font-medium text-white/90 ${center ? "mx-auto max-w-[500px]" : "max-w-[600px]"}`}>{intro}</div>}
        {actions && <div className={`mt-5 flex flex-wrap gap-2.5 ${center ? "justify-center" : ""}`}>{actions}</div>}
        {anchors && (
          <>
            <p className="mt-6 font-work text-[10.5px] font-semibold uppercase tracking-[2px] text-white/70">On this page</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {anchors.map((a) => (
                <a key={a.id} href={`#${a.id}`} className="flex h-[38px] items-center rounded-full border border-white/35 bg-white/10 px-4 text-[14px] font-semibold transition hover:bg-white/20">
                  {a.label}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Lavender page body; cards overlap the hero by 44px. */
export function InfoBody({ children, width = 828 }: { children: React.ReactNode; width?: number }) {
  return (
    <div className="flow-root bg-[#f6f1f5] pb-16">
      <div className="mx-auto -mt-11 flex flex-col gap-4 px-3 md:px-0" style={{ maxWidth: width }}>
        {children}
      </div>
    </div>
  );
}

export function InfoCard({
  id,
  icon,
  number,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id?: string;
  icon?: React.ReactNode;
  number?: number;
  eyebrow?: string;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-28 rounded-2xl bg-white p-5 shadow-[0_2px_14px_rgba(75,56,76,0.06)] md:p-8 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center gap-3">
          {number !== undefined ? (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-plum text-[15px] font-bold text-white">{number}</span>
          ) : icon ? (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[#f3ebf2]">{icon}</span>
          ) : null}
          <div>
            {eyebrow && <p className="font-work text-[11px] font-semibold uppercase tracking-[1.8px] text-muted">{eyebrow}</p>}
            <h2 className="font-playfair-display text-[24px] leading-[1.2] font-normal md:text-[28px]">{title}</h2>
          </div>
        </div>
      )}
      <div className="text-[15.5px] leading-[1.75] text-plum/90">{children}</div>
    </section>
  );
}

type BtnKind = "white" | "ghost" | "plum" | "outline";
const BTN: Record<BtnKind, string> = {
  white: "bg-white text-plum hover:bg-white/90",
  ghost: "border border-white/70 text-white hover:bg-white/10",
  plum: "bg-plum text-white hover:bg-plum-light",
  outline: "border border-plum text-plum hover:bg-plum/5",
};

/** Bold pill button used across info pages (50px tall, Nunito 700). */
export function Pill({ href, kind = "plum", children, className = "", onClick, type }: { href?: string; kind?: BtnKind; children: React.ReactNode; className?: string; onClick?: () => void; type?: "submit" | "button" }) {
  const cls = `inline-flex h-[50px] items-center justify-center gap-2 rounded-full px-[23px] text-[15px] font-bold transition ${BTN[kind]} ${className}`;
  if (href) {
    const external = href.startsWith("mailto:") || href.startsWith("http") || href.startsWith("#");
    return external ? <a href={href} className={cls}>{children}</a> : <Link href={href} className={cls}>{children}</Link>;
  }
  return <button type={type ?? "button"} onClick={onClick} className={cls}>{children}</button>;
}

export function CheckList({ items, cols = 1 }: { items: React.ReactNode[]; cols?: 1 | 2 }) {
  return (
    <ul className={`mt-3 grid gap-x-8 gap-y-2.5 ${cols === 2 ? "md:grid-cols-2" : ""}`}>
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-[1.6]">
          <span className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-plum text-white"><CheckIcon width={12} height={12} strokeWidth={2.4} /></span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** Bordered tile with icon square, bold title and muted text. */
export function IconTile({ icon, title, children }: { icon: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3.5 rounded-xl border border-line p-[18px]">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#f3ebf2]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[15.5px] font-bold">{title}</p>
        {children && <div className="mt-0.5 text-[14.5px] leading-[1.6] text-muted">{children}</div>}
      </div>
    </div>
  );
}

export function Callout({ icon, title, children }: { icon: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-3 rounded-xl bg-[#f3ebf2] p-[18px]">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[15px] font-bold">{title}</p>
        {children && <div className="mt-1 text-[14.5px] leading-[1.6]">{children}</div>}
      </div>
    </div>
  );
}

export function StatTiles({ items }: { items: { big: string; small: string }[] }) {
  return (
    <div className="grid gap-3.5 md:grid-cols-3">
      {items.map((s) => (
        <div key={s.big} className="rounded-xl bg-[#f3ebf2] px-4 py-5 text-center">
          <p className="text-[26px] leading-none font-extrabold">{s.big}</p>
          <p className="mt-2 text-[13px] text-muted">{s.small}</p>
        </div>
      ))}
    </div>
  );
}

/** Numbered rows (plum circle + bold title + text) separated by hairlines. */
export function NumberedRows({ items }: { items: { title: string; text: React.ReactNode }[] }) {
  return (
    <ol className="divide-y divide-line">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-3.5 py-3.5 first:pt-0 last:pb-0">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-plum text-[13px] font-bold text-white">{i + 1}</span>
          <div>
            <p className="text-[16px] font-bold">{s.title}</p>
            <div className="text-[15px] text-plum/85">{s.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Small numbered list with dark number dots (used inside method cards). */
export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[14.5px] leading-[1.6]">
          <span className="mt-[2px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-plum text-[11px] font-bold text-white">{i + 1}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}

/** Lavender-header table like the reference size/length charts. */
export function InfoTable({ head, rows, note }: { head: string[]; rows: (string | number)[][]; note?: React.ReactNode }) {
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] text-center text-[15px]">
          <thead>
            <tr className="bg-[#faf6f9] font-work text-[10.5px] font-semibold uppercase tracking-[1.4px] text-muted">
              {head.map((h, i) => (
                <th key={h} className={`h-[38px] font-semibold ${i === 0 ? "text-plum" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r[0])} className="border-t border-line">
                {r.map((c, i) => (
                  <td key={i} className={`h-[46px] ${i === 0 ? "bg-[#f3ebf2] font-work text-[12px] font-bold uppercase tracking-[1.2px]" : ""}`}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-3 text-[13px] leading-[1.6] text-muted">{note}</p>}
    </>
  );
}

/** Info-page accordion rows (hairline, + in pink circle). */
export function InfoAccordion({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="border-t border-line">
      {items.map((f) => (
        <details key={f.q} className="group border-b border-line">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-soft text-lg leading-none transition group-open:rotate-45">+</span>
          </summary>
          <div className="pb-5 text-[15px] leading-[1.7] text-muted">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
