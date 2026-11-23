import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import ShopView from "@/components/ShopView";
import { parseFilters, type ShopFilters } from "@/lib/shop";
import type { NavId } from "@/components/Header";
import { getProducts } from "@/lib/server/products";

export const metadata: Metadata = {
  title: "Shop — Oreo Nails",
  description: "Ready-to-wear press-on nail sets, toenails, bundles and tools from Oreo Nails.",
};

/** which menu entry the filters correspond to */
function navFor(f: ShopFilters): NavId {
  if (f.collection === "holiday") return "holiday";
  if (f.best) return "best";
  if (f.categories.length === 1 && f.categories[0] !== "press-on") return f.categories[0] as NavId;
  return "shop";
}

/** /shop?category=toenails&shape=almond&length=short&collection=holiday&best=1&sort=price-asc&q=star */
export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, products] = await Promise.all([searchParams, getProducts()]);
  const filters = parseFilters(params);
  return (
    <SiteShell active={navFor(filters)}>
      {/* the menu links change the query: start again from those filters */}
      <ShopView key={JSON.stringify(filters)} products={products} initial={filters} />
    </SiteShell>
  );
}
