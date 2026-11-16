"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SETS_INCLUDED, SHAPES, SIZES, SIZE_CHART, type Collection, type Product } from "@/lib/data";
import { money } from "@/lib/pricing";
import { useStore } from "@/context/StoreContext";
import NailArt from "./NailArt";
import { artVariant } from "./ProductCard";
import { ChevronLeft, ChevronRight, ClockIcon, GiftIcon, HeartIcon, MinusIcon, PenIcon, PlusIcon, ShieldIcon, Stars, TruckIcon } from "./Icons";

const FINGERS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const addDays = (n: number) => new Date(Date.now() + n * 86_400_000);

/** Live "order within" countdown to the next midnight, like the reference delivery box. */
function useCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return ["--", "--", "--"];
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((end.getTime() - now) / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0"));
}

/** Segmented pill control (grey track, white selected pill). */
function Segmented({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-[48px] rounded-full bg-[#f1eaee] p-[3px]">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`flex-1 rounded-full text-[14.5px] transition ${value === o ? "bg-white font-bold shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "font-medium text-muted hover:text-plum"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function ProductPurchase({ product: p, collection, reviewCount }: { product: Product; collection?: Collection; reviewCount: number }) {
  const { addToCart, favorites, toggleFavorite, hydrated } = useStore();
  const isSet = p.type === "set";
  const [size, setSize] = useState("");
  const [shape, setShape] = useState<string>(SHAPES.includes(p.shape as (typeof SHAPES)[number]) ? p.shape : "Almond");
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState<string[]>(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [view, setView] = useState(0);
  const [hh, mm, ss] = useCountdown();
  const fav = hydrated && favorites.includes(p.handle);
  const atcRef = useRef<HTMLButtonElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = atcRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Gallery: the set in each shape, then the "hand" render — stands in for multiple product photos.
  // Uploaded photos win; otherwise generated renders (each shape + hand shots) stand in for photography.
  const photos = p.images ?? [];
  const gallery: { variant: "set" | "bundle" | "tool" | "hand"; shape: string; src?: string }[] = photos.length
    ? photos.map((src) => ({ variant: "set" as const, shape: p.shape, src }))
    : isSet
    ? [...SHAPES.map((s) => ({ variant: "set" as const, shape: s })), ...SHAPES.slice(0, 2).map((s) => ({ variant: "hand" as const, shape: s }))]
    : [{ variant: artVariant(p), shape: p.shape }];
  const current = gallery[view] ?? gallery[0];

  const submit = () => {
    if (isSet && !size) return setError("Please select a size.");
    if (isSet && size === "Custom" && custom.some((c) => !c || Number(c) < 6 || Number(c) > 20)) {
      return setError("Enter all 5 measurements in mm (6–20).");
    }
    setError("");
    addToCart(p.handle, {
      size: isSet ? size : undefined,
      shape: isSet ? shape : undefined,
      customSizes: isSet && size === "Custom" ? custom.join("-") + "mm" : undefined,
      qty,
    });
  };

  const heading = (
    <>
        <nav className="text-[15px] font-medium">
        <Link href="/" className="hover:underline">Home</Link>
        {collection && <> &nbsp;/&nbsp; <Link href={`/collections/${collection.handle}`} className="hover:underline">{collection.title}</Link></>}
        &nbsp;/&nbsp; <span>{p.title}</span>
      </nav>
      <h1 className="mt-2 font-display text-[28px] leading-[1.2] font-medium">{p.title}</h1>
      <a href="#reviews" className="mt-1 flex items-center gap-2 text-[13.5px]">
        <Stars rating={p.rating} size={16} />
        <span className="underline decoration-dotted underline-offset-2">{(p.reviewCount + reviewCount).toLocaleString()} reviews</span>
      </a>
      <p className="mt-4 text-[20px]">
        {p.compareAt ? (
          <>
            <b>{money(p.price)}</b> <s className="ml-2 text-[17px] text-muted">{money(p.compareAt)}</s>
          </>
        ) : (
          money(p.price)
        )}
      </p>
    </>
  );

  return (
    <>
    <div className="md:hidden">{heading}</div>
    <div className="mt-4 grid grid-cols-1 items-start gap-5 md:mt-0 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] md:gap-8 xl:grid-cols-[762px_1fr] xl:gap-[79px]">
      {/* Gallery: vertical thumbs + main image */}
      <div className="flex min-w-0 flex-col-reverse gap-3 md:sticky md:top-28 md:self-start xl:flex-row xl:items-start xl:gap-[18px]">
        <div className="no-scrollbar flex gap-2 overflow-x-auto xl:max-h-[662px] xl:w-[82px] xl:shrink-0 xl:flex-col xl:gap-2.5 xl:overflow-y-auto">
          {gallery.map((g, i) => (
            <button
              key={i}
              onClick={() => setView(i)}
              className={`h-[58px] w-[58px] shrink-0 overflow-hidden rounded-lg border-2 bg-card xl:h-[80px] xl:w-[80px] ${view === i ? "border-plum" : "border-transparent"}`}
              aria-label={`Image ${i + 1}`}
            >
              {g.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <NailArt palette={p.palette} pattern={p.pattern} shape={g.shape} variant={g.variant} className="h-full w-full" />
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full overflow-hidden rounded-2xl bg-card shadow-[0_1px_8px_rgba(0,0,0,0.05)] xl:w-[662px]">
          {current.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt={p.title} className="aspect-square w-full object-cover" />
          ) : (
            <NailArt palette={p.palette} pattern={p.pattern} shape={isSet && view === 0 ? shape : current.shape} variant={current.variant} title={p.title} className="aspect-square w-full" />
          )}
          <button onClick={() => toggleFavorite(p.handle)} aria-label="Toggle favorite" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
            <HeartIcon filled={fav} width={19} height={19} />
          </button>
          {gallery.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-3">
              <button onClick={() => setView((v) => Math.max(0, v - 1))} disabled={view === 0} aria-label="Previous image" className="grid h-[46px] w-[46px] place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] disabled:opacity-40">
                <ChevronLeft width={18} height={18} />
              </button>
              <button onClick={() => setView((v) => Math.min(gallery.length - 1, v + 1))} disabled={view === gallery.length - 1} aria-label="Next image" className="grid h-[46px] w-[46px] place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] disabled:opacity-40">
                <ChevronRight width={18} height={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Buy box */}
      <div className="min-w-0 md:pt-[18px]">
        <div className="hidden md:block">{heading}</div>

        <div className="mt-5 flex items-center justify-between gap-3 overflow-hidden whitespace-nowrap text-[12.5px] font-medium">
          <span className="flex items-center gap-1.5"><PenIcon width={14} height={14} className="text-[#b5577c]" /> Hand painted</span>
          <span className="flex items-center gap-1.5"><ClockIcon width={14} height={14} className="text-[#b5577c]" /> 2–4 weeks with glue</span>
          <span className="flex items-center gap-1.5"><ShieldIcon width={14} height={14} className="text-[#b5577c]" /> Safe for natural nails</span>
        </div>

        {isSet && (
          <div className="mt-5 border-y border-line text-[14.5px]">
            {[
              { buy: 2, get: 1, total: 3 },
              { buy: 3, get: 2, total: 5 },
              { buy: 5, get: 3, total: 8 },
            ].map((t, i) => (
              <div key={t.buy} className={`flex h-10 items-center gap-3 ${i ? "border-t border-line" : ""}`}>
                <GiftIcon width={18} height={18} className={i === 2 ? "text-[#e0283e]" : ""} />
                <b className="font-bold">Buy {t.buy}, get {t.get} free</b>
                <span className="ml-auto text-[13px] text-muted">Add {t.total} sets total</span>
              </div>
            ))}
          </div>
        )}

        {isSet && (
          <>
            <div className="mt-5">
              <div className="mb-2.5 flex items-center justify-between text-[15px]">
                <span className="font-medium">Size{size && <b className="ml-1.5">{size}</b>}</span>
                <Link href="/pages/sizing-guide" target="_blank" className="text-[13.5px] font-bold underline">Size guide</Link>
              </div>
              <Segmented options={SIZES} value={size} onChange={(v) => { setSize(v); setError(""); }} />
              {size && size !== "Custom" ? (
                <p className="mt-2.5 text-[13px] text-muted">Widths thumb → pinky: {SIZE_CHART.find((c) => c.size === size)?.mm.join(" / ")} mm</p>
              ) : (
                <p className="mt-2.5 text-[13px] text-muted">Between sizes? <b className="text-plum">Size up. Free size swap in 30 days.</b></p>
              )}
              {size === "Custom" && (
                <div className="mt-3 grid grid-cols-5 gap-2 rounded-xl bg-card p-3">
                  {FINGERS.map((f, i) => (
                    <label key={f} className="text-center text-[11px] text-muted">
                      {f}
                      <input
                        inputMode="decimal"
                        value={custom[i]}
                        onChange={(e) => setCustom((c) => c.map((v, j) => (j === i ? e.target.value.replace(/[^\d.]/g, "") : v)))}
                        className="input mt-1 px-1 py-2 text-center"
                        placeholder="mm"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5">
              <p className="mb-2.5 text-[15px] font-medium">Shape</p>
              <Segmented options={SHAPES} value={shape} onChange={(v) => { setShape(v); setView(0); }} />
            </div>
          </>
        )}

        <div className="mt-5 flex gap-3">
          <div className="flex h-[52px] w-[110px] shrink-0 items-center justify-between rounded-full border border-plum/60 px-3.5">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><MinusIcon width={16} height={16} /></button>
            <span className="text-[15px]">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity"><PlusIcon width={16} height={16} /></button>
          </div>
          <button ref={atcRef} onClick={submit} className="h-[52px] flex-1 rounded-full bg-plum text-[15px] font-bold uppercase tracking-[1.6px] text-white shadow-[0_6px_18px_rgba(75,56,76,0.25)] transition hover:bg-plum-light">
            Add to cart<span className="md:hidden"> · {money(p.price * qty)}</span>
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-[#b0263c]">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          <div className="flex items-center gap-3 bg-[#fbeef2] px-3 py-3 xl:gap-4 xl:px-4 xl:py-3.5">
            <TruckIcon width={20} height={20} className="text-[#b5577c]" />
            <div className="min-w-0 flex-1 text-[13px] xl:text-[14px]">
              <p className="truncate font-medium">Arrives {fmt(addDays(7))} to {fmt(addDays(11))}</p>
              <p className="truncate text-[11.5px] xl:text-[12.5px]"><b>Order now</b> · ships {fmt(addDays(1))} to {fmt(addDays(2))}</p>
            </div>
            <div className="flex gap-1.5">
              {[[hh, "HRS"], [mm, "MIN"], [ss, "SEC"]].map(([n, l], i) => (
                <span key={l} className="grid w-[32px] rounded-md bg-white py-1 xl:w-[38px] text-center leading-none shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <b className={`text-[15px] ${i === 2 ? "text-[#b5577c]" : ""}`}>{n}</b>
                  <span className="mt-1 text-[9px] text-muted">{l}</span>
                </span>
              ))}
            </div>
          </div>
          <Link href="/pages/return-policy" className="flex items-center gap-3 px-3 py-4 xl:gap-4 xl:px-4">
            <ShieldIcon width={20} height={20} />
            <div className="flex-1 text-[14px]">
              <p className="font-medium">Buyer Protection</p>
              <p className="text-[12.5px] text-muted">Wrong, damaged or defective? Full refund or free replacement</p>
            </div>
            <span className="flex items-center gap-1 text-[13px] font-medium"><span className="hidden xl:inline">Details</span> <ChevronRight width={14} height={14} /></span>
          </Link>
        </div>

        <div className="mt-6">
          {[
            { q: "Product details", a: <p>{p.description}</p> },
            { q: "What's in the box", a: <ul className="list-disc pl-5">{SETS_INCLUDED.map((s) => <li key={s}>{s}</li>)}</ul> },
          ].map((f) => (
            <details key={f.q} className="group border-b border-plum">
              <summary className="flex h-[62px] cursor-pointer list-none items-center justify-between text-[15.5px] font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <PlusIcon width={18} height={18} className="transition group-open:rotate-45" />
              </summary>
              <div className="pb-5 text-[14.5px] leading-relaxed text-muted">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
    {/* Mobile sticky add-to-cart, shown once the main button scrolls out of view */}
    <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-3 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-300 md:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px]">{p.title}</p>
          <p className="text-[13px] font-bold">{money(p.price)}{p.compareAt && <s className="ml-1.5 font-normal text-muted">{money(p.compareAt)}</s>}</p>
        </div>
        <button onClick={() => (isSet && !size ? atcRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) : submit())} className="h-11 shrink-0 rounded-full bg-plum px-6 text-[13.5px] font-bold uppercase tracking-[1.3px] text-white">
          {isSet && !size ? "Choose size" : "Add to cart"}
        </button>
      </div>
    </div>
    </>
  );
}
