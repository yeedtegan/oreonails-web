import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import SiteShell from "@/components/SiteShell";
import ProductView from "@/components/ProductView";
import { getProducts } from "@/lib/server/products";
import type { Product } from "@/lib/shop";

type Props = { params: Promise<{ id: string }> };

/** one store call per request, shared by the metadata and the page */
const loadProducts = cache(getProducts);

async function load(params: Props["params"]) {
  const [{ id }, products] = await Promise.all([params, loadProducts()]);
  return { products, product: products?.find((p) => p.id === decodeURIComponent(id)) ?? null };
}

/** "You may also like": other sets of the same kind, those sharing a shape first */
function related(product: Product, all: Product[]) {
  const shared = (p: Product) => p.shapes.some((s) => product.shapes.includes(s));
  return all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => Number(shared(b)) - Number(shared(a)) || a.position - b.position)
    .slice(0, 4);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await load(params);
  return product
    ? { title: `${product.name} — Oreo Nails`, description: `${product.name}: hand-painted press-on nails from Oreo Nails.` }
    : { title: "Shop — Oreo Nails" };
}

/** /shop/<product id> — one set: photo, options, add to cart, details, related sets */
export default async function ProductPage({ params }: Props) {
  const { product, products } = await load(params);
  if (!product) notFound();
  return (
    <SiteShell active="shop">
      <ProductView key={product.id} product={product} related={related(product, products ?? [])} />
    </SiteShell>
  );
}
