"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { useCallback, useState } from "react";
import CartPanel from "./CartPanel";
import AccountMenu from "./AccountMenu";
import {
  CartIcon,
  CloseIcon,
  CrownIcon,
  GalleryIcon,
  InfoIcon,
  MenuIcon,
  PlayIcon,
  SparkleIcon,
} from "./icons";

const NAV = [
  { label: "Custom Nail", href: "#studio", icon: SparkleIcon, active: true },
  { label: "Gallery", href: "#gallery", icon: GalleryIcon },
  { label: "How It Works", href: "#how-it-works", icon: PlayIcon },
  { label: "About Us", href: "#about", icon: InfoIcon },
];

export function Logo() {
  return (
    <Link href="/" className="group flex flex-col items-center leading-none" aria-label="Oreo Nails home">
      <span className="relative">
        <CrownIcon className="absolute -top-5 left-[58%] hidden h-6 w-11 -translate-x-1/2 lg:block" />
        <span className="font-serif text-[2.125rem] font-medium italic tracking-tight text-[#4a3128] sm:text-[2.5rem] lg:gold-text lg:text-[2.875rem] lg:font-semibold">
          Oreo Nails
        </span>
      </span>
      <span className="mt-1 flex items-center gap-2 whitespace-nowrap text-[0.6562rem] font-semibold uppercase tracking-[0.18em] text-cocoa lg:tracking-[0.32em] lg:text-cocoa-soft">
        <span className="h-px w-5 bg-cocoa/50 lg:bg-gold/60" />
        Custom Nail Design
        <span className="h-px w-5 bg-cocoa/50 lg:bg-gold/60" />
      </span>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const cartCount = useCart().items.length;
  const [cartOpen, setCartOpen] = useState(false);
  const closeCart = useCallback(() => setCartOpen(false), []);

  return (
    // Sticky full-width bar: stays at the top while scrolling; translucent cream + blur so content passing underneath
    // doesn't clash with the logo/nav. Mobile menu + cart panel still hang right under it (absolute, top-full).
    <div className="sticky top-0 z-30 border-b border-gold/15 bg-cream/85 backdrop-blur-md">
    <header className="relative mx-auto grid w-full max-w-[87.5rem] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-5 pb-3 sm:px-8 lg:flex lg:justify-between lg:gap-4 lg:px-12 lg:pt-7 lg:pb-4">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-ml-1 grid h-11 w-11 place-items-center justify-self-start rounded-full text-cocoa lg:hidden"
      >
        {open ? <CloseIcon className="h-7 w-7" /> : <MenuIcon className="h-8 w-8" />}
      </button>

      <Logo />

      <nav className="hidden items-center gap-2 lg:flex" aria-label="Main">
        {NAV.map(({ label, href, icon: Icon, active }) => (
          <a
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "btn-gold flex items-center gap-2 rounded-full px-6 py-2.5 font-serif text-[1.0625rem] text-white"
                : "flex items-center gap-2 rounded-full px-4 py-2.5 font-serif text-[1.0625rem] text-cocoa transition hover:bg-white/60"
            }
          >
            <Icon className="h-6 w-6" />
            {label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 justify-self-end sm:gap-3">
        <AccountMenu />
        <span className="hidden h-8 w-px bg-gold/30 lg:block" />
        <button
          type="button"
          aria-label={`Cart, ${cartCount} items`}
          aria-expanded={cartOpen}
          data-cart-toggle
          onClick={() => setCartOpen((v) => !v)}
          className="relative grid h-11 w-11 place-items-center rounded-full bg-white/80 text-cocoa shadow-md ring-1 ring-gold/20 transition hover:bg-white lg:h-12 lg:w-12"
        >
          <CartIcon className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-dark px-1 text-[0.6875rem] font-bold text-white">
            {cartCount}
          </span>
        </button>
      </div>

      {cartOpen && <CartPanel onClose={closeCart} />}

      {open && (
        <nav
          aria-label="Mobile"
          className="glass-card absolute inset-x-4 top-full z-30 flex flex-col gap-1 rounded-2xl p-3 lg:hidden"
        >
          {NAV.map(({ label, href, icon: Icon, active }) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-serif text-lg ${
                active ? "btn-gold text-white" : "text-cocoa hover:bg-white/70"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
    </div>
  );
}
