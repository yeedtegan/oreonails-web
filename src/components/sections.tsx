import Link from "next/link";
import type { Article } from "@/lib/data";
import Photo from "./Photo";
import { PenIcon, RepeatIcon, SwapIcon, UsersIcon } from "./Icons";
import { ArticleArt } from "@/components/Art";

/** 4-up trust icons row (pink circle icon, Playfair title, muted caption). */
export function FeatureIcons({ bordered }: { bordered?: boolean }) {
  const items = [
    { icon: <SwapIcon width={18} height={18} />, title: "Free size exchange", text: "Within 30 days, no hassle." },
    { icon: <RepeatIcon width={18} height={18} />, title: "Reusable", text: "Wear each set 5 to 10 times." },
    { icon: <PenIcon width={18} height={18} />, title: "Custom designs", text: "We'll paint a set made for your style." },
    { icon: <UsersIcon width={18} height={18} />, title: "18,000+ customers", text: "Loved and reordered across the US." },
  ];
  return (
    <section className={bordered ? "border-y border-[#e9e6e8]" : ""}>
      <div className="container-x grid grid-cols-2 gap-y-10 py-14 text-center md:grid-cols-4 md:py-[70px]">
        {items.map((f) => (
          <div key={f.title} className="flex flex-col items-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-pink-soft text-[#b5577c]">{f.icon}</span>
            <h3 className="mt-3 font-display text-[19px] font-medium">{f.title}</h3>
            <p className="mt-1 text-[12.5px] font-medium text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 3-up article cards with a tag pill over a 16:9 image and a Playfair title. */
export function ArticleCards({ articles, title, cta }: { articles: Article[]; title: string; cta?: boolean }) {
  return (
    <section className="container-x pt-12 pb-14 md:pt-[50px] md:pb-[58px]">
      <h2 className="text-center font-display text-[28px] font-medium md:text-[32px]">{title}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 md:mt-7 md:grid-cols-3 md:gap-5">
        {articles.map((a) => (
          <Link key={a.slug} href={`/blogs/nail-guide/${a.slug}`} className="group">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
              <Photo name={`blog-${a.slug}`} sizes="430px" fallback={<ArticleArt article={a} className="h-full w-full transition duration-500 group-hover:scale-105" />} />
              <span className="absolute left-[18px] top-[17px] rounded-full bg-plum/90 px-2.5 py-[5px] font-work text-[9.5px] font-semibold uppercase leading-none tracking-[1px] text-white">
                {a.title.split(":")[0].split("?")[0].slice(0, 26)}
              </span>
            </div>
            <h3 className="mt-3 font-display text-[18px] font-semibold leading-[1.3] md:text-[21.12px]">{a.title}</h3>
          </Link>
        ))}
      </div>
      {cta && (
        <div className="mt-8 text-center">
          <Link href="/blogs/nail-guide" className="btn-dark h-[51px] w-full px-5 sm:w-auto">Read the Nail Guide</Link>
        </div>
      )}
    </section>
  );
}
