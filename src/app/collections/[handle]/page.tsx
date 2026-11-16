import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@/lib/api-server";
import CollectionView from "@/components/CollectionView";
import NailArt from "@/components/NailArt";
import Photo from "@/components/Photo";
import { ArticleCards, FeatureIcons } from "@/components/sections";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const data = await api.collection((await params).handle);
  return { title: data?.collection.title ?? "Collection", description: data?.collection.description };
}

/** Collection page: full-bleed hero under the header, rounded white sheet with filters + grid. */
export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [data, articles] = await Promise.all([api.collection(handle), api.articles(3)]);
  if (!data) notFound();
  const { collection: c, products } = data;

  return (
    <>
      <section className="relative flex h-[350px] items-end overflow-hidden text-white md:h-[500px] xl:h-[450px]">
        {/* public/images/collection-<handle>.jpg */}
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
        <Photo
          name={`collection-${handle}`}
          priority
          fallback={
            <>
              <div className="absolute inset-0" style={{ background: `linear-gradient(110deg, ${c.palette[1]} 0%, ${c.palette[0]} 120%)` }} />
              <div className="absolute inset-y-0 right-[3%] w-full opacity-70 md:w-[48%]">
                <NailArt bare palette={c.palette} pattern={c.pattern} className="h-full w-full" />
              </div>
            </>
          }
        />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
        <div className="relative w-full px-4 pb-[78px] md:px-10 md:pb-[78px]">
          <p className="eyebrow">{c.description.replace(/\.$/, "")}</p>
          <h1 className="mt-2 font-display text-[34px] leading-[1.1] font-medium uppercase md:text-[46px]">{c.title}</h1>
          <p className="mt-2 text-[16px] font-medium uppercase md:text-[17px]">Buy 2 get 1 free · Don&apos;t miss out</p>
        </div>
      </section>

      <div className="relative -mt-12 rounded-t-[48px] bg-white pt-10">
        <div className="mx-auto max-w-[1185px] px-3 md:px-5 xl:px-0">
          <CollectionView products={products} />
          <div className="mt-12 border-t border-line px-0 pt-12 pb-16 text-[16.5px] leading-[1.65] md:px-5">
            <p>
              {c.title} press-on nails are hand-painted in our studio, one set at a time. {c.description} Every design is
              painted rather than printed, so the artwork keeps its depth in photos and up close.
            </p>
          </div>
        </div>
      </div>

      <FeatureIcons bordered />
      <ArticleCards articles={articles} title="Nail Guide: tips & ideas" />
    </>
  );
}
