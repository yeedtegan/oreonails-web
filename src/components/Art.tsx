/* eslint-disable @next/next/no-img-element -- admin uploads are served by the API via /uploads, not optimised by next/image */
import type { Article, Collection, Product } from "@/lib/data";
import { pickScene } from "@/lib/scene";
import NailArt from "./NailArt";

type Variant = "hand" | "set" | "bundle" | "tool";

/** A worn-set photo from these products, for banners and tiles (see pickScene). */
export function sceneImage(products: (Product | undefined)[], used?: Set<string>): string | null {
  return pickScene(products.map((p) => p?.images), used);
}
const variantOf = (p: Product): Variant => (p.type === "bundle" ? "bundle" : p.type === "tool" ? "tool" : "set");

/** Product image: the uploaded photo at `index` when there is one, otherwise the generated nail-art illustration. */
export function ProductArt({
  product: p,
  index = 0,
  shape,
  variant,
  title,
  className = "",
}: {
  product: Product;
  index?: number;
  shape?: string;
  variant?: Variant;
  title?: string;
  className?: string;
}) {
  const src = p.images?.[index];
  if (src) return <img src={src} alt={title ?? p.title} loading="lazy" className={`object-cover ${className}`} />;
  return <NailArt palette={p.palette} pattern={p.pattern} shape={shape ?? p.shape} variant={variant ?? variantOf(p)} title={title ?? p.title} className={className} />;
}

export function CollectionArt({ collection: c, className = "" }: { collection: Collection; className?: string }) {
  const src = c.image ?? c.cover;
  if (src) return <img src={src} alt={c.title} loading="lazy" className={`object-cover ${className}`} />;
  return <NailArt palette={c.palette} pattern={c.pattern} className={className} />;
}

export function ArticleArt({ article: a, className = "" }: { article: Article; className?: string }) {
  if (a.image) return <img src={a.image} alt={a.title} loading="lazy" className={`object-cover ${className}`} />;
  return <NailArt palette={a.palette} pattern={a.pattern} className={className} />;
}
