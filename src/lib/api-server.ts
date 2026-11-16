// Data access for Server Components. Backed by the Oreo Nails API ("db", default) or the Shopify Storefront API —
// see ./backend.ts. Both return the same shapes.
import "server-only";
import type { ProductType } from "./data";
import { isDb } from "./backend";
import { dbCatalog } from "./db/catalog";
import { getArticle, getArticles, getCollection, getCollections, getFaqs, getProduct, getProducts, getReviews, getSite, type ProductSort } from "./shopify/storefront";

export interface ProductQuery {
  collection?: string;
  q?: string;
  type?: ProductType;
  handles?: string[];
  sort?: ProductSort;
  onSale?: boolean;
  limit?: number;
}

const shopify = {
  site: async () => getSite(),
  collections: () => getCollections(),
  collection: (handle: string) => getCollection(handle),
  products: (q: ProductQuery = {}) => getProducts(q),
  product: (handle: string) => getProduct(handle),
  reviews: (q: { product?: string; limit?: number } = {}) => getReviews(q),
  articles: (limit?: number) => getArticles(limit),
  article: (slug: string) => getArticle(slug),
  faqs: () => getFaqs(),
};

export const api: typeof shopify = isDb ? dbCatalog : shopify;
