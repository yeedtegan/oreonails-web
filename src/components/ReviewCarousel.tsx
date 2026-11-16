"use client";

import { useRef } from "react";
import type { Product, Review } from "@/lib/data";
import { ChevronLeft, ChevronRight, Stars } from "./Icons";
import { ProductArt } from "@/components/Art";

/** "Customers are saying" carousel: 4 white cards (photo, stars, name + Verified, quote, product) with side arrows. */
export default function ReviewCarousel({ reviews, products }: { reviews: Review[]; products: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * (track.current.clientWidth / 2), behavior: "smooth" });
  const byHandle = new Map(products.map((p) => [p.handle, p]));

  return (
    <div className="relative mx-auto max-w-[1320px]">
      <button onClick={() => scroll(-1)} aria-label="Previous reviews" className="absolute left-2 top-[210px] z-10 hidden text-black/45 hover:text-black md:block">
        <ChevronLeft width={22} height={22} />
      </button>
      <button onClick={() => scroll(1)} aria-label="Next reviews" className="absolute right-2 top-[210px] z-10 hidden text-black/45 hover:text-black md:block">
        <ChevronRight width={22} height={22} />
      </button>
      <div ref={track} className="no-scrollbar mx-auto flex max-w-[1192px] snap-x snap-mandatory gap-6 overflow-x-auto px-3 pt-1 pb-5 md:px-0">
        {reviews.map((r) => {
          const p = r.product ? byHandle.get(r.product) : undefined;
          return (
            <figure key={r.id} className="flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded bg-white text-center text-black shadow-[0_2px_12px_rgba(0,0,0,0.10)] sm:w-[280px]">
              {p ? (
                <ProductArt product={p} shape={p.shape} className="h-[187px] w-full" />
              ) : (
                <div className="h-[187px] w-full bg-card" />
              )}
              <div className="flex flex-1 flex-col items-center px-6 pt-7 pb-8">
                <Stars rating={r.rating} size={17} />
                <figcaption className="mt-3 flex items-center gap-2 text-base">
                  {r.name}
                  <span className="rounded-[3px] bg-plum px-1.5 py-[3px] text-[10.5px] leading-none text-white">Verified</span>
                </figcaption>
                <blockquote className="mt-4 line-clamp-3 text-base leading-[1.4]">{r.body}</blockquote>
                <p className="mt-auto pt-5 text-sm">{r.productTitle ?? "Oreo Nails"}</p>
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
