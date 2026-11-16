import { NextResponse } from "next/server";
import { getProducts, type ProductSort } from "@/lib/shopify/storefront";
import type { ProductType } from "@/lib/data";
import { fail, num } from "../_lib";

const SORTS: ProductSort[] = ["featured", "newest", "price-asc", "price-desc", "rating"];
const TYPES: ProductType[] = ["set", "bundle", "tool"];

/** GET /api/products?collection=&q=&type=&handles=a,b&sort=&onSale=1&limit= — browser-side catalogue reads (search, favorites, recommendations). */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const sort = p.get("sort") as ProductSort | null;
  const type = p.get("type") as ProductType | null;
  try {
    const products = await getProducts({
      collection: p.get("collection") || undefined,
      q: p.get("q") || undefined,
      type: type && TYPES.includes(type) ? type : undefined,
      handles: p.get("handles")?.split(",").filter(Boolean),
      sort: sort && SORTS.includes(sort) ? sort : undefined,
      onSale: p.get("onSale") === "1",
      limit: Math.min(num(p.get("limit")) ?? 50, 250),
    });
    return NextResponse.json({ total: products.length, products });
  } catch (e) {
    return fail(502, (e as Error).message);
  }
}
