import Link from "next/link";
import type { Collection, Product } from "@/lib/data";
import { api } from "@/lib/api-server";
import NailArt from "@/components/NailArt";
import Photo from "@/components/Photo";
import ProductCard, { ProductGrid } from "@/components/ProductCard";
import ReviewCarousel from "@/components/ReviewCarousel";
import { FaqColumns, CollectionHeader, MobileCta } from "@/components/ui";
import { BrushIcon, ClockIcon, RepeatIcon, Stars, UsersIcon } from "@/components/Icons";
import { ArticleCards, FeatureIcons } from "@/components/sections";
import { CollectionArt } from "@/components/Art";

// Section order, spacing and type scale follow the reference homepage at 1440px.
// Photos are optional: put files in public/images/ (names noted per section) to replace the illustrations.

const TRENDING = [
  { handle: "best-sellers", label: "Best Sellers" },
  { handle: "new-arrivals", label: "Just Dropped" },
  { handle: "toenails", label: "Toe Nails", isNew: true },
  { handle: "holiday-glam", label: "Holiday Glam" },
  { handle: "cozy-fall", label: "Cozy Fall" },
  { handle: "star-signs", label: "Mystic Zodiac" },
];

export default async function Home() {
  const [collections, holiday, bestSellers, bundles, tools, articles, reviewData, faqs] = await Promise.all([
    api.collections(),
    api.products({ collection: "holiday-glam", type: "set", limit: 8 }),
    api.products({ collection: "best-sellers", limit: 8 }),
    api.products({ collection: "bundles", limit: 8 }),
    api.products({ collection: "tools-accessories", limit: 4 }),
    api.articles(3),
    api.reviews({ limit: 12 }),
    api.faqs(),
  ]);
  const reviewProducts = await api.products({ handles: reviewData.reviews.map((r) => r.product).filter((h): h is string => !!h) });
  const col = (h: string) => collections.find((c) => c.handle === h);

  return (
    <>
      <Hero />
      <Trending tiles={TRENDING.map((t) => ({ ...t, c: col(t.handle) }))} />

      <section className="container-x pt-10 pb-10 md:pt-[55px]">
        <CollectionHeader title="Holiday Glam Is Here" subtitle="New festive sets. Shop early." href="/collections/holiday-glam" />
        <ProductGrid products={holiday} />
        <MobileCta href="/collections/holiday-glam" />
      </section>

      <WideBanner />

      <section className="container-x pt-12 pb-10 md:pt-[65px]">
        <CollectionHeader title="Best Sellers" subtitle="The sets our customers keep coming back for." href="/collections/best-sellers" />
        <ProductGrid products={bestSellers} />
        <MobileCta href="/collections/best-sellers" />
      </section>

      <section className="container-x pt-10 pb-6 md:pt-[35px]">
        <CollectionHeader title="Bundle For You" subtitle="The ultimate choice, abundant offers" href="/collections/bundles" />
        <ProductGrid products={bundles} />
        <MobileCta href="/collections/bundles" />
      </section>

      <ToolsBlock tools={tools} />

      <ArticleCards articles={articles} title="Latest from the Nail Guide" cta />

      <section className="pt-5 pb-6">
        <div className="container-x text-center">
          <h2 className="font-display text-[34px] font-medium text-[#0b0b0b] md:text-[42px]">Customers are saying</h2>
          <div className="mt-3 flex items-center justify-center gap-3 text-base text-black">
            <Stars rating={reviewData.summary.average} size={20} />
            <span>
              {reviewData.summary.average.toFixed(2)} ({reviewData.summary.count.toLocaleString()} reviews)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-[3px] bg-plum text-[12px] leading-none text-white">✓</span>Verified
            </span>
          </div>
        </div>
        <div className="mt-8">
          <ReviewCarousel reviews={reviewData.reviews} products={reviewProducts} />
        </div>
      </section>

      <AsSeenIn />

      <section className="border-b border-[#e9e6e8]">
        <div className="container-x pt-10 pb-10">
          <h2 className="text-center font-display text-[30px] font-medium md:text-[40px]">Frequently Asked Questions</h2>
          <div className="mt-7">
            <FaqColumns items={faqs.slice(0, 6)} />
          </div>
        </div>
      </section>

      <FeatureIcons />
    </>
  );
}

/* ---------- sections ---------- */

const TRUST = [
  { icon: <ClockIcon width={20} height={20} />, text: "Salon Look in Under 10 Minutes" },
  { icon: <BrushIcon width={20} height={20} />, text: "Hand Painted by Artists" },
  { icon: <UsersIcon width={20} height={20} />, text: "Trusted by 18,000+ customers" },
  { icon: <RepeatIcon width={20} height={20} />, text: "Wears 2–4 Weeks, Reusable 5–10 Times" },
];

function Hero() {
  return (
    <section className="relative flex h-[422px] flex-col overflow-hidden text-white md:h-[550px]">
      {/* public/images/hero.jpg */}
      <Photo
        name="hero"
        priority
        position="center 35%"
        fallback={
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,#e9d6cf_0%,transparent_55%),radial-gradient(ellipse_at_25%_75%,#8f6a63_0%,transparent_60%),linear-gradient(115deg,#a88078,#6d5150_55%,#4b384c)]" />
            <div className="absolute inset-y-0 right-[4%] flex w-full items-center opacity-80 md:w-[52%]">
              <NailArt bare palette={["#e9d6cf", "#f1d3cb", "#a9c4e6", "#ffffff"]} pattern="french" shape="Almond" className="aspect-square w-full" />
            </div>
          </>
        }
      />
      <div className="absolute inset-0 bg-black/15" />
      <div className="container-x relative flex flex-1 items-end justify-center pb-[86px] text-center md:items-start md:justify-start md:pt-[245px] md:pb-0 md:text-left">
        <div className="animate-fadein w-full max-w-[400px]">
          <p className="eyebrow">Chill air. Fresh flair.</p>
          <h1 className="mt-1 font-display text-[34px] leading-[1.15] font-medium uppercase md:text-[46px]">Chill &amp; Thrill</h1>
          <p className="text-[17.6px] font-medium leading-[1.15]">Mix winter hues. Get free sets.</p>
          <Link href="/collections/new-arrivals" className="btn-light mx-auto mt-2 w-[298px] max-w-full md:mx-0 md:w-full">Get my free sets</Link>
        </div>
      </div>
      <TrustMarquee />
    </section>
  );
}

function TrustMarquee() {
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden}>
      {[...TRUST, ...TRUST].map((t, i) => (
        <li key={i} className="flex items-center gap-2 whitespace-nowrap pl-[40px] font-work text-[13.2px] tracking-[1.32px]">
          {t.icon}
          {t.text}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative h-10 overflow-hidden border-t border-white/20 bg-black/20 backdrop-blur-[2px]">
      <div className="animate-marquee flex h-full w-max items-center">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}

function Trending({ tiles }: { tiles: { handle: string; label: string; isNew?: boolean; c?: Collection }[] }) {
  return (
    <section className="pt-8 pb-2.5 md:pt-[55px]">
      <h2 className="text-center font-times text-[34px] leading-[1.15] font-medium md:text-[36px]">Oreo&apos;s Trending</h2>
      <div className="container-x mt-[7px]">
        <div className="no-scrollbar -mx-3 flex gap-2.5 overflow-x-auto px-3 md:mx-0 md:grid md:grid-cols-3 md:gap-x-2.5 md:gap-y-4 md:overflow-visible md:px-0 lg:grid-cols-6 lg:gap-4">
          {tiles.map(({ handle, label, isNew, c }) => (
            <Link key={handle} href={`/collections/${handle}`} className="group w-[104px] shrink-0 text-center md:w-auto">
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <Photo
                  name={`tile-${handle}`}
                  sizes="210px"
                  fallback={c ? <CollectionArt collection={c} className="h-full w-full transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full bg-card" />}
                />
                {isNew && (
                  <span className="absolute -right-[38px] bottom-[22px] w-[150px] -rotate-45 bg-sale py-1 text-center font-work text-[11px] font-semibold tracking-[0.25em] text-white md:-right-[34px] md:bottom-[30px] md:text-[17px]">
                    NEW
                  </span>
                )}
              </div>
              <p className="mt-2 text-[13px] font-bold md:mt-2.5 md:text-[17.28px]">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WideBanner() {
  return (
    <section className="container-x">
      <div className="relative flex h-[283px] items-center overflow-hidden rounded-2xl text-white md:h-[312px]">
        {/* public/images/banner-nail-haul.jpg */}
        <Photo
          name="banner-nail-haul"
          sizes="1320px"
          fallback={
            <>
              <div className="absolute inset-0 bg-[linear-gradient(100deg,#3a2a2c_0%,#6a4447_45%,#b5807a_100%)]" />
              <div className="absolute inset-y-0 right-0 w-[55%] opacity-90">
                <NailArt bare palette={["#b5807a", "#f2ddd6", "#8f1d2c", "#ffffff"]} pattern="french" shape="Almond" className="h-full w-full" />
              </div>
            </>
          }
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative w-full px-6 text-center md:px-[60px] md:text-left">
          <p className="eyebrow text-[11.5px] tracking-[1px]">Good taste. Great extras.</p>
          <h2 className="font-display text-[46px] leading-[1.1] font-medium md:text-[69px]">NAIL HAUL</h2>
          <p className="mt-2.5 text-[16.8px] font-medium">Mix your faves. Free sets await.</p>
          <Link href="/pages/build-bundle" className="btn-light mt-4">Build my bundle</Link>
        </div>
      </div>
    </section>
  );
}

function ToolsBlock({ tools }: { tools: Product[] }) {
  return (
    <section className="container-x grid gap-5 pt-5 pb-5 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:gap-5 md:pt-[35px] xl:grid-cols-[640px_1fr] xl:gap-10">
      <div className="relative flex min-h-[283px] items-center justify-center overflow-hidden rounded-2xl text-center text-white md:min-h-[480px] xl:min-h-[717px]">
        {/* public/images/banner-tools.jpg */}
        <Photo
          name="banner-tools"
          sizes="640px"
          fallback={
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#7b3b6b_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,#2c3b72_0%,transparent_55%),#1c1420]" />
              <NailArt bare palette={["#1c1420", "#f1d3cb", "#2b2b2b", "#ffffff"]} pattern="stars" shape="Coffin" className="absolute inset-0 h-full w-full opacity-70" />
            </>
          }
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative">
          <h2 className="font-times text-[36px] font-medium">Must Have Tools</h2>
          <p className="mt-5 text-[16.8px] font-medium">Essential for Perfect Nails</p>
          <Link href="/collections/tools-accessories" className="btn-white mt-5">Shop this collection</Link>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-x-2.5 gap-y-5 md:gap-x-3 md:gap-y-4 md:self-center xl:gap-x-5">
        {tools.map((p) => (
          <ProductCard key={p.handle} product={p} compact />
        ))}
      </div>
    </section>
  );
}

/** Press strip. Replace these placeholder wordmarks with logos of outlets that have actually featured you. */
function AsSeenIn() {
  const marks = [
    { t: "PRESS", c: "font-work font-extrabold tracking-tight text-[26px]" },
    { t: "Journal", c: "font-times italic text-[30px]" },
    { t: "DAILY", c: "font-times tracking-[0.25em] text-[26px]" },
    { t: "STYLE", c: "font-display font-semibold tracking-[0.12em] text-[26px]" },
    { t: "Beauty", c: "font-playfair-display italic text-[30px]" },
  ];
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center gap-[60px] pl-[60px]" aria-hidden={hidden}>
      {[...marks, ...marks].map((m, i) => (
        <span key={i} className={`whitespace-nowrap text-black ${m.c}`}>{m.t}</span>
      ))}
    </div>
  );
  return (
    <section className="pt-1">
      <h2 className="text-center font-display text-[36px] leading-[1.15] font-medium text-black md:text-[48px]">As Seen In</h2>
      <div className="mt-2.5 flex h-[72px] items-center overflow-hidden bg-[#ebebeb]">
        <div className="animate-marquee-slow flex w-max">
          {row()}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
