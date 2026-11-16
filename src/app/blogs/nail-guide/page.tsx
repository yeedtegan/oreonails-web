import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api-server";
import Photo from "@/components/Photo";
import { ArticleArt } from "@/components/Art";

export const metadata: Metadata = { title: "Nail Guide" };

/** Blog index: centred title, "Filter by tags" outline chips, 3-up cards with tag pill. */
export default async function BlogIndex({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const articles = await api.articles();
  const tags = [...new Set(articles.flatMap((a) => a.tags ?? []))].sort();
  const shown = tag ? articles.filter((a) => a.tags?.includes(tag)) : articles;

  return (
    <div className="container-x pt-14 pb-16 md:pt-[66px]">
      <h1 className="text-center font-display text-[34px] font-medium md:text-[36px]">Nail Guide</h1>
      <p className="mt-6 text-center font-work text-[11px] uppercase tracking-[1.6px]">Filter by tags</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {tags.map((t) => (
          <Link
            key={t}
            href={t === tag ? "/blogs/nail-guide" : `/blogs/nail-guide?tag=${encodeURIComponent(t)}`}
            className={`flex h-[37px] items-center rounded-full border px-4 font-work text-[13px] uppercase tracking-[1.3px] transition ${t === tag ? "border-plum bg-plum text-white" : "border-plum hover:bg-plum/5"}`}
          >
            {t}
          </Link>
        ))}
      </div>
      <div className="mt-11 grid gap-x-5 gap-y-6 md:grid-cols-3">
        {shown.map((a) => (
          <Link key={a.slug} href={`/blogs/nail-guide/${a.slug}`} className="group">
            <div className="relative aspect-[427/240] overflow-hidden rounded-2xl">
              <Photo name={`blog-${a.slug}`} sizes="430px" fallback={<ArticleArt article={a} className="h-full w-full transition duration-500 group-hover:scale-105" />} />
              <span className="absolute left-[18px] top-[17px] rounded-full bg-plum/90 px-2.5 py-[5px] font-work text-[9.5px] font-semibold uppercase leading-none tracking-[1px] text-white">
                {a.title.split(":")[0].split("?")[0].slice(0, 26)}
              </span>
            </div>
            <h2 className="mt-4 font-display text-[18px] font-semibold leading-[1.3] md:text-[19px]">{a.title}</h2>
          </Link>
        ))}
      </div>
      {shown.length === 0 && <p className="py-16 text-center text-muted">No articles with this tag yet.</p>}
    </div>
  );
}
