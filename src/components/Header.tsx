"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { useCallback, useEffect, useState } from "react";
import CartPanel from "./CartPanel";
import AccountMenu from "./AccountMenu";
import {
  BagIcon,
  CartIcon,
  ChevronRightIcon,
  CloseIcon,
  CrownOutlineIcon,
  GiftIcon,
  FootIcon,
  LayersIcon,
  MenuIcon,
  SearchIcon,
  SparkleIcon,
  ToolIcon,
} from "./icons";

export type NavId = "custom" | "shop" | "holiday" | "toenails" | "best" | "bundles" | "tools";

/** Shop menu (the custom studio has its own button) */
const SHOP_NAV: { id: NavId; label: string; href: string; icon: typeof BagIcon; badge?: string }[] = [
  { id: "shop", label: "Shop", href: "/shop", icon: BagIcon },
  { id: "holiday", label: "Holiday Glam", href: "/shop?collection=holiday", icon: GiftIcon, badge: "NEW" },
  { id: "toenails", label: "Toenails", href: "/shop?category=toenails", icon: FootIcon },
  { id: "best", label: "Best Sellers", href: "/shop?best=1", icon: CrownOutlineIcon },
  { id: "bundles", label: "Bundles", href: "/shop?category=bundles", icon: LayersIcon },
  { id: "tools", label: "Tools", href: "/shop?category=tools", icon: ToolIcon },
];
const CUSTOM = { id: "custom" as const, label: "Custom Nail", href: "/", icon: SparkleIcon };

/** Oreo Nails logo (crown + wordmark + "Custom nail design") */
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = { sm: "h-11", md: "h-[52px] nav:h-[58px]", lg: "h-[90px]" }[size];
  return (
    <Link href="/" className="block shrink-0" aria-label="Oreo Nails home">
      {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
      <img src="/brand/logo.png" alt="Oreo Nails — Custom nail design" width={255} height={93} className={`${h} w-auto`} />
    </Link>
  );
}

/** search the Shop (GET /shop?q=…) */
function SearchBar({ onClose }: { onClose: () => void }) {
  return (
    <form action="/shop" role="search" className="mx-auto flex w-full max-w-[97.5rem] items-center gap-2 px-[clamp(14px,3vw,40px)] pb-3">
      <label htmlFor="site-search" className="sr-only">
        Search nail sets
      </label>
      <div className="flex h-11 flex-1 items-center gap-2 rounded-full border border-line bg-ivory px-4 focus-within:border-brown">
        <SearchIcon className="h-5 w-5 text-cocoa-soft" />
        <input
          id="site-search"
          name="q"
          type="search"
          autoFocus
          placeholder="Search sets…"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-cocoa outline-none placeholder:text-cocoa-soft"
        />
      </div>
      <button type="submit" className="btn-brown btn-label h-11 rounded-full px-5 text-white">
        Search
      </button>
      <button type="button" onClick={onClose} aria-label="Close search" className="grid h-11 w-11 place-items-center rounded-full text-cocoa">
        <CloseIcon className="h-5 w-5" />
      </button>
    </form>
  );
}

export default function Header({ active }: { active: NavId }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const cartCount = useCart().count;
  const [cartOpen, setCartOpen] = useState(false);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const round = "relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-cocoa transition";
  const soft = `${round} bg-white soft-shadow hover:bg-ivory`;

  // menu drawer (phones/tablets): Escape closes it, the page behind doesn't scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      {/* Sticky bar, translucent cream + blur. The menu and cart drawers are rendered outside it:
          backdrop-filter would trap their `fixed` position. */}
      <div className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur-md">
        <header className="relative mx-auto flex h-[76px] w-full max-w-[97.5rem] items-center justify-between gap-[18px] px-[clamp(14px,3vw,40px)] nav:h-[84px] nav:justify-start">
          <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className={`${round} nav:hidden`}>
            <MenuIcon className="h-6 w-6" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 nav:static nav:translate-x-0">
            <Logo />
          </div>

          <nav className="hidden flex-1 flex-wrap items-center gap-1 nav:flex" aria-label="Main">
            {SHOP_NAV.map(({ id, label, href, badge }) => (
              <Link
                key={id}
                href={href}
                aria-current={active === id ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-[14.5px] whitespace-nowrap transition ${
                  active === id ? "bg-brown text-white" : "text-cocoa hover:bg-pink-2"
                }`}
              >
                {label}
                {badge && <span className="ml-1 rounded-lg bg-brown px-1.5 py-px text-[10px] text-white">{badge}</span>}
              </Link>
            ))}
          </nav>

          <span className="hidden h-[34px] w-px bg-line nav:block" />
          <Link
            href={CUSTOM.href}
            aria-current={active === "custom" ? "page" : undefined}
            className="btn-brown btn-label hidden min-h-11 items-center gap-2.5 rounded-full px-[22px] text-white nav:inline-flex"
          >
            <SparkleIcon className="h-[22px] w-[22px]" />
            {CUSTOM.label}
          </Link>

          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Search" aria-expanded={searching} onClick={() => setSearching((v) => !v)} className={`${round} hidden hover:bg-pink-2 nav:grid`}>
              <SearchIcon className="h-[22px] w-[22px]" />
            </button>
            <AccountMenu className={soft} />
            <button
              type="button"
              aria-label={`Cart, ${cartCount} items`}
              aria-expanded={cartOpen}
              data-cart-toggle
              onClick={() => setCartOpen((v) => !v)}
              className={soft}
            >
              <CartIcon className="h-[22px] w-[22px]" />
              <span className="absolute -top-0.5 -right-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-[10px] bg-cocoa px-1 text-[11px] text-white">
                {cartCount}
              </span>
            </button>
          </div>
        </header>
        {searching && <SearchBar onClose={() => setSearching(false)} />}
      </div>

      {cartOpen && <CartPanel onClose={closeCart} />}

      {/* phones/tablets: menu drawer from the left */}
      {open && (
        <div className="fixed inset-0 z-50 nav:hidden">
          <div className="absolute inset-0 bg-cocoa/45" onClick={() => setOpen(false)} aria-hidden />
          <nav
            aria-label="Menu"
            className="drawer-left absolute inset-y-0 left-0 flex w-[min(330px,86%)] flex-col overflow-y-auto bg-ivory px-[18px] pt-[max(1.5rem,env(safe-area-inset-top))] pb-6"
          >
            <button type="button" autoFocus aria-label="Close menu" onClick={() => setOpen(false)} className={`${round} -ml-1`}>
              <CloseIcon className="h-6 w-6" />
            </button>
            <div className="mt-2.5 mb-6 self-center">
              <Logo size="lg" />
            </div>
            <ul className="flex flex-col">
              {[CUSTOM, ...SHOP_NAV].map(({ id, label, href, icon: Icon }) => (
                <li key={id}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active === id ? "page" : undefined}
                    className={`flex items-center gap-[18px] px-[18px] py-4 text-[17px] font-medium tracking-[0.03em] text-cocoa uppercase ${
                      active === id ? "mb-1.5 rounded-full bg-pink-2" : "border-b border-line"
                    }`}
                  >
                    <Icon className="h-[30px] w-[30px] shrink-0" />
                    <span className="flex-1">{label}</span>
                    <ChevronRightIcon className="h-[18px] w-[18px]" />
                  </Link>
                </li>
              ))}
            </ul>
            <form action="/shop" role="search" className="mt-6 flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4">
              <SearchIcon className="h-5 w-5 text-cocoa-soft" />
              <label htmlFor="menu-search" className="sr-only">
                Search nail sets
              </label>
              <input
                id="menu-search"
                name="q"
                type="search"
                placeholder="Search sets…"
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-cocoa outline-none placeholder:text-cocoa-soft"
              />
            </form>
          </nav>
        </div>
      )}
    </>
  );
}
