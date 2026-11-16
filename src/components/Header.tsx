"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE, type Collection } from "@/lib/data";
import { useStore } from "@/context/StoreContext";
import { BagIcon, MenuIcon, SearchIcon, TruckIcon, Logo } from "./Icons";
import MenuDrawer from "./MenuDrawer";

/** Rotating 40px promo strip (plum), centred, same structure as the reference. */
const PROMOS: { href: string; content: React.ReactNode }[] = [
  {
    href: "/pages/shipping-policy",
    content: (
      <>
        <span className="font-sans text-[10.5px] font-bold uppercase tracking-[1.68px] text-blush">Free shipping</span>
        <TruckIcon width={16} height={16} className="text-blush" />
        <span>
          On all orders over <b className="font-bold text-blush">${SITE.freeShippingThreshold}</b>
        </span>
      </>
    ),
  },
  {
    href: "/collections/shop-all",
    content: (
      <>
        <span className="font-sans text-[10.5px] font-bold uppercase tracking-[1.68px] text-blush">Fall stock up 🍂</span>
        <span>Buy 2 get <b>1</b></span>
        <span className="opacity-40">|</span>
        <span>Buy 3 get <b>2</b></span>
        <span className="hidden opacity-40 sm:inline">|</span>
        <span className="hidden sm:inline">Buy 5 get <b>3</b></span>
        <span className="rounded bg-plum-soft px-1.5 py-[1px] text-[10px] font-bold tracking-wider text-white">FREE</span>
      </>
    ),
  },
  {
    href: "/pages/black-friday",
    content: (
      <>
        <span className="font-sans text-[10.5px] font-bold uppercase tracking-[1.68px] text-[#ff5a6e]">Black Friday</span>
        <span>Early access</span>
        <span className="rounded-full bg-[#e0283e] px-3 py-[3px] text-[11px] font-bold">Join the list</span>
      </>
    ),
  },
];

function PromoBar() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % PROMOS.length), 5000);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <div className="relative z-50 h-9 bg-plum text-white md:h-10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Link key={i} href={PROMOS[i].href} className="animate-fadein flex h-full items-center justify-center gap-2.5 px-3 text-[13px] font-medium whitespace-nowrap md:text-[13.5px]">
        {PROMOS[i].content}
      </Link>
    </div>
  );
}

/**
 * Header: hamburger (left) · centred logo · search + bag (right), 80px tall.
 * On the home page it floats transparently over the hero until you scroll.
 */
export default function Header({ collections }: { collections: Collection[] }) {
  const { totals, setCartOpen, setSearchOpen, hydrated } = useStore();
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const overlay = pathname === "/" || pathname.startsWith("/collections/");

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = overlay && !scrolled;

  // Promo bar + header stick together. The wrapper keeps a constant height (so the page never jumps);
  // only the inner header shrinks from 80px to 56px once you scroll, like the reference.
  return (
    <>
      <div className={`pointer-events-none sticky top-0 z-40 ${overlay ? "-mb-20" : ""}`}>
        <div className="pointer-events-auto">
          <PromoBar />
        </div>
        <div className="h-20">
          <header
            className={`pointer-events-auto transition-all duration-300 ${scrolled ? "h-14" : "h-20"} ${
              transparent ? "bg-transparent text-white" : `bg-white text-plum ${scrolled ? "shadow-[0_1px_0_rgba(75,56,76,0.08)]" : ""}`
            }`}
          >
            <div className="container-x grid h-full grid-cols-[1fr_auto_1fr] items-center">
              <div>
                <button onClick={() => setDrawer(true)} aria-label="Open menu" className="-ml-1 p-1 transition hover:opacity-70">
                  <MenuIcon width={24} height={24} />
                </button>
              </div>
              <Link href="/" aria-label={`${SITE.name} home`} className={`transition-transform duration-300 ${scrolled ? "scale-90" : ""}`}>
                <Logo />
              </Link>
              <div className="flex items-center justify-end gap-[18px]">
                <button onClick={() => setSearchOpen(true)} aria-label="Search" className="transition hover:opacity-70">
                  <SearchIcon width={24} height={24} />
                </button>
                <button onClick={() => setCartOpen(true)} aria-label="Open cart" className="relative transition hover:opacity-70">
                  <BagIcon width={24} height={24} />
                  {hydrated && totals.count > 0 && (
                    <span className="absolute -right-1.5 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-plum-soft px-1 text-[10px] font-bold text-white">{totals.count}</span>
                  )}
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>
      <MenuDrawer open={drawer} onClose={() => setDrawer(false)} collections={collections} />
    </>
  );
}
