"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { money, type CartLine } from "@/lib/pricing";
import { SHAPES, SIZES, type Collection, type Product } from "@/lib/data";
import { apiFetch } from "@/lib/api-client";
import { artVariant } from "./ProductCard";
import { ChevronDown, CloseIcon, GiftIcon, MinusIcon, PlusIcon } from "./Icons";
import { ProductArt } from "@/components/Art";

const MILESTONES = [
  { sets: 3, free: 1 },
  { sets: 5, free: 2 },
  { sets: 8, free: 3 },
];

/** Plum promo band with the 3 / 5 / 8-set milestone track. */
export function PromoProgress() {
  const { totals, quoteError } = useStore();
  const sets = totals.setCount;
  // Before the first quote (empty cart) there is no tier info yet: lead with the first offer.
  const next = totals.nextTier ?? (totals.freeCount === 0 ? { buy: 2, get: 1, setsNeeded: 3 } : null);
  const headline = next ? (
    <>Buy {next.buy}, get {next.get} <b>FREE</b> · mix &amp; match</>
  ) : (
    <>All {totals.freeCount} free sets unlocked 🎉</>
  );
  return (
    <div className="bg-plum px-5 pt-3.5 pb-4 text-white">
      {quoteError && <p className="mb-2 rounded bg-white/15 px-2 py-1 text-xs">{quoteError}</p>}
      <p className="flex items-center gap-2.5 text-[14px] font-medium">
        <GiftIcon width={20} height={20} /> {headline}
      </p>
      <div className="relative mx-0.5 mt-4 h-[3px] rounded-full bg-white/25">
        <div className="absolute inset-y-0 left-0 rounded-full bg-white transition-all" style={{ width: `${Math.min(100, (sets / 8) * 100)}%` }} />
        {MILESTONES.map((m) => (
          <span
            key={m.sets}
            className={`absolute top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${sets >= m.sets ? "bg-white" : "bg-plum"}`}
            style={{ left: `${(m.sets / 8) * 100}%` }}
          />
        ))}
      </div>
      <div className="relative mt-2 h-6 text-center text-[10.5px] leading-[1.2]">
        {MILESTONES.map((m, i) => (
          <span
            key={m.sets}
            className={`absolute whitespace-nowrap ${i === MILESTONES.length - 1 ? "right-0 text-right" : "-translate-x-1/2"}`}
            style={i === MILESTONES.length - 1 ? undefined : { left: `${(m.sets / 8) * 100}%` }}
          >
            <b className="block font-bold">{m.sets} sets</b>
            <span className="opacity-80">{m.free} free</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function CartLineRow({ line, compact }: { line: CartLine; compact?: boolean }) {
  const { setQty } = useStore();
  const p = line.product;
  return (
    <div className="flex gap-3.5">
      <Link href={`/products/${p.handle}`} className="w-[84px] shrink-0 overflow-hidden rounded-xl bg-card">
        <ProductArt product={p} shape={line.shape ?? p.shape} variant={artVariant(p)} className="aspect-square w-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-2">
          <Link href={`/products/${p.handle}`} className="text-[15px] font-semibold leading-tight hover:underline">{p.title}</Link>
          <span className="text-[15px] font-semibold">{money(line.lineTotal)}</span>
        </div>
        {(line.size || line.shape) && (
          <p className="mt-1 text-[13px] text-muted">
            {[line.size, line.shape].filter(Boolean).join(" / ")}
            {line.customSizes && <> · {line.customSizes}</>}
          </p>
        )}
        {compact ? (
          <p className="text-[13px] text-muted">Qty {line.qty}</p>
        ) : (
          <div className="mt-auto flex items-center gap-3 pt-2">
            <div className="flex h-9 items-center rounded-full border border-line">
              <button className="px-2.5" onClick={() => setQty(line.key, line.qty - 1)} aria-label="Decrease quantity"><MinusIcon width={14} height={14} /></button>
              <span className="w-5 text-center text-sm">{line.qty}</span>
              <button className="px-2.5" onClick={() => setQty(line.key, line.qty + 1)} aria-label="Increase quantity"><PlusIcon width={14} height={14} /></button>
            </div>
            <button className="text-[13px] text-muted underline" onClick={() => setQty(line.key, 0)}>Remove</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : ""} ${accent ? "text-[#b0263c]" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/** Small recommendation card with inline size/shape picker and "Add". */
function MiniCard({ p }: { p: Product }) {
  const { addToCart } = useStore();
  const isSet = p.type === "set";
  const options = SIZES.filter((s) => s !== "Custom").flatMap((s) => ["Short", "Long"].map((l) => `${s} / ${l}`));
  const [opt, setOpt] = useState(options[0]);
  const shape = p.shape;
  return (
    <div className="flex flex-col rounded-xl bg-white p-2.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <Link href={`/products/${p.handle}`} className="overflow-hidden rounded-lg bg-card">
        <ProductArt product={p} shape={shape} variant={artVariant(p)} className="aspect-[1/1.05] w-full" />
      </Link>
      <p className="mt-2.5 truncate text-[13px] font-medium">{p.title}</p>
      <p className="mt-1 text-[13px] font-bold">{money(p.price)}</p>
      {isSet && (
        <label className="relative mt-2">
          <select value={opt} onChange={(e) => setOpt(e.target.value)} className="h-10 w-full appearance-none rounded-full border border-line bg-white pl-3 text-xs">
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown width={12} height={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </label>
      )}
      <button
        onClick={() => addToCart(p.handle, isSet ? { size: opt.split(" / ")[0], shape: SHAPES.includes(shape as (typeof SHAPES)[number]) ? shape : "Almond" } : {})}
        className="mt-2 h-9 rounded-full bg-plum text-[13px] font-bold text-white transition hover:bg-plum-light"
      >
        Add
      </button>
    </div>
  );
}

/** "Keep shopping" recommendations: collection + sort selects, 2- or 4-up mini cards with quick add. */
export function KeepShopping({ initial = [], collections = [], active = true, cols = 2 }: { initial?: Product[]; collections?: Collection[]; active?: boolean; cols?: 2 | 4 }) {
  const { cart } = useStore();
  const [recs, setRecs] = useState(initial);
  const [colFilter, setColFilter] = useState("new-arrivals");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    apiFetch<{ products: Product[] }>(`/products?collection=${colFilter}&type=set&sort=${sort}&limit=12`, { signal: ctrl.signal })
      .then((r) => setRecs(r.products))
      .catch(() => {});
    return () => ctrl.abort();
  }, [active, colFilter, sort]);

  const inCart = new Set(cart.map((i) => i.handle));
  const filterCols = collections.filter((c) => c.group !== "other" || c.handle === "toenails");
  return (
    <>
      <p className="text-[14.5px] font-semibold">Keep shopping</p>
      <p className="mt-1 text-[12.5px] text-muted">Picked in your size and shape</p>
      <div className={`mt-4 grid grid-cols-2 gap-2.5 ${cols === 4 ? "md:w-[460px]" : ""}`}>
        <label className="relative">
          <select value={colFilter} onChange={(e) => setColFilter(e.target.value)} className="h-[34px] w-full appearance-none rounded-lg border border-line bg-white pl-3 text-[13px] font-medium">
            {filterCols.map((c) => <option key={c.handle} value={c.handle}>{c.handle === "new-arrivals" ? "Just Dropped" : c.title}</option>)}
          </select>
          <ChevronDown width={12} height={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </label>
        <label className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-[34px] w-full appearance-none rounded-lg border border-line bg-white pl-3 text-[13px] font-medium">
            <option value="newest">Newest first</option>
            <option value="featured">Best selling</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
          <ChevronDown width={12} height={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </label>
      </div>
      <div className={`mt-3 grid grid-cols-2 gap-2.5 ${cols === 4 ? "md:grid-cols-4 md:gap-4" : ""}`}>
        {recs.filter((p) => !inCart.has(p.handle)).slice(0, 8).map((p) => <MiniCard key={p.handle} p={p} />)}
      </div>
    </>
  );
}

/** Right-hand cart drawer (400px), layout mirrors the reference. */
export default function CartDrawer({ recommendations = [], collections = [] }: { recommendations?: Product[]; collections?: Collection[] }) {
  const { cartOpen, setCartOpen, totals, cart, quoting } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCartOpen]);


  const empty = cart.length === 0;

  return (
    <div className={`fixed inset-0 z-[60] ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <div className={`absolute inset-0 bg-white/60 backdrop-blur-[1px] transition-opacity duration-300 ${cartOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setCartOpen(false)} />
      <aside className={`absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-[#f7f5f6] text-plum shadow-[-8px_0_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-[52px] shrink-0 items-center justify-between bg-white px-5">
          <h2 className="font-display text-[24px] font-medium">
            Cart <span className="ml-1 align-middle text-[13px]">({totals.count} item{totals.count === 1 ? "" : "s"})</span>
          </h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart"><CloseIcon width={22} height={22} /></button>
        </div>
        <PromoProgress />

        <div className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-2.5 mt-3 rounded-xl bg-white px-6 py-7 text-center shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
              <p className="text-[16px] font-bold">Your cart is empty</p>
              <p className="mt-1.5 text-[14px] font-medium">Pick a set below to start your bundle.</p>
            </div>
          ) : (
            <div className={`space-y-4 bg-white px-5 py-5 transition-opacity ${quoting ? "opacity-60" : ""}`}>
              {totals.lines.map((l) => <CartLineRow key={l.key} line={l} />)}
            </div>
          )}

          <div className="mt-4 border-t border-line px-2.5 pt-5 pb-6">
            <KeepShopping initial={recommendations} collections={collections} active={cartOpen} />
          </div>
        </div>

        {!empty && (
          <div className="shrink-0 space-y-2 border-t border-line bg-white px-5 py-4 text-[14px]">
            <Row label="Subtotal" value={money(totals.subtotal)} />
            {totals.promoDiscount > 0 && <Row accent label={`Mix & match (${totals.freeCount} free)`} value={`−${money(totals.promoDiscount)}`} />}
            <Row label="Shipping" value={totals.shipping === 0 ? "Free" : money(totals.shipping)} />
            <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn-dark mt-2 w-full">
              Checkout · {money(totals.total + totals.codeDiscount)}
            </Link>
            <Link href="/cart" onClick={() => setCartOpen(false)} className="block text-center text-[13px] underline">View cart</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
