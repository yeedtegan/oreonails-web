"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Collection, Product, SiteSettings } from "@/lib/data";
import { freeSetsFor, money } from "@/lib/pricing";
import { useStore } from "@/context/StoreContext";
import { artVariant } from "./ProductCard";
import { ChevronDown, CloseIcon, GiftIcon, PlusIcon, SearchIcon } from "./Icons";
import { ProductArt } from "@/components/Art";

const PAGE = 24;
const SLOT_GIFTS = new Set([3, 5, 8]); // slot numbers that become free at each tier
const SORTS: Record<string, (a: Product, b: Product) => number> = {
  "Best selling": (a, b) => a.rank - b.rank,
  Newest: (a, b) => b.added - a.added,
  "Price, low to high": (a, b) => a.price - b.price,
  "Price, high to low": (a, b) => b.price - a.price,
};

function Seg({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-11 shrink-0 items-center rounded-full bg-[#f1eaee] pl-3.5 pr-1 text-[13px]">
      <span className="mr-1.5 text-muted">{label}</span>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`h-9 min-w-9 rounded-full px-2 transition ${value === o ? "bg-white font-bold shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-muted hover:text-plum"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

/** "Build your bundle": filters + grid on the left, sticky "My bundle" card on the right. */
export default function BundleBuilder({ sets, site, collections }: { sets: Product[]; site: SiteSettings; collections: Collection[] }) {
  const { addToCart, setCartOpen } = useStore();
  const tiers = site.promoTiers;
  const sizes = site.sizes.filter((s) => s !== "Custom");
  const [size, setSize] = useState("S");
  const [shape, setShape] = useState("Almond");
  const [q, setQ] = useState("");
  const [col, setCol] = useState("all");
  const [sort, setSort] = useState("Best selling");
  const [limit, setLimit] = useState(PAGE);
  const [picked, setPicked] = useState<string[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => moreRef.current && !moreRef.current.contains(e.target as Node) && setMoreOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => setLimit(PAGE), [q, col, sort]);

  const chips = [
    { handle: "cozy-fall", badge: "Trend" },
    { handle: "holiday-glam", badge: "Last call" },
  ];
  const chipHandles = new Set(chips.map((c) => c.handle));
  const more = collections.filter((c) => (c.group === "collection" || c.group === "season") && !chipHandles.has(c.handle));
  const title = (h: string) => collections.find((c) => c.handle === h)?.title ?? h;

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sets
      .filter((p) => col === "all" || p.collections.includes(col))
      .filter((p) => !term || p.title.toLowerCase().includes(term) || p.pattern.includes(term))
      .sort(SORTS[sort]);
  }, [sets, q, col, sort]);

  const byHandle = useMemo(() => new Map(sets.map((p) => [p.handle, p])), [sets]);
  const items = picked.map((h) => byHandle.get(h)!).filter(Boolean);
  const setPrices = items.filter((p) => p.type === "set").map((p) => p.price).sort((a, b) => a - b);
  const free = freeSetsFor(setPrices.length, tiers);
  const saving = setPrices.slice(0, free).reduce((s, x) => s + x, 0);
  const subtotal = items.reduce((s, p) => s + p.price, 0);
  const count = setPrices.length;
  const next = tiers.find((t) => count < t.buy + t.get);
  const slots = Math.max(4, Math.ceil((picked.length + 1) / 4) * 4);
  const countOf = (h: string) => picked.filter((x) => x === h).length;

  const removeAt = (i: number) => setPicked((cur) => cur.filter((_, j) => j !== i));
  const addAll = () => {
    picked.forEach((h) => {
      const p = byHandle.get(h);
      addToCart(h, p?.type === "set" ? { size, shape } : {});
    });
    setPicked([]);
    setCartOpen(true);
  };

  return (
    <div className="mx-auto grid max-w-[1240px] items-start gap-8 px-3 pt-8 pb-16 md:pt-9 lg:grid-cols-[848px_1fr] lg:px-0">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-work text-[11.5px] font-medium uppercase tracking-[2.2px] text-[#b5577c]">Fall stock up · Mix &amp; match</p>
            <h1 className="mt-1.5 font-display text-[34px] leading-[1.15] font-medium md:text-[36px]">Build your bundle</h1>
            <p className="mt-2 text-[15px] font-medium text-plum/85">Pick any designs. Your cheapest sets are free, applied automatically.</p>
          </div>
          <div className="flex gap-2">
            {tiers.map((t) => {
              const reached = count >= t.buy + t.get;
              return (
                <div key={t.buy} className={`rounded-xl px-4 py-2 text-center ${reached ? "bg-plum text-white" : "bg-pink-soft"}`}>
                  <p className="font-work text-[11px] uppercase tracking-[1px]">{t.buy + t.get} sets</p>
                  <p className="text-[14px] font-medium">{t.get} free</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <label className="flex h-11 min-w-[240px] flex-1 items-center gap-2.5 rounded-full border border-line px-4">
            <SearchIcon width={14} height={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs" className="w-full bg-transparent text-[14px] outline-none placeholder:text-plum" />
          </label>
          <Seg label="Size" options={sizes} value={size} onChange={setSize} />
          <label className="relative flex h-11 items-center rounded-full bg-[#f1eaee] pl-3.5 pr-8 text-[13px]">
            <span className="mr-1.5 text-muted">Shape</span>
            <select value={shape} onChange={(e) => setShape(e.target.value)} className="appearance-none bg-transparent font-bold outline-none">
              {site.shapes.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown width={12} height={12} className="pointer-events-none absolute right-3" />
          </label>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-b border-line pb-4">
          <button onClick={() => setCol("all")} className={`h-[34px] rounded-full px-3.5 text-[13px] ${col === "all" ? "bg-plum text-white" : "border border-line"}`}>All</button>
          {chips.map((c) => (
            <button key={c.handle} onClick={() => setCol(c.handle)} className={`relative h-[34px] rounded-full px-3.5 text-[13px] ${col === c.handle ? "bg-plum text-white" : "border border-line"}`}>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#c0392b] px-1.5 py-[1px] font-work text-[8px] font-bold uppercase leading-[1.3] tracking-[0.8px] text-white">{c.badge}</span>
              {title(c.handle)}
            </button>
          ))}
          <button onClick={() => setCol("tools-accessories")} className={`h-[34px] rounded-full px-3.5 text-[13px] ${col === "tools-accessories" ? "bg-plum text-white" : "border border-line"}`}>Accessories</button>
          <div ref={moreRef} className="relative">
            <button onClick={() => setMoreOpen((o) => !o)} className={`flex h-[34px] items-center gap-1 rounded-full px-3.5 text-[13px] ${more.some((m) => m.handle === col) ? "bg-plum text-white" : "border border-line"}`}>
              {more.find((m) => m.handle === col)?.title ?? "More collections"} <span className="text-[8px]">▼</span>
            </button>
            {moreOpen && (
              <div className="animate-fadein absolute left-0 top-full z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                {more.map((m) => (
                  <button key={m.handle} onClick={() => { setCol(m.handle); setMoreOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-[13.5px] hover:bg-[#f6f1f5]">{m.title}</button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-4 text-[13px]">
            <Link href="/pages/sizing-guide" className="font-medium">Size guide</Link>
            <label className="relative">
              <span className="text-muted">Sort: </span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none bg-transparent pr-1 outline-none">
                {Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>

        <p className="mt-6 text-[12px] text-muted">{list.length} designs{list.length > limit ? " · more available" : ""}</p>
        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
          {list.slice(0, limit).map((p) => {
            const n = countOf(p.handle);
            return (
              <div key={p.handle}>
                <Link href={`/products/${p.handle}`} className="relative block overflow-hidden rounded-xl bg-card">
                  <ProductArt product={p} shape={p.type === "set" ? shape : p.shape} variant={artVariant(p)} className="aspect-square w-full" />
                  {p.compareAt && <span className="absolute left-2 top-2 rounded-full bg-plum px-2 py-[4px] font-work text-[9px] uppercase leading-none tracking-[0.8px] text-white">Sale</span>}
                </Link>
                <p className="mt-2.5 truncate text-[14.5px]">{p.title}</p>
                <p className="mt-0.5 text-[14.5px]">
                  {money(p.price)} {p.compareAt && <s className="ml-1 text-[12px] text-muted">{money(p.compareAt)}</s>}
                </p>
                <button
                  onClick={() => setPicked((cur) => [...cur, p.handle])}
                  className={`mt-2.5 h-[38px] w-full rounded-full border text-[13.5px] font-bold uppercase tracking-[1.2px] transition ${n ? "border-plum bg-plum text-white" : "border-plum hover:bg-plum/5"}`}
                >
                  {n ? `Added · ${n}  +` : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>
        {list.length > limit && (
          <div className="mt-6 text-center">
            <button onClick={() => setLimit((l) => l + PAGE)} className="h-[52px] rounded-full border border-line px-6 text-[13px] font-medium">Load more designs</button>
          </div>
        )}
        {list.length === 0 && <p className="py-20 text-center text-muted">No designs match.</p>}
      </div>

      {/* My bundle */}
      <aside className="rounded-[20px] border border-line bg-white p-5 shadow-[0_4px_20px_rgba(75,56,76,0.06)] lg:sticky lg:top-28">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold">My bundle</h2>
          <span className="text-[13px] text-muted">{count} sets</span>
        </div>
        <div className="relative mx-1.5 mt-5 h-[3px] rounded-full bg-[#ecdde6]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-plum transition-all" style={{ width: `${Math.min(100, (count / 8) * 100)}%` }} />
          {[3, 5, 8].map((n) => (
            <span key={n} className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${count >= n ? "border-plum bg-plum" : "border-[#c7b2c1] bg-white"}`} style={{ left: `${(n / 8) * 100}%` }} />
          ))}
        </div>
        <div className="relative mt-2 h-4 text-[10px] text-muted">
          {[3, 5, 8].map((n) => (
            <span key={n} className={`absolute ${n === 8 ? "right-0" : "-translate-x-1/2"}`} style={n === 8 ? undefined : { left: `${(n / 8) * 100}%` }}>{n} sets</span>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-pink-soft py-2 text-center text-[13px] font-medium">
          {next ? <>Add {next.buy + next.get - count} set{next.buy + next.get - count > 1 ? "s" : ""}, get {next.get} free</> : <>Max deal unlocked — {free} free sets 🎉</>}
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {Array.from({ length: slots }).map((_, i) => {
            const p = items[i];
            const gift = SLOT_GIFTS.has(i + 1);
            return p ? (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-card">
                <ProductArt product={p} shape={shape} variant={artVariant(p)} className="h-full w-full" />
                <button onClick={() => removeAt(i)} aria-label={`Remove ${p.title}`} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 opacity-0 transition group-hover:opacity-100">
                  <CloseIcon width={11} height={11} />
                </button>
              </div>
            ) : (
              <div key={i} className={`grid aspect-square place-items-center rounded-lg border border-dashed ${gift ? "border-[#e7b9c9] bg-pink-soft text-[#b5577c]" : "border-[#dccfd7] text-[#c7b2c1]"}`}>
                {gift ? <GiftIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
              </div>
            );
          })}
        </div>

        <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-[14px]">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {saving > 0 && <div className="flex justify-between text-[#b0263c]"><span>{free} free set{free > 1 ? "s" : ""}</span><span>−{money(saving)}</span></div>}
          <div className="flex justify-between pt-1 text-[17px] font-bold"><span>Total</span><span>{money(subtotal - saving)}</span></div>
        </div>
        <button
          disabled={picked.length === 0}
          onClick={addAll}
          className="mt-4 h-[52px] w-full rounded-full bg-plum text-[13.5px] font-bold uppercase tracking-[1.4px] text-white transition hover:bg-plum-light disabled:bg-[#e9dfe6] disabled:text-[#a08d9b]"
        >
          {picked.length === 0 ? "Add a set to start" : `Add bundle to cart · ${money(subtotal - saving)}`}
        </button>
        <div className="mt-3.5 flex items-center justify-between text-[11px] text-muted">
          <button onClick={() => setPicked([])} className="text-[12px] text-plum underline">Clear bundle</button>
          <span>Free shipping over ${site.freeShippingThreshold} · 30-day size exchange</span>
        </div>
      </aside>
    </div>
  );
}
