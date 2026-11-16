import type { Metadata } from "next";
import { api } from "@/lib/api-server";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [collections, recommendations] = await Promise.all([
    api.collections().catch(() => []),
    api.products({ collection: "new-arrivals", type: "set", sort: "newest", limit: 12 }).catch(() => []),
  ]);
  return <CartView collections={collections} recommendations={recommendations} />;
}
