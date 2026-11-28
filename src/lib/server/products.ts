import { CATEGORIES, type Category, type Product } from "@/lib/shop";
import { accountApi } from "./account";

/**
 * Short in-memory cache (per Worker isolate): moving between Shop menu pages (Shop → Toenails → Best Sellers…) reuses
 * the list instead of a round trip to oreonails-api each time. Changes made in /admin show within CACHE_MS.
 * Failures are not cached.
 */
const CACHE_MS = 20_000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();
function cached<T>(key: string, load: () => Promise<T>, ok: (v: T) => boolean): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  value.then((v) => !ok(v) && cache.delete(key)).catch(() => cache.delete(key));
  return value;
}

/** The store's product categories, in order; the built-in list when the store can't be reached. */
export function getCategories(): Promise<Category[]> {
  return cached("categories", loadCategories, (c) => c !== CATEGORIES);
}

async function loadCategories(): Promise<Category[]> {
  try {
    const res = await accountApi("/categories");
    if (!res.ok) throw new Error(`GET /categories → ${res.status}`);
    const { categories } = (await res.json()) as { categories?: Category[] };
    return categories?.length ? categories.map(({ id, label }) => ({ id, label })) : CATEGORIES;
  } catch (err) {
    console.error("[shop] categories unavailable, using the built-in list:", err);
    return CATEGORIES;
  }
}

/** Products for the Shop page; null = the store is unreachable. */
export function getProducts(): Promise<Product[] | null> {
  return cached("products", loadProducts, (p) => p !== null);
}

async function loadProducts(): Promise<Product[] | null> {
  try {
    const res = await accountApi("/products");
    if (!res.ok) {
      console.error(`[shop] GET /products → ${res.status}`);
      return null;
    }
    return ((await res.json()) as { products: Product[] }).products;
  } catch (err) {
    console.error("[shop] oreonails-api unreachable:", err);
    return null;
  }
}
