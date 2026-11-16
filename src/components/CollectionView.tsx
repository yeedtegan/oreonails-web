"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/data";
import ProductCard from "./ProductCard";
import { ChevronDown, ChevronRight, CloseIcon } from "./Icons";

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 7h11M18 7h3M3 17h4M11 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
);

const PAGE_SIZE = 24;

const SORTS = {
  featured: { label: "Best selling", fn: (a: Product, b: Product) => a.rank - b.rank },
  newest: { label: "Newest", fn: (a: Product, b: Product) => b.added - a.added },
  "price-asc": { label: "Price, low to high", fn: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price, high to low", fn: (a: Product, b: Product) => b.price - a.price },
  rating: { label: "Top rated", fn: (a: Product, b: Product) => b.rating - a.rating },
} as const;
type SortKey = keyof typeof SORTS;

const PRICE = [
  { id: "u30", label: "Under $30", test: (p: Product) => p.price < 30 },
  { id: "30-40", label: "$30 – $40", test: (p: Product) => p.price >= 30 && p.price <= 40 },
  { id: "o40", label: "Over $40", test: (p: Product) => p.price > 40 },
];

/** Rough colour family from the product's base colour. */
function colorOf(p: Product) {
  const hex = p.palette[1].replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (l > 0.88) return "White";
  if (l < 0.18) return "Black";
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.18) return l > 0.6 ? "Nude" : "Grey";
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 345) return l > 0.7 ? "Pink" : "Red";
  if (h < 40) return l < 0.45 ? "Brown" : "Orange";
  if (h < 65) return "Yellow";
  if (h < 170) return "Green";
  if (h < 255) return "Blue";
  if (h < 300) return "Purple";
  return "Pink";
}

function Dropdown({ label, children, active }: { label: React.ReactNode; children: React.ReactNode; active?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={`flex items-center gap-1.5 text-[14.5px] ${active ? "font-bold" : "font-medium"}`}>
        {label} <ChevronDown width={13} height={13} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fadein absolute left-0 top-full z-30 mt-3 min-w-[220px] rounded-xl border border-line bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">{children}</div>
      )}
    </div>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[14px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-plum" />
      {children}
    </label>
  );
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** Filter bar (Availability · Price · Shape · Style · Color | Sort · count), 4-up grid and pagination. */
export default function CollectionView({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [onSale, setOnSale] = useState(false);
  const [prices, setPrices] = useState<string[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const opts = useMemo(
    () => ({
      shapes: [...new Set(products.map((p) => p.shape))].sort(),
      styles: [...new Set(products.map((p) => p.pattern))].sort(),
      colors: [...new Set(products.map(colorOf))].sort(),
    }),
    [products],
  );

  const list = useMemo(
    () =>
      products
        .filter((p) => !onSale || !!p.compareAt)
        .filter((p) => !prices.length || PRICE.some((r) => prices.includes(r.id) && r.test(p)))
        .filter((p) => !shapes.length || shapes.includes(p.shape))
        .filter((p) => !styles.length || styles.includes(p.pattern))
        .filter((p) => !colors.length || colors.includes(colorOf(p)))
        .sort(SORTS[sort].fn),
    [products, onSale, prices, shapes, styles, colors, sort],
  );

  useEffect(() => setPage(1), [onSale, prices, shapes, styles, colors, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const go = (n: number) => {
    setPage(n);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const anyFilter = onSale || prices.length || shapes.length || styles.length || colors.length;
  const clearAll = () => {
    setOnSale(false);
    setPrices([]);
    setShapes([]);
    setStyles([]);
    setColors([]);
  };
  const groups = [
    { title: "Availability", items: [{ key: "sale", label: "On sale", on: onSale, toggle: () => setOnSale((v) => !v) }] },
    { title: "Price", items: PRICE.map((r) => ({ key: r.id, label: r.label, on: prices.includes(r.id), toggle: () => setPrices((c) => toggle(c, r.id)) })) },
    { title: "Shape", items: opts.shapes.map((x) => ({ key: x, label: x, on: shapes.includes(x), toggle: () => setShapes((c) => toggle(c, x)) })) },
    { title: "Style", items: opts.styles.map((x) => ({ key: x, label: x[0].toUpperCase() + x.slice(1), on: styles.includes(x), toggle: () => setStyles((c) => toggle(c, x)) })) },
    { title: "Color", items: opts.colors.map((x) => ({ key: x, label: x, on: colors.includes(x), toggle: () => setColors((c) => toggle(c, x)) })) },
  ];

  return (
    <div ref={top} className="scroll-mt-28">
      {/* Phones: "Filter and sort" row opening a drawer */}
      <div className="flex items-center justify-between pb-3 md:hidden">
        <button onClick={() => setDrawer(true)} className="flex items-center gap-2.5 text-[15px] font-medium">
          <FilterIcon /> Filter and sort{anyFilter ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-plum px-1 text-[11px] text-white">•</span> : null}
        </button>
        <span className="text-[14.5px] font-medium text-muted">{list.length} products</span>
      </div>
      <div className={`fixed inset-0 z-[60] md:hidden ${drawer ? "" : "pointer-events-none"}`} aria-hidden={!drawer}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${drawer ? "opacity-100" : "opacity-0"}`} onClick={() => setDrawer(false)} />
        <aside className={`absolute inset-y-0 right-0 flex w-[88%] max-w-[380px] flex-col bg-white transition-transform duration-300 ${drawer ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-[16px] font-bold">Filter and sort</p>
              <p className="text-[13px] text-muted">{list.length} products</p>
            </div>
            <button onClick={() => setDrawer(false)} aria-label="Close filters"><CloseIcon width={20} height={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5">
            {groups.map((g) => (
              <details key={g.title} className="group border-b border-line">
                <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                  {g.title} <ChevronDown width={14} height={14} className="transition group-open:rotate-180" />
                </summary>
                <div className="pb-3">{g.items.map((it) => <Check key={it.key} checked={it.on} onChange={it.toggle}>{it.label}</Check>)}</div>
              </details>
            ))}
            <label className="flex h-14 items-center justify-between text-[15px] font-medium">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="bg-transparent text-right text-[14.5px] outline-none">
                {(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k].label}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
            <button onClick={clearAll} className="h-12 rounded-full border border-plum text-[14px] font-semibold">Remove all</button>
            <button onClick={() => setDrawer(false)} className="h-12 rounded-full bg-plum text-[14px] font-semibold text-white">Apply</button>
          </div>
        </aside>
      </div>

      <div className="hidden flex-wrap items-center gap-x-7 gap-y-3 border-b border-line pb-4 md:flex">
        <span className="hidden text-[14.5px] font-medium text-muted md:inline">Filter:</span>
        <Dropdown label="Availability" active={onSale}>
          <Check checked={onSale} onChange={() => setOnSale((v) => !v)}>On sale</Check>
        </Dropdown>
        <Dropdown label="Price" active={prices.length > 0}>
          {PRICE.map((r) => <Check key={r.id} checked={prices.includes(r.id)} onChange={() => setPrices((c) => toggle(c, r.id))}>{r.label}</Check>)}
        </Dropdown>
        <Dropdown label="Shape" active={shapes.length > 0}>
          {opts.shapes.map((s) => <Check key={s} checked={shapes.includes(s)} onChange={() => setShapes((c) => toggle(c, s))}>{s}</Check>)}
        </Dropdown>
        <Dropdown label="Style" active={styles.length > 0}>
          {opts.styles.map((s) => <Check key={s} checked={styles.includes(s)} onChange={() => setStyles((c) => toggle(c, s))}><span className="capitalize">{s}</span></Check>)}
        </Dropdown>
        <Dropdown label="Color" active={colors.length > 0}>
          {opts.colors.map((s) => <Check key={s} checked={colors.includes(s)} onChange={() => setColors((c) => toggle(c, s))}>{s}</Check>)}
        </Dropdown>
        {anyFilter ? (
          <button className="text-[13px] text-muted underline" onClick={clearAll}>
            Clear all
          </button>
        ) : null}
        <div className="ml-auto flex items-center gap-7">
          <Dropdown label={<><span className="font-medium text-muted">Sort by:</span>&nbsp;<b>{SORTS[sort].label}</b></>}>
            {(Object.keys(SORTS) as SortKey[]).map((k) => (
              <button key={k} onClick={() => setSort(k)} className={`block w-full py-1 text-left text-[14px] ${k === sort ? "font-bold" : ""}`}>{SORTS[k].label}</button>
            ))}
          </Dropdown>
          <span className="text-[14.5px] font-medium text-muted">{list.length} products</span>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-24 text-center text-muted">No products match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 pt-1 md:grid-cols-3 md:gap-x-5 md:gap-y-[22px] xl:grid-cols-4 xl:gap-x-4">
          {shown.map((p) => <ProductCard key={p.handle} product={p} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-1 text-[16px]" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => go(n)} className={`min-w-[26px] px-1 pb-2 ${n === page ? "border-b border-plum" : ""}`} aria-current={n === page ? "page" : undefined}>{n}</button>
          ))}
          {page < pages && (
            <button onClick={() => go(page + 1)} aria-label="Next page" className="px-2 pb-2"><ChevronRight width={14} height={14} /></button>
          )}
        </nav>
      )}
    </div>
  );
}
