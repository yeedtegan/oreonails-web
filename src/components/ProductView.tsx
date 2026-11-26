"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { openCart, useCart } from "./CartContext";
import { ProductCard, useFavorites } from "./ShopView";
import { BagIcon, ChevronDownIcon, ChevronRightIcon, GiftIcon, HeartIcon, MinusIcon, PencilIcon, PlusIcon, SparkleIcon, ToolIcon, TruckIcon } from "./icons";
import { flyToCart } from "@/lib/flyToCart";
import { productParams, track } from "@/lib/metaPixel";
import { money } from "@/lib/pricing";
import { CATEGORIES, DEFAULT_SIZE, LENGTHS, SHAPES, SIZES, hasSize, productImage, titleCase, type Product } from "@/lib/shop";

/** little nail outlines for the shape pills (12 × 20) */
const SHAPE_PATHS: Record<string, string> = {
  almond: "M6 1C2 5 1 10 1 19h10C11 10 10 5 6 1z",
  coffin: "M3 1h6l2 18H1z",
  square: "M1 1h10v18H1z",
  oval: "M6 1C2 1 1 6 1 10v9h10v-9c0-4-1-9-5-9z",
  stiletto: "M6 0C3 6 1 12 1 19h10C11 12 9 6 6 0z",
};

const SUBTITLE: Record<Product["category"], string> = {
  "press-on": "Hand-painted press-on nails · 24 nails per set",
  toenails: "Hand-painted press-on toenails",
  bundles: "A bundle of hand-painted sets",
  tools: "Nail tools & accessories",
};

const pill = "inline-flex min-h-[42px] items-center gap-[7px] rounded-full border px-4 py-[7px] text-[14px] transition";
const pillOn = "border-brown bg-brown text-white";
const pillOff = "border-[#e2cfc6] bg-white hover:border-brown";

function Accordion({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between px-0.5 py-[15px] font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="h-[18px] w-[18px] transition group-open:rotate-180" />
      </summary>
      <div className="px-0.5 pb-4 text-[14.5px] text-[#5d473e] [&_li]:my-[3px] [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </details>
  );
}

/** One set: photo · name, price, shape / length / size, quantity, add to cart · details · related sets. */
export default function ProductView({ product: p, related }: { product: Product; related: Product[] }) {
  const { addProduct, pricing } = useCart();
  const { favs, toggle: toggleFav } = useFavorites();
  const sized = hasSize(p.category);
  // painted to order: every shape and length can be picked; the set's own ones are chosen at the start
  const [shape, setShape] = useState<string>(p.shapes[0] ?? SHAPES[0]);
  const [length, setLength] = useState<string>(p.lengths[0] ?? LENGTHS[0]);
  const [size, setSize] = useState<string | null>(DEFAULT_SIZE);
  const [qty, setQty] = useState(1);
  const [needSize, setNeedSize] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sizeRef = useRef<HTMLDivElement>(null);
  const fav = favs.includes(p.id);
  const maxQty = pricing?.maxQuantity ?? 10;
  const off = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  const category = CATEGORIES.find((c) => c.id === p.category);
  const tiers = pricing?.tiers ?? [];
  const firstTier = tiers[0];
  const lastTier = tiers.at(-1);

  // phones: the footer clears the fixed "Add to Cart" bar
  useEffect(() => {
    document.body.classList.add("on-pdp");
    return () => document.body.classList.remove("on-pdp");
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  // Meta Pixel: product page seen (the store sells in USD; pricing may still be loading)
  useEffect(() => {
    track("ViewContent", productParams(p, "usd"));
  }, [p]);

  function showToast(text: string) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  /** adds the chosen set and flies it from the pressed button into the cart; false when a size is still missing */
  function add(button?: HTMLElement | null): boolean {
    if (sized && !size) {
      setNeedSize(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    addProduct(p, { quantity: qty, size, length: sized ? length : null, shape: sized ? shape : null });
    flyToCart(button);
    return true;
  }

  const favButton = (
    <button
      type="button"
      onClick={() => {
        showToast(fav ? "Removed from wishlist" : "Saved to wishlist");
        if (!fav) track("AddToWishlist", productParams(p, pricing?.currency));
        toggleFav(p.id);
      }}
      aria-pressed={fav}
      aria-label={fav ? `Remove ${p.name} from favorites` : `Save ${p.name}`}
      className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-white soft-shadow"
    >
      <HeartIcon filled={fav} className={`h-5 w-5 ${fav ? "text-wine" : ""}`} />
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[97.5rem] px-[clamp(14px,3vw,40px)]">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 pt-3 text-[13px] text-cocoa-soft tab:pt-[18px]">
        <Link href="/shop" className="hover:text-cocoa">
          Shop
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        {category && (
          <>
            <Link href={`/shop?category=${category.id}`} className="hover:text-cocoa">
              {category.label}
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </>
        )}
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="grid items-start gap-[18px] pt-2.5 pb-10 tab:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] tab:gap-[clamp(24px,4vw,56px)] tab:pt-4">
        {/* photo */}
        <div className="tab:sticky tab:top-[100px]">
          <div className="relative aspect-[1.25] overflow-hidden rounded-[22px] border border-line bg-[#fcf1eb] tab:aspect-[4/3] tab:rounded-[26px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- store image through our cached route */}
            <img
              src={productImage(p)}
              alt={`${p.name} press-on nail set`}
              className="h-full w-full object-contain p-[6%] [mask-image:radial-gradient(ellipse_72%_60%_at_50%_50%,#000_55%,transparent_100%)]"
            />
            {off > 0 && <span className="absolute top-4 left-4 rounded-full bg-brown px-3 py-1 text-[13px] font-medium text-white">−{off}%</span>}
            {favButton}
          </div>
        </div>

        {/* info */}
        <div>
          <h1 className="mt-1 mb-1.5 text-[clamp(28px,3vw,38px)] leading-[1.15] font-medium">{p.name}</h1>
          <p className="mb-3.5 text-[14px] text-cocoa-soft">{SUBTITLE[p.category]}</p>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <b className="text-[28px] font-semibold">{money(p.price)}</b>
            {off > 0 && (
              <>
                <s className="text-[17px] text-cocoa-soft">{money(p.compareAtPrice!)}</s>
                <span className="rounded-full bg-pink px-2.5 py-0.5 text-[13px] font-semibold text-brown">Save {money(p.compareAtPrice! - p.price)}</span>
              </>
            )}
          </div>

          {sized && (
            <>
              <div role="group" aria-labelledby="opt-shape">
                <h4 id="opt-shape" className="mt-5 mb-[9px] flex items-center gap-2 text-[15px] font-semibold">
                  Shape <span className="font-normal text-cocoa-soft">{titleCase(shape)}</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SHAPES.map((s) => (
                    <button key={s} type="button" aria-pressed={shape === s} onClick={() => setShape(s)} className={`${pill} ${shape === s ? pillOn : pillOff}`}>
                      <svg viewBox="0 0 12 20" aria-hidden className="h-5 w-3 fill-current opacity-85">
                        <path d={SHAPE_PATHS[s]} />
                      </svg>
                      {titleCase(s)}
                    </button>
                  ))}
                </div>
              </div>
              <div role="group" aria-labelledby="opt-length">
                <h4 id="opt-length" className="mt-5 mb-[9px] flex items-center gap-2 text-[15px] font-semibold">
                  Length <span className="font-normal text-cocoa-soft">{titleCase(length)}</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {LENGTHS.map((l) => (
                    <button key={l} type="button" aria-pressed={length === l} onClick={() => setLength(l)} className={`${pill} ${length === l ? pillOn : pillOff}`}>
                      {titleCase(l)}
                    </button>
                  ))}
                </div>
              </div>
              <div ref={sizeRef} role="group" aria-labelledby="opt-size">
                <h4 id="opt-size" className="mt-5 mb-[9px] flex items-center gap-2 text-[15px] font-semibold">
                  Size{" "}
                  {size ? (
                    <span className="font-normal text-cocoa-soft">{size}</span>
                  ) : (
                    needSize && (
                      <span role="alert" className="font-normal text-wine">
                        Please choose a size
                      </span>
                    )
                  )}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      onClick={() => {
                        setSize(s);
                        setNeedSize(false);
                      }}
                      className={`${pill} min-w-[54px] justify-center ${size === s ? pillOn : needSize ? "border-wine bg-white" : pillOff}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* tablet+: quantity · Add to Cart · Buy it now (phones: the bar at the bottom) */}
          <div className="mt-[22px] hidden items-center gap-3 tab:flex">
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-white p-1">
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-full bg-pink-2 disabled:opacity-50">
                <MinusIcon className="h-4 w-4" />
              </button>
              <b className="w-6 text-center font-medium" aria-live="polite">
                {qty}
              </b>
              <button type="button" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="grid h-9 w-9 place-items-center rounded-full bg-pink-2 disabled:opacity-50">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <button type="button" onClick={(e) => add(e.currentTarget)} className="btn-brown flex min-h-[54px] flex-1 items-center justify-center gap-2.5 rounded-full px-[22px] text-[17px] font-medium text-white">
              <BagIcon className="h-[22px] w-[22px]" />
              Add to Cart · {money(p.price * qty)}
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => add(e.currentTarget) && openCart()}
            className="mt-2.5 hidden min-h-[50px] w-full items-center justify-center rounded-full border-[1.5px] border-brown font-medium text-brown transition hover:bg-pink-2 tab:flex"
          >
            Buy it now
          </button>

          {sized && firstTier && lastTier && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-pink-2 px-4 py-3 text-[14px]">
              <GiftIcon className="h-[22px] w-[22px] shrink-0 text-brown" />
              <span>
                <b className="font-semibold">
                  Buy {firstTier.sets}, get {firstTier.free} free
                </b>
                {lastTier !== firstTier && ` · mix & match any sets, up to ${lastTier.free} free with ${lastTier.sets}`}
              </span>
            </div>
          )}

          <ul className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { icon: TruckIcon, text: pricing && pricing.freeShippingMin > 0 ? `Free US shipping over ${money(pricing.freeShippingMin).replace(/\.00$/, "")}` : "Shipped within the US" },
              { icon: PencilIcon, text: "Painted by hand, made to order" },
              { icon: ToolIcon, text: "Glue & tabs kit included" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex flex-col items-center gap-1.5 rounded-[14px] border border-line bg-ivory px-2 py-3 text-center text-[11.5px] tab:text-[12.5px]">
                <Icon className="h-[22px] w-[22px] text-brown" />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-[18px] border-t border-line">
            <Accordion title="Description" open>
              {p.name} — painted by hand to order in your chosen length and size, with a glossy top coat for shine.
            </Accordion>
            {sized && (
              <>
                <Accordion title="What's in the box">
                  <ul>
                    <li>24 hand-painted nails (12 sizes)</li>
                    <li>Nail glue and adhesive tabs</li>
                    <li>Mini file, buffer and cuticle stick</li>
                    <li>Alcohol prep pad</li>
                  </ul>
                </Accordion>
                <Accordion title="How to apply">
                  <ol>
                    <li>Push back cuticles, buff lightly and wipe with the prep pad.</li>
                    <li>Pick the right size for each finger.</li>
                    <li>Use glue for long wear or tabs for a few days.</li>
                    <li>Press each nail at an angle for 20–30 seconds.</li>
                  </ol>
                </Accordion>
              </>
            )}
            <Accordion title="Shipping & returns">
              Made to order, then shipped within the US.
              {pricing && pricing.freeShippingMin > 0 && ` Free shipping on orders over ${money(pricing.freeShippingMin).replace(/\.00$/, "")}.`} Shipping times and the return policy are confirmed at
              checkout.
            </Accordion>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-[18px] bg-[linear-gradient(135deg,#7a4a33,#5a3424)] px-[18px] py-4 text-white max-tab:flex-wrap">
            <p className="flex-1 text-[14px]">
              <b className="block text-[16px] font-semibold">Love it, want a twist?</b>
              Use this set as a starting point in Custom Nail.
            </p>
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-[9px] text-[14px] font-medium whitespace-nowrap text-brown">
              <SparkleIcon className="h-4 w-4" />
              Customize
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="rel-title" className="pb-[50px]">
          <h2 id="rel-title" className="display-title mt-2.5 mb-4 text-[26px]">
            You may also like
          </h2>
          <ul className="grid grid-cols-2 gap-2.5 tab:grid-cols-3 tab:gap-3.5 nav:grid-cols-4">
            {related.map((r) => (
              <ProductCard
                key={r.id}
                product={r}
                favorite={favs.includes(r.id)}
                onFavorite={() => {
                  showToast(favs.includes(r.id) ? "Removed from wishlist" : "Saved to wishlist");
                  if (!favs.includes(r.id)) track("AddToWishlist", productParams(r, pricing?.currency));
                  toggleFav(r.id);
                }}
              />
            ))}
          </ul>
        </section>
      )}

      {/* phones: price + Add to Cart pinned to the bottom */}
      <div className="fixed inset-x-0 bottom-0 z-[35] flex items-center gap-3 border-t border-line bg-cream/95 px-3.5 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] backdrop-blur-md tab:hidden">
        <div className="flex flex-col leading-[1.2]">
          <b className="text-[19px] font-semibold">{money(p.price * qty)}</b>
          {off > 0 && <s className="text-[12px] text-cocoa-soft">{money(p.compareAtPrice! * qty)}</s>}
        </div>
        <button type="button" onClick={(e) => add(e.currentTarget)} className="btn-brown flex min-h-[50px] flex-1 items-center justify-center gap-2.5 rounded-full text-[16px] font-medium text-white">
          <BagIcon className="h-[22px] w-[22px]" />
          Add to Cart
        </button>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-cocoa px-[22px] py-3 text-[14px] whitespace-nowrap text-white tab:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}
