/** Shop (ready-made sets) — products live on oreonails-api (GET /products), imported with `npm run products`. */

export type ProductCategory = "press-on" | "toenails" | "bundles" | "tools";

export type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  category: ProductCategory;
  shapes: string[];
  lengths: string[];
  collections: string[];
  bestSeller: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: "press-on", label: "Press On Nails" },
  { id: "toenails", label: "Toenails" },
  { id: "bundles", label: "Bundles" },
  { id: "tools", label: "Tools" },
];
export const SHAPES = ["almond", "coffin", "square", "oval", "stiletto"] as const;
export const LENGTHS = ["short", "medium", "long"] as const;
export const SIZES = ["XS", "S", "M", "L"] as const;

export type SortId = "featured" | "best" | "newest" | "price-asc" | "price-desc" | "name";
export const SORTS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "best", label: "Best Sellers" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to high" },
  { id: "price-desc", label: "Price: High to low" },
  { id: "name", label: "Name: A–Z" },
];

/** collections with their own menu entry / page title */
export const COLLECTIONS: Record<string, string> = { holiday: "Holiday Glam" };

export const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Image URL through this site (cached; ?v changes when the product is updated). */
export const productImage = (p: Pick<Product, "id" | "updatedAt">) =>
  `/api/products/${encodeURIComponent(p.id)}/image?v=${encodeURIComponent(p.updatedAt)}`;

/** tools have no size / length */
export const hasSize = (category: ProductCategory | undefined) => category !== "tools";

export type ShopFilters = {
  categories: ProductCategory[];
  shapes: string[];
  lengths: string[];
  collection: string | null;
  best: boolean;
  sort: SortId;
  q: string;
};

type Params = Record<string, string | string[] | undefined>;
const many = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(",")).map((s) => s.trim().toLowerCase()).filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

/** URL query → filters (unknown values dropped) */
export function parseFilters(p: Params): ShopFilters {
  const sort = one(p.sort) as SortId;
  return {
    categories: many(p.category).filter((c): c is ProductCategory => CATEGORIES.some((x) => x.id === c)),
    shapes: many(p.shape).filter((s) => (SHAPES as readonly string[]).includes(s)),
    lengths: many(p.length).filter((s) => (LENGTHS as readonly string[]).includes(s)),
    collection: one(p.collection).toLowerCase() || null,
    best: one(p.best) === "1",
    sort: SORTS.some((s) => s.id === sort) ? sort : "featured",
    q: one(p.q).slice(0, 80),
  };
}

/** filters → URL query (empty values left out) */
export function filtersQuery(f: ShopFilters): string {
  const q = new URLSearchParams();
  if (f.categories.length) q.set("category", f.categories.join(","));
  if (f.shapes.length) q.set("shape", f.shapes.join(","));
  if (f.lengths.length) q.set("length", f.lengths.join(","));
  if (f.collection) q.set("collection", f.collection);
  if (f.best) q.set("best", "1");
  if (f.sort !== "featured") q.set("sort", f.sort);
  if (f.q) q.set("q", f.q);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function filterProducts(products: Product[], f: ShopFilters): Product[] {
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = products.filter(
    (p) =>
      (!f.categories.length || f.categories.includes(p.category)) &&
      (!f.shapes.length || p.shapes.some((s) => f.shapes.includes(s))) &&
      (!f.lengths.length || p.lengths.some((l) => f.lengths.includes(l))) &&
      (!f.collection || p.collections.includes(f.collection)) &&
      (!f.best || p.bestSeller) &&
      words.every((w) => p.name.toLowerCase().includes(w)),
  );
  const by: Record<SortId, (a: Product, b: Product) => number> = {
    featured: (a, b) => a.position - b.position,
    best: (a, b) => Number(b.bestSeller) - Number(a.bestSeller) || a.position - b.position,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  return list.sort(by[f.sort]);
}
