import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE } from "@/lib/data";
import { api } from "@/lib/api-server";
import Photo from "@/components/Photo";
import { ProductRail } from "@/components/ProductCard";
import { ArticleArt } from "@/components/Art";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await api.article((await params).slug);
  return { title: a?.title, description: a?.excerpt };
}

/** Article: centred Playfair title, byline, 720px rounded hero image with tag pill, 720px body. */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [a, shopTheLook] = await Promise.all([api.article(slug), api.products({ collection: "best-sellers", limit: 8 })]);
  if (!a) notFound();
  return (
    <>
      <article className="mx-auto max-w-[720px] px-4 pt-14 pb-12 md:px-0 md:pt-[66px]">
        <h1 className="text-center font-display text-[30px] leading-[1.2] font-medium md:text-[36px]">{a.title}</h1>
        <p className="mt-5 text-center text-[13px]">
          By The {SITE.name} Studio <span className="mx-1.5">•</span> {new Date(a.date).toLocaleDateString("en-US", { dateStyle: "long" })}
        </p>
        <div className="relative mt-[60px] aspect-[720/405] overflow-hidden rounded-2xl">
          <Photo name={`blog-${a.slug}`} sizes="720px" priority fallback={<ArticleArt article={a} className="h-full w-full" />} />
          <span className="absolute left-7 top-7 rounded-full bg-plum/90 px-3.5 py-[7px] font-work text-[14px] font-semibold uppercase leading-none tracking-[1.6px] text-white">
            {a.title.split(":")[0].split("?")[0].slice(0, 26)}
          </span>
        </div>
        <div className="mt-9 space-y-5 text-[16.5px] leading-[1.6] text-plum">
          {a.body?.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </article>
      <section className="container-x border-t border-line pt-12 pb-14">
        <h2 className="mb-6 text-center font-display text-[28px] font-medium">Shop the look</h2>
        <ProductRail products={shopTheLook} />
      </section>
    </>
  );
}
