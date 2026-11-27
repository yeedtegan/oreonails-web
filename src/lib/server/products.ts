import { CATEGORIES, type Category, type Product } from "@/lib/shop";
import { accountApi } from "./account";

/** The store's product categories, in order; the built-in list when the store can't be reached. */
export async function getCategories(): Promise<Category[]> {
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
export async function getProducts(): Promise<Product[] | null> {
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
