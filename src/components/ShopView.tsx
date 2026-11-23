"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useCart } from "./CartContext";
import { ArrowRightIcon, BagIcon, CloseIcon, FilterIcon, HeartIcon, SearchIcon, SparkleIcon } from "./icons";
import { money } from "@/lib/pricing";
import {
  CATEGORIES,
  COLLECTIONS,
  LENGTHS,
  SHAPES,
  SIZES,
  SORTS,
  filterProducts,
  filtersQuery,
  hasSize,
  productImage,
  titleCase,
  type Product,
  type ShopFilters,
  type SortId,
} from "@/lib/shop";

const FAVORITES_KEY = "oreo-favorites";

/** favourite products — kept in this browser only (localStorage; any tab's change shows everywhere) */
const favListeners = new Set<() => void>();
function readFavorites(): string {
  try {
    return localStorage.getItem(FAVORITES_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function subscribeFavorites(cb: () => void) {
  favListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    favListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function useFavorites() {
  const raw = useSyncExternalStore(subscribeFavorites, readFavorites, () => "[]");
  const favs = useMemo<string[]>(() => {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  }, [raw]);
  const toggle = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {}
    favListeners.forEach((l) => l());
  };
  return { favs, toggle };
}

/** what fills the right side of a slide: a photo, or a few nail sets from the shop */
type SlideArt = { photo: string; focus?: string } | { sets: Product[] };
type Slide = { kicker: string; title: string; text: string; href: string; cta: string; art: SlideArt };

const HOLIDAY_PHOTO = "/shop/holiday-glam.jpg";

/** banner slides — each with its own picture; the promo slide follows the store's "x sets, y free" rules */
function useSlides(products: Product[] | null): Slide[] {
  const { pricing } = useCart();
  const tiers = pricing?.tiers ?? [];
  const first = tiers[0];
  const last = tiers.at(-1);
  const all = products ?? [];
  const best = all.filter((p) => p.bestSeller).slice(0, 3);
  // the bundle slide shows other sets than the best-sellers one when there are enough
  const others = all.filter((p) => !best.includes(p));
  const bundle = (others.length >= 3 ? others : all).slice(0, 3);
  const sets = (list: Product[]): SlideArt => (list.length ? { sets: list } : { photo: HOLIDAY_PHOTO });

  return [
    {
      kicker: "New collection",
      title: "Holiday Glam",
      text: "Festive nail sets for a brighter season.",
      href: "/shop?collection=holiday",
      cta: "Shop Now",
      art: { photo: HOLIDAY_PHOTO, focus: "45% center" }, // phones crop the sides: keep the nails
    },
    {
      kicker: "Best sellers",
      title: "Best Sellers",
      text: "Our most-loved sets, hand-painted and ready to wear.",
      href: "/shop?best=1",
      cta: "Shop Now",
      art: sets(best),
    },
    ...(first && last
      ? [
          {
            kicker: "Bundle & save",
            title: `${first.sets} sets, ${first.free} free`,
            text: `Mix any sets — up to ${last.free} free with ${last.sets}.`,
            href: "/shop",
            cta: "Shop Now",
            art: sets(bundle),
          },
        ]
      : []),
    {
      kicker: "Custom nail",
      title: "Design your own",
      text: "Describe it, try it on, we paint it by hand.",
      href: "/",
      cta: "Start Designing",
      art: { photo: "/shop/custom-hand.jpg", focus: "50% 22%" }, // keep the nails in the frame
    },
  ];
}

const TILT = ["-rotate-3", "rotate-2", "-rotate-1"];

/** the picture of one slide (all are stacked; the active one fades in) */
function SlideArtLayer({ art, active }: { art: SlideArt; active: boolean }) {
  const fade = `absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${active ? "opacity-100" : "opacity-0"}`;
  if ("photo" in art) {
    return (
      <div aria-hidden className={fade}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static banner photo */}
        <img
          src={art.photo}
          alt=""
          style={{ objectPosition: art.focus ?? "right center" }}
          className="absolute inset-y-0 right-0 h-full w-[72%] object-cover [mask-image:linear-gradient(to_right,transparent,black_35%)] tab:w-[58%]"
        />
      </div>
    );
  }
  return (
    <div aria-hidden className={fade}>
      <div className="absolute inset-y-0 right-3 flex w-[44%] flex-col items-end justify-center gap-2 tab:right-[4%] tab:w-[58%] tab:flex-row tab:items-center tab:justify-end tab:gap-4">
        {art.sets.map((p, k) => (
          <div
            key={p.id}
            className={`w-full max-w-[240px] rounded-2xl border border-line bg-ivory p-1.5 soft-shadow tab:w-1/3 tab:p-2 ${TILT[k % TILT.length]} ${k > 1 ? "max-tab:hidden" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- store image through our cached route */}
            <img src={productImage(p)} alt="" className="aspect-[2.5/1] w-full rounded-xl object-cover mix-blend-multiply" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ products }: { products: Product[] | null }) {
  const slides = useSlides(products);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [auto, slides.length]);
  const current = i % slides.length;
  const s = slides[current];

  return (
    <section aria-roledescription="carousel" aria-label="Featured" className="relative my-[18px] min-h-[200px] overflow-hidden rounded-3xl bg-[#f6e3da] tab:min-h-[220px]">
      {slides.map((x, k) => (
        <SlideArtLayer key={x.kicker} art={x.art} active={k === current} />
      ))}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,#f8ebe4_30%,rgba(248,235,228,.75)_60%,rgba(248,235,228,.2))] tab:bg-[linear-gradient(90deg,#f8ebe4_40%,rgba(248,235,228,.6)_58%,transparent_72%)]"
      />
      <div className="relative px-[22px] py-[26px] tab:px-[clamp(20px,15vw,240px)] tab:py-[34px]" aria-live="polite">
        <p className="text-[12px] font-medium tracking-[0.3em] uppercase">{s.kicker}</p>
        <h1 className="display-title my-1.5 text-[clamp(34px,4.6vw,54px)] leading-[1.1]">{s.title}</h1>
        <p className="mb-4 max-w-[16rem] text-[16px] tab:max-w-none">{s.text}</p>
        <Link href={s.href} className="btn-brown btn-label inline-flex min-h-11 items-center gap-2.5 rounded-full px-[22px] text-white">
          {s.cta}
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-3.5 left-[52%] flex gap-2">
          {slides.map((x, k) => (
            <button
              key={x.kicker}
              type="button"
              aria-label={`Slide ${k + 1}: ${x.title}`}
              aria-current={k === current}
              onClick={() => {
                setI(k);
                setAuto(false);
              }}
              className={`h-3 w-3 rounded-full border-[1.5px] border-cocoa ${k === current ? "bg-cocoa" : ""}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type Toggle = (key: "categories" | "shapes" | "lengths", value: string) => void;

function FilterPanel({ f, toggle, clear }: { f: ShopFilters; toggle: Toggle; clear: () => void }) {
  const groups: { title: string; key: "categories" | "shapes" | "lengths"; options: { id: string; label: string }[]; on: string[] }[] = [
    { title: "Category", key: "categories", options: CATEGORIES, on: f.categories },
    { title: "Shape", key: "shapes", options: SHAPES.map((s) => ({ id: s, label: titleCase(s) })), on: f.shapes },
    { title: "Length", key: "lengths", options: LENGTHS.map((l) => ({ id: l, label: titleCase(l) })), on: f.lengths },
  ];
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-line pb-3 text-[17px] font-semibold">
        <FilterIcon className="h-[22px] w-[22px]" />
        Filters
        <button type="button" onClick={clear} className="ml-auto text-[13px] font-normal hover:underline">
          Clear All
        </button>
      </div>
      {groups.map((g) => (
        <div key={g.key} role="group" aria-labelledby={`filter-${g.key}`} className="border-b border-line py-3 last:border-0">
          <h4 id={`filter-${g.key}`} className="mb-1.5 text-[16px] font-medium">
            {g.title}
          </h4>
          {g.options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2.5 py-[3px] text-[14px]">
              <input type="checkbox" className="ck-box" checked={g.on.includes(o.id)} onChange={() => toggle(g.key, o.id)} />
              {o.label}
            </label>
          ))}
        </div>
      ))}
    </>
  );
}

/** pick size + length, then add (tools go straight in) */
function AddToCart({ product, onAdded, onClose }: { product: Product; onAdded: (name: string) => void; onClose: () => void }) {
  const { addProduct } = useCart();
  const ref = useRef<HTMLDivElement>(null);
  const lengths = product.lengths.length ? product.lengths : [...LENGTHS];
  const [size, setSize] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(lengths.length === 1 ? lengths[0] : null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const chip = (on: boolean) =>
    `min-w-9 rounded-full border px-2.5 py-1 text-[13px] transition ${on ? "border-brown bg-brown text-white" : "border-line bg-white hover:border-brown"}`;

  return (
    <div ref={ref} role="dialog" aria-label={`Add ${product.name} to cart`} className="absolute inset-x-2 bottom-2 z-10 rounded-2xl border border-line bg-white p-3 soft-shadow">
      <p className="text-[12px] font-medium tracking-[0.1em] text-cocoa-soft uppercase">Size</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {SIZES.map((s) => (
          <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={chip(size === s)}>
            {s}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] font-medium tracking-[0.1em] text-cocoa-soft uppercase">Length</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {lengths.map((l) => (
          <button key={l} type="button" aria-pressed={length === l} onClick={() => setLength(l)} className={chip(length === l)}>
            {titleCase(l)}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!size || !length}
        onClick={() => {
          addProduct(product, { size, length });
          onAdded(product.name);
        }}
        className="btn-brown btn-label mt-2.5 min-h-10 w-full rounded-full text-[14px] text-white disabled:opacity-50"
      >
        {size && length ? "Add to Cart" : "Choose size & length"}
      </button>
    </div>
  );
}

function ProductCard({ product, favorite, onFavorite, onAdded }: { product: Product; favorite: boolean; onFavorite: () => void; onAdded: (name: string) => void }) {
  const { addProduct } = useCart();
  const [picking, setPicking] = useState(false);
  const details = [product.shapes.map(titleCase).join(" / "), product.lengths.map(titleCase).join(" / ")].filter(Boolean).join(" · ");

  return (
    <li className="relative rounded-[18px] border border-line bg-ivory px-3.5 pt-2.5 pb-3.5 soft-shadow">
      {/* eslint-disable-next-line @next/next/no-img-element -- store image through our cached route */}
      <img
        src={productImage(product)}
        alt={`${product.name} press-on nail set`}
        loading="lazy"
        className="aspect-[2.5/1] w-full rounded-[10px] object-cover mix-blend-multiply"
      />
      <button
        type="button"
        onClick={onFavorite}
        aria-pressed={favorite}
        aria-label={favorite ? `Remove ${product.name} from favorites` : `Save ${product.name}`}
        className="absolute top-1.5 right-1.5 grid h-11 w-11 place-items-center rounded-full"
      >
        <HeartIcon filled={favorite} className={`h-5 w-5 ${favorite ? "text-wine" : ""}`} />
      </button>
      <div className="mt-2.5 flex items-end text-[14px]">
        <div className="flex-1">
          {product.name}
          <br />
          <b className="font-medium">{money(product.price)}</b>
          {product.compareAtPrice && <span className="ml-1.5 text-[12px] text-cocoa-soft line-through">{money(product.compareAtPrice)}</span>}
          {details && (
            <>
              <br />
              <span className="text-[12px] text-cocoa-soft">{details}</span>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label={`Add ${product.name} to cart`}
          aria-expanded={picking}
          onClick={() => {
            if (!hasSize(product.category)) {
              addProduct(product);
              onAdded(product.name);
            } else setPicking((v) => !v);
          }}
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-brown text-white transition active:scale-95"
        >
          <BagIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
      {picking && (
        <AddToCart
          product={product}
          onClose={() => setPicking(false)}
          onAdded={(name) => {
            setPicking(false);
            onAdded(name);
          }}
        />
      )}
    </li>
  );
}

/** Shop: banner, filters (sidebar; a toggle on phones), sort, product grid. Filters live in the URL. */
export default function ShopView({ products, initial }: { products: Product[] | null; initial: ShopFilters }) {
  const [f, setF] = useState(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { favs, toggle: toggleFav } = useFavorites();

  // keep the URL in step, so refresh / share shows the same list
  useEffect(() => {
    const url = `/shop${filtersQuery(f)}`;
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, "", url);
  }, [f]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const list = useMemo(() => (products ? filterProducts(products, f) : []), [products, f]);

  const toggle: Toggle = (key, value) =>
    setF((cur) => {
      const arr = cur[key] as string[];
      return { ...cur, [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });
  const clear = () => setF({ categories: [], shapes: [], lengths: [], collection: null, best: false, sort: f.sort, q: "" });

  const title = f.q
    ? `Results for “${f.q}”`
    : f.collection
      ? (COLLECTIONS[f.collection] ?? titleCase(f.collection))
      : f.best
        ? "Best Sellers"
        : f.categories.length === 1
          ? CATEGORIES.find((c) => c.id === f.categories[0])!.label
          : "All Products";

  function showToast(text: string) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const pill = "min-h-11 rounded-full border border-line bg-ivory px-[18px]";

  return (
    <div className="mx-auto w-full max-w-[97.5rem] px-[clamp(14px,3vw,40px)]">
      <Hero products={products} />

      <div className="grid grid-cols-1 gap-9 pb-[50px] tab:grid-cols-[290px_minmax(0,1fr)]">
        <aside
          aria-label="Filters"
          className={`self-start rounded-[18px] border border-line bg-ivory px-[22px] py-[18px] soft-shadow tab:sticky tab:top-[100px] tab:block ${
            filtersOpen ? "block" : "hidden"
          }`}
        >
          <FilterPanel f={f} toggle={toggle} clear={clear} />
        </aside>

        <section aria-labelledby="shop-title" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 id="shop-title" className="display-title m-0 basis-full text-[24px] tab:flex-1 tab:basis-auto tab:text-[28px]">
              {title} ({list.length})
            </h2>
            <button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)} className={`${pill} inline-flex items-center gap-2 tab:hidden`}>
              <FilterIcon className="h-5 w-5" />
              Filters
            </button>
            <label className="relative">
              <span className="sr-only">Sort</span>
              <select
                value={f.sort}
                onChange={(e) => setF((cur) => ({ ...cur, sort: e.target.value as SortId }))}
                className={`${pill} cursor-pointer appearance-none pr-10`}
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id === "featured" ? "Sort by: Featured" : s.label}
                  </option>
                ))}
              </select>
              <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </label>
          </div>

          {(f.collection || f.best || f.q) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                f.collection && { label: COLLECTIONS[f.collection] ?? titleCase(f.collection), off: () => setF((c) => ({ ...c, collection: null })) },
                f.best && { label: "Best Sellers", off: () => setF((c) => ({ ...c, best: false })) },
                f.q && { label: `“${f.q}”`, off: () => setF((c) => ({ ...c, q: "" })) },
              ]
                .filter((x): x is { label: string; off: () => void } => !!x)
                .map((x) => (
                  <button key={x.label} type="button" onClick={x.off} className="inline-flex items-center gap-1.5 rounded-full bg-pink-2 px-3.5 py-1.5 text-[14px]">
                    {x.label}
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                ))}
            </div>
          )}

          {products === null ? (
            <p className="px-2.5 py-[60px] text-center text-cocoa-soft">Our shop is unavailable right now. Please try again in a few minutes.</p>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-2.5 py-[60px] text-center text-cocoa-soft">
              <SearchIcon className="h-9 w-9" />
              <p>{products.length ? "No sets match these filters yet." : "New sets are coming soon."}</p>
              {products.length > 0 && (
                <button type="button" onClick={clear} className="btn-brown btn-label min-h-11 rounded-full px-[22px] text-white">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2.5 tab:grid-cols-3 tab:gap-3.5 nav:grid-cols-4">
              {list.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  favorite={favs.includes(p.id)}
                  onFavorite={() => {
                    showToast(favs.includes(p.id) ? "Removed from wishlist" : "Saved to wishlist");
                    toggleFav(p.id);
                  }}
                  onAdded={(name) => showToast(`${name} added to cart`)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* below 1180px the header has no "Custom Nail" button: a floating shortcut instead */}
      <Link
        href="/"
        aria-label="Design your own custom nails"
        className={`fab-in btn-brown fixed right-4 bottom-[calc(18px+env(safe-area-inset-bottom))] z-[35] inline-flex min-h-11 items-center gap-[7px] rounded-full pr-4 pl-[13px] text-[14px] font-medium text-white shadow-[0_8px_22px_rgba(58,33,23,.35)] nav:hidden`}
      >
        <SparkleIcon className="h-[18px] w-[18px]" />
        Custom Nail
      </Link>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-cocoa px-[22px] py-3 text-[14px] whitespace-nowrap text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
