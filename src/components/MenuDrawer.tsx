"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Collection } from "@/lib/data";
import { ChevronLeft, ChevronRight, CloseIcon, GiftIcon, RulerIcon, StarIcon, TagIcon, UserSolid } from "./Icons";
import { NewsletterInline } from "./Newsletter";
import { CollectionArt } from "./Art";

/** Left slide-out menu (420px), laid out like the reference drawer. */
export default function MenuDrawer({ open, onClose, collections }: { open: boolean; onClose: () => void; collections: Collection[] }) {
  const [panel, setPanel] = useState<"main" | "collections">("main");
  const col = (h: string) => collections.find((c) => c.handle === h);

  useEffect(() => {
    if (!open) setTimeout(() => setPanel("main"), 300);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const shopTiles = [
    { label: "Holiday Glam", href: "/collections/holiday-glam", c: col("holiday-glam"), active: true },
    { label: "Best Sellers", href: "/collections/best-sellers", c: col("best-sellers") },
    { label: "New Arrivals", href: "/collections/new-arrivals", c: col("new-arrivals") },
    { label: "Collections", c: col("star-signs"), sub: true },
    { label: "Toenails", href: "/collections/toenails", c: col("toenails") },
    { label: "Accessories", href: "/collections/tools-accessories", c: col("tools-accessories") },
  ];
  const deals = [
    { label: "Bundles", href: "/pages/build-bundle", icon: <GiftIcon width={18} height={18} /> },
    { label: "Sale", href: "/collections/sale", icon: <TagIcon width={18} height={18} /> },
    { label: "Size Guide", href: "/pages/sizing-guide", icon: <RulerIcon width={18} height={18} /> },
    { label: "Rewards", href: "/pages/rewards", icon: <StarIcon width={18} height={18} /> },
  ];
  const groups = [
    { title: "Seasons", items: collections.filter((c) => c.group === "season") },
    { title: "Collections", items: collections.filter((c) => c.group === "collection") },
    { title: "Shop", items: collections.filter((c) => c.group === "shop") },
  ];

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <aside className={`absolute inset-y-0 left-0 flex w-[92%] max-w-[420px] flex-col overflow-hidden bg-[#fbf8f9] text-plum transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* top bar */}
        <div className="flex h-[72px] shrink-0 items-center gap-4 border-b border-line px-4">
          <span className="flex h-10 items-center gap-2 rounded-full bg-[#f1eaee] px-3 text-sm font-semibold">
            <span className="text-base leading-none">🇺🇸</span> USD <span className="text-[8px]">▼</span>
          </span>
          <Link href="/account" onClick={onClose} className="flex items-center gap-2 text-[15px] font-medium">
            <UserSolid /> Sign In
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* main panel */}
          <div className={`absolute inset-0 overflow-y-auto px-4 pb-6 transition-transform duration-300 ${panel === "main" ? "translate-x-0" : "-translate-x-full"}`}>
            <p className="eyebrow mt-5 mb-2.5 font-semibold text-muted">Shop</p>
            <div className="grid grid-cols-2 gap-2">
              {shopTiles.map((t) => {
                const inner = (
                  <>
                    {t.c && <CollectionArt collection={t.c} className="h-11 w-11 shrink-0 rounded-lg" />}
                    <span className="flex-1 text-left text-[15px] font-bold">{t.label}</span>
                    {t.sub && <ChevronRight width={16} height={16} />}
                  </>
                );
                const cls = `flex h-[60px] items-center gap-3 rounded-xl px-2 transition ${t.active ? "bg-pink" : "bg-[#f1eaee] hover:bg-pink/70"}`;
                return t.sub ? (
                  <button key={t.label} className={cls} onClick={() => setPanel("collections")}>{inner}</button>
                ) : (
                  <Link key={t.label} href={t.href!} onClick={onClose} className={cls}>{inner}</Link>
                );
              })}
            </div>

            <p className="eyebrow mt-5 mb-2.5 font-semibold text-muted">Deals and help</p>
            <div className="grid grid-cols-2 gap-2">
              {deals.map((d) => (
                <Link key={d.label} href={d.href} onClick={onClose} className="flex h-12 items-center gap-3 rounded-xl bg-[#f1eaee] px-4 text-[15px] font-bold transition hover:bg-pink/70">
                  {d.icon} {d.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-pink p-[18px]">
              <p className="mb-3 text-[17px] font-bold">Get 10% off your first order</p>
              <NewsletterInline />
            </div>

            <Link href="/collections/shop-all" onClick={onClose} className="mt-5 block rounded-2xl bg-plum px-3.5 py-4 text-white">
              <p className="font-work text-[11px] font-semibold uppercase tracking-[1.3px] text-white/85">Fall stock up</p>
              <p className="mt-1.5 font-display text-[19px]">Buy 2, get 1 <i>free</i></p>
              <p className="mt-1 text-[12.5px] text-white/80">Mix and match any design ›</p>
            </Link>

            <div className="mt-10 rounded-t-3xl bg-white px-0 pt-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Track Order", "/pages/track-order"],
                  ["Help Center", "/pages/faq"],
                  ["Reviews", "/pages/reviews"],
                  ["Favorites", "/search?view=favorites"],
                ].map(([l, h]) => (
                  <Link key={l} href={h} onClick={onClose} className="flex h-11 items-center rounded-xl bg-[#f1eaee] px-3.5 text-[14.5px] font-semibold">
                    {l}
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted">© {new Date().getFullYear()} Oreo Nails. All rights reserved.</p>
            </div>
          </div>

          {/* collections sub-panel */}
          <div className={`absolute inset-0 overflow-y-auto px-4 pb-6 transition-transform duration-300 ${panel === "collections" ? "translate-x-0" : "translate-x-full"}`}>
            <button onClick={() => setPanel("main")} className="mt-4 flex items-center gap-1 text-sm font-semibold">
              <ChevronLeft width={16} height={16} /> Back
            </button>
            {groups.map((g) => (
              <div key={g.title}>
                <p className="eyebrow mt-5 mb-2.5 font-semibold text-muted">{g.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {g.items.map((c) => (
                    <Link key={c.handle} href={`/collections/${c.handle}`} onClick={onClose} className="flex h-[60px] items-center gap-3 rounded-xl bg-[#f1eaee] px-2 transition hover:bg-pink/70">
                      <CollectionArt collection={c} className="h-11 w-11 shrink-0 rounded-lg" />
                      <span className="text-[14.5px] font-bold leading-tight">{c.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
