import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@/lib/data";
import { api } from "@/lib/api-server";
import { money } from "@/lib/pricing";
import ReviewsSection from "@/components/ReviewsSection";
import { InfoHero } from "@/components/info";
import { BoxIcon, PenIcon, RulerIcon, Stars } from "@/components/Icons";
import { ProductArt } from "@/components/Art";

export const metadata: Metadata = { title: "Reviews" };

/** "Happy Customers": centred hero, overlapping rating summary card, favourites grid, full review list. */
export default async function ReviewsPage() {
  const [reviews, favourites, all] = await Promise.all([
    api.reviews(),
    api.products({ collection: "best-sellers", limit: 8 }),
    api.products({ sort: "featured", limit: 200 }),
  ]);
  const { summary } = reviews;
  const max = Math.max(1, ...Object.values(summary.distribution));

  return (
    <>
      <InfoHero center width={1056} eyebrow="Real hands, real reviews" title="Happy Customers" intro={`Thousands of press-on lovers wear ${SITE.name}. Here's what they say about their sets.`} />
      <div className="flow-root bg-[#f6f1f5] pb-16">
        <div className="mx-auto -mt-[60px] max-w-[1056px] px-3 md:px-0">
          <div className="grid items-center gap-8 rounded-[20px] bg-white px-8 py-9 shadow-[0_8px_30px_rgba(75,56,76,0.10)] md:grid-cols-[230px_1fr_340px] md:gap-0 md:px-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-[38px] leading-none font-extrabold">{summary.average.toFixed(1)}</span>
                <Stars rating={summary.average} size={25} />
              </div>
              <p className="mt-3 text-[14.5px]">Based on {summary.count.toLocaleString()} reviews</p>
            </div>
            <div className="space-y-[11px] md:px-10">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = summary.distribution[n] ?? 0;
                return (
                  <div key={n} className="flex items-center gap-3 text-[13.5px]">
                    <span className="w-3">{n}</span>
                    <span className="text-[11px]">★</span>
                    <span className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#f1eaee]">
                      <span className="block h-full rounded-full bg-plum" style={{ width: `${(c / max) * 87}%` }} />
                    </span>
                    <span className="w-10 text-right text-muted">{c.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            <ul className="space-y-4 text-[14px] md:border-l md:border-line md:pl-7">
              {[
                [<BoxIcon key="b" width={14} height={14} />, "Reviews from verified customers"],
                [<PenIcon key="p" width={14} height={14} />, "Hand painted to order in our studio"],
                [<RulerIcon key="r" width={14} height={14} />, "Free size exchange within 30 days"],
              ].map(([icon, t]) => (
                <li key={t as string} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f3ebf2]">{icon}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 flex items-end justify-between">
            <h2 className="font-playfair-display text-[30px] font-normal">Customer favourites</h2>
            <Link href="/collections/best-sellers" className="text-[14.5px] font-bold underline">Shop all</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
            {favourites.map((p) => (
              <Link key={p.handle} href={`/products/${p.handle}`} className="group overflow-hidden rounded-xl bg-white text-center">
                <ProductArt product={p} shape={p.shape} variant={p.type === "bundle" ? "bundle" : p.type === "tool" ? "tool" : "set"} className="aspect-square w-full transition group-hover:scale-[1.02]" />
                <div className="px-3 pb-4">
                  <p className="text-[15px]">{p.title}</p>
                  <Stars rating={p.rating} size={15} />
                  <p className="mt-1 text-[15px]">
                    {money(p.price)} {p.compareAt && <s className="ml-1 text-[13px] text-muted">{money(p.compareAt)}</s>}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-[20px] bg-white p-6 md:p-10">
            <ReviewsSection title="All reviews" initial={reviews} productOptions={all.map(({ handle, title }) => ({ handle, title }))} art={Object.fromEntries(all.map((p) => [p.handle, { palette: p.palette, pattern: p.pattern }]))} />
          </div>
        </div>
      </div>
    </>
  );
}
