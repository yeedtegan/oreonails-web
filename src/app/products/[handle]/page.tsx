import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@/lib/api-server";
import type { Pattern } from "@/lib/data";
import ProductPurchase from "@/components/ProductPurchase";
import ReviewsSection from "@/components/ReviewsSection";
import HowToApply from "@/components/HowToApply";
import { ProductRail } from "@/components/ProductCard";
import { FeatureIcons } from "@/components/sections";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const data = await api.product((await params).handle);
  return { title: data?.product.title ?? "Product", description: data?.product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [data, collections, reviews] = await Promise.all([api.product(handle), api.collections(), api.reviews({ product: handle })]);
  if (!data) notFound();
  const { product: p, related } = data;
  // Breadcrumb: the first (by menu order) non-catch-all collection the product belongs to.
  const mainCol = collections.find((c) => c.handle !== "shop-all" && p.collections.includes(c.handle));

  return (
    <>
      <div className="container-x pt-0 pb-12 md:pb-14">
        <ProductPurchase product={p} collection={mainCol} reviewCount={reviews.summary.count} />
      </div>
      {related.length > 0 && (
        <section className="container-x pb-14">
          <h2 className="mb-6 text-center font-times text-[30px] font-medium md:text-[36px]">You May Also Like</h2>
          <ProductRail products={related} />
        </section>
      )}
      {p.type === "set" && (
        <div className="pb-16">
          <HowToApply />
        </div>
      )}
      <section id="reviews" className="mx-auto max-w-[1200px] scroll-mt-28 px-3 pb-16 md:px-8 xl:px-0">
        <ReviewsSection productHandle={p.handle} initial={reviews} art={{ [p.handle]: { palette: p.palette, pattern: p.pattern as Pattern } }} />
      </section>
      <FeatureIcons bordered />
    </>
  );
}
