"use client";

import Link from "next/link";
import type { Product } from "@/lib/data";
import { discountPct, money } from "@/lib/pricing";
import { useStore } from "@/context/StoreContext";
import { HeartIcon } from "./Icons";
import { ProductArt } from "@/components/Art";

export const artVariant = (p: Product): "set" | "bundle" | "tool" => (p.type === "bundle" ? "bundle" : p.type === "tool" ? "tool" : "set");

/** Product tile matching the reference: rounded light image, heart (top-right), SAVE badge (top-left), centred title + price. */
export default function ProductCard({ product: p, compact }: { product: Product; compact?: boolean }) {
  const { favorites, toggleFavorite, hydrated } = useStore();
  const fav = hydrated && favorites.includes(p.handle);
  const pct = discountPct(p);

  return (
    <div className="group relative flex flex-col text-center">
      <div className="relative overflow-hidden rounded-2xl bg-card">
        <Link href={`/products/${p.handle}`} aria-label={p.title} className="block">
          <ProductArt product={p} shape={p.shape} title={p.title} variant={artVariant(p)} className="aspect-square w-full transition duration-500 group-hover:scale-[1.03]" />
        </Link>
        {pct > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-plum px-2 py-[5px] font-work text-[8.4px] leading-none tracking-[0.84px] text-white uppercase md:left-[10px] md:top-[11px]">
            Save {pct}%
          </span>
        )}
        <button
          onClick={() => toggleFavorite(p.handle)}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-plum shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition hover:scale-105"
        >
          <HeartIcon filled={fav} width={18} height={18} />
        </button>
      </div>
      <Link href={`/products/${p.handle}`} className={`block px-1 leading-[1.25] ${compact ? "mt-2.5 text-[16px]" : "mt-4 text-[15px] md:text-[17.28px]"}`}>
        {p.title}
      </Link>
      <p className={`leading-none ${compact ? "mt-1.5 text-[15px]" : "mt-2 text-[15px] md:mt-[10px] md:text-[16.56px]"}`}>
        {p.compareAt ? (
          <>
            <span className="font-bold">{money(p.price)}</span>
            <s className="ml-2.5">{money(p.compareAt)}</s>
          </>
        ) : (
          <span className="font-medium">{money(p.price)}</span>
        )}
      </p>
    </div>
  );
}

/** 4-up grid with 16px gutters (2-up on phones), like the reference collection blocks. */
export function ProductGrid({ products, cols = 4 }: { products: Product[]; cols?: 2 | 3 | 4 }) {
  const c = cols === 4 ? "md:grid-cols-3 lg:grid-cols-4" : cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <div className={`grid grid-cols-2 gap-x-2.5 gap-y-5 md:gap-x-4 md:gap-y-5 ${c}`}>
      {products.map((p) => (
        <ProductCard key={p.handle} product={p} />
      ))}
    </div>
  );
}

/** Horizontal snap rail (used for "You may also like" and phone layouts). */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar -mx-3 flex snap-x snap-mandatory scroll-px-3 gap-2.5 overflow-x-auto px-3 pb-2 md:-mx-[60px] md:scroll-px-[60px] md:gap-5 md:px-[60px]">
      {products.map((p) => (
        <div key={p.handle} className="w-[46%] shrink-0 snap-start sm:w-[42%] lg:w-[30%] xl:w-[calc((100%-60px)/4.25)]">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
