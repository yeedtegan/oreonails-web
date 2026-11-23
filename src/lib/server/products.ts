import type { Product } from "@/lib/shop";
import { accountApi } from "./account";

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
