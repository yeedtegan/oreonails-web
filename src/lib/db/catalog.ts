// Server Component data access for the "db" backend: reads from the Oreo Nails API (../server).
import "server-only";
import type { Article, Collection, Faq, Product, Review, ReviewSummary, SiteSettings } from "../data";
import type { ProductQuery } from "../api-server";

const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");

export class ApiNotFound extends Error {}

async function get<T>(path: string): Promise<T> {
  // Catalogue edits in /admin must show up immediately, so nothing is cached.
  const res = await fetch(`${API_URL}/api${path}`, { cache: "no-store" });
  if (res.status === 404) throw new ApiNotFound(path);
  if (!res.ok) throw new Error(`API ${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

const orNull = <T,>(p: Promise<T>) => p.catch((e) => (e instanceof ApiNotFound ? null : Promise.reject(e)));

const qs = (q: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== false && v !== "") p.set(k, v === true ? "1" : String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const dbCatalog = {
  site: () => get<SiteSettings>("/site"),
  collections: async () => (await get<{ collections: Collection[] }>("/collections")).collections,
  collection: (handle: string) => orNull(get<{ collection: Collection; total: number; products: Product[] }>(`/collections/${encodeURIComponent(handle)}`)),
  products: async (q: ProductQuery = {}) =>
    (
      await get<{ products: Product[] }>(
        `/products${qs({ collection: q.collection, q: q.q, type: q.type, handles: q.handles?.join(","), sort: q.sort, onSale: q.onSale, limit: q.limit })}`,
      )
    ).products,
  product: (handle: string) => orNull(get<{ product: Product; related: Product[] }>(`/products/${encodeURIComponent(handle)}`)),
  reviews: (q: { product?: string; rating?: number; limit?: number; offset?: number } = {}) =>
    get<{ summary: ReviewSummary; reviews: Review[] }>(`/reviews${qs(q)}`),
  articles: async (limit?: number) => (await get<{ articles: Article[] }>(`/articles${qs({ limit })}`)).articles,
  article: async (slug: string) => (await orNull(get<{ article: Article }>(`/articles/${encodeURIComponent(slug)}`)))?.article ?? null,
  faqs: async () => (await get<{ faqs: Faq[] }>("/faqs")).faqs,
};
