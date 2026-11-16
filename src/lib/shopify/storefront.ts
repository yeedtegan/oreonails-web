// Shopify Storefront API: catalogue reads + cart. Works in Server Components, route handlers and the browser
// (the Storefront token is public). Shopify data is mapped onto the app's existing types in ../data.ts so the
// UI doesn't need to know where it came from.

import { BLOG_HANDLE, NS, STOREFRONT_URL, SHOPIFY_STOREFRONT_TOKEN } from "./config";
import { PROMO_TIERS, SHAPES, SITE, SIZES, type Article, type Collection, type Faq, type Pattern, type Product, type ProductType, type Review, type ReviewSummary, type SiteSettings } from "../data";
import { freeSetsFor, type CartLine, type Quote } from "../pricing";

export class ShopifyError extends Error {}

const isServer = typeof window === "undefined";

export async function storefront<T>(query: string, variables: Record<string, unknown> = {}, opts: { fresh?: boolean } = {}): Promise<T> {
  if (!STOREFRONT_URL) throw new ShopifyError("Shopify is not configured: set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN.");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SHOPIFY_STOREFRONT_TOKEN) headers["X-Shopify-Storefront-Access-Token"] = SHOPIFY_STOREFRONT_TOKEN;

  const init: RequestInit & { next?: { revalidate: number; tags: string[] } } = { method: "POST", headers, body: JSON.stringify({ query, variables }) };
  // Catalogue reads on the server are cached briefly; carts and browser calls always go to Shopify.
  if (isServer) {
    if (opts.fresh) init.cache = "no-store";
    else init.next = { revalidate: 60, tags: ["shopify"] };
  }

  let res: Response;
  try {
    res = await fetch(STOREFRONT_URL, init);
  } catch {
    throw new ShopifyError("Can't reach the store. Please try again.");
  }
  const json = (await res.json().catch(() => null)) as { data?: T; errors?: { message: string }[] } | null;
  if (!res.ok || !json || json.errors?.length || !json.data) {
    throw new ShopifyError(json?.errors?.map((e) => e.message).join("; ") || `Shopify request failed (${res.status})`);
  }
  return json.data;
}

/* ------------------------------------------------------------------ fragments */

const PRODUCT_MF = ["palette", "pattern", "shape", "sets_included", "rating", "review_count"];
const COLLECTION_MF = ["group", "palette", "pattern", "position"];
const ARTICLE_MF = ["palette", "pattern"];
const mfIds = (keys: string[]) => `[${keys.map((k) => `{namespace: "${NS}", key: "${k}"}`).join(", ")}]`;

const PRODUCT_FIELDS = `
  id handle title productType description publishedAt
  priceRange { minVariantPrice { amount } }
  compareAtPriceRange { maxVariantPrice { amount } }
  images(first: 10) { nodes { url } }
  collections(first: 25) { nodes { handle } }
  metafields(identifiers: ${mfIds(PRODUCT_MF)}) { key value }
`;

const VARIANT_FIELDS = `variants(first: 100) { nodes { id availableForSale selectedOptions { name value } } }`;

const COLLECTION_FIELDS = `
  handle title description
  image { url }
  metafields(identifiers: ${mfIds(COLLECTION_MF)}) { key value }
`;

const ARTICLE_FIELDS = `
  handle title excerpt publishedAt tags
  image { url }
  metafields(identifiers: ${mfIds(ARTICLE_MF)}) { key value }
`;

/* ------------------------------------------------------------------ mappers */

type Metafield = { key: string; value: string } | null;
type Money = { amount: string };

interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  productType: string;
  description: string;
  publishedAt: string;
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange: { maxVariantPrice: Money };
  images: { nodes: { url: string }[] };
  collections: { nodes: { handle: string }[] };
  metafields: Metafield[];
  variants?: { nodes: ShopifyVariant[] };
}

interface ShopifyVariant {
  id: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
}

const mf = (list: Metafield[] | undefined, key: string) => list?.find((m) => m?.key === key)?.value ?? undefined;
const num = (v: string | undefined) => (v === undefined || v === "" || isNaN(Number(v)) ? undefined : Number(v));

const FALLBACK_PALETTES: [string, string, string, string][] = [
  ["#f7e6e2", "#c0495f", "#f5d2d8", "#ffffff"],
  ["#e6eef7", "#5b7db1", "#c9d9ef", "#ffffff"],
  ["#f2e4d4", "#9c4a1a", "#d99a4e", "#f6e7c8"],
  ["#e9f3ef", "#4aa58a", "#bfe3d6", "#ffffff"],
  ["#1d1b33", "#2e2a55", "#e7c76a", "#ffffff"],
];
const PATTERNS: Pattern[] = ["solid", "french", "dots", "stripes", "stars", "plaid", "ombre", "hearts", "flowers", "leopard", "chrome", "lights"];

function palette(value: string | undefined, seed: string): [string, string, string, string] {
  try {
    const p = JSON.parse(value ?? "");
    if (Array.isArray(p) && p.length === 4 && p.every((c) => typeof c === "string")) return p as [string, string, string, string];
  } catch {}
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_PALETTES[h % FALLBACK_PALETTES.length];
}
const pattern = (v: string | undefined): Pattern => (PATTERNS.includes(v as Pattern) ? (v as Pattern) : "solid");

const option = (v: ShopifyVariant, name: string) => v.selectedOptions.find((o) => o.name.toLowerCase() === name.toLowerCase())?.value;

export function toProduct(p: ShopifyProduct): Product {
  const price = Number(p.priceRange.minVariantPrice.amount);
  const compareAt = Number(p.compareAtPriceRange.maxVariantPrice.amount);
  const pt = p.productType.toLowerCase();
  const variants = p.variants?.nodes;
  const hasShape = variants?.some((v) => option(v, "Shape"));
  const type: ProductType = pt === "set" || pt === "bundle" || pt === "tool" ? pt : hasShape ? "set" : "tool";
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    type,
    price,
    compareAt: compareAt > price ? compareAt : undefined,
    collections: p.collections.nodes.map((c) => c.handle),
    palette: palette(mf(p.metafields, "palette"), p.handle),
    pattern: pattern(mf(p.metafields, "pattern")),
    shape: mf(p.metafields, "shape") || "Almond",
    rating: num(mf(p.metafields, "rating")) ?? 0,
    reviewCount: num(mf(p.metafields, "review_count")) ?? 0,
    description: p.description,
    setsIncluded: num(mf(p.metafields, "sets_included")),
    rank: 0,
    added: Date.parse(p.publishedAt) || 0,
    images: p.images.nodes.length ? p.images.nodes.map((i) => i.url) : undefined,
    variants: variants?.map((v) => ({ id: v.id, available: v.availableForSale, size: option(v, "Size"), shape: option(v, "Shape") })),
  };
}

interface ShopifyCollection {
  handle: string;
  title: string;
  description: string;
  image: { url: string } | null;
  metafields: Metafield[];
}

const GROUPS = ["shop", "collection", "season", "other"] as const;

function toCollection(c: ShopifyCollection): Collection & { position: number } {
  const group = mf(c.metafields, "group") as Collection["group"] | undefined;
  return {
    handle: c.handle,
    title: c.title,
    description: c.description,
    group: group && GROUPS.includes(group) ? group : "collection",
    palette: palette(mf(c.metafields, "palette"), c.handle),
    pattern: pattern(mf(c.metafields, "pattern")),
    image: c.image?.url ?? null,
    position: num(mf(c.metafields, "position")) ?? 9999,
  };
}

interface ShopifyArticle {
  handle: string;
  title: string;
  excerpt: string | null;
  publishedAt: string;
  tags: string[];
  image: { url: string } | null;
  metafields: Metafield[];
  contentHtml?: string;
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .trim();

/** Article bodies are stored as HTML in Shopify; the page renders plain paragraphs. */
const paragraphs = (html: string) =>
  html
    .split(/<\/(?:p|h[1-6]|li)>|<br\s*\/?>/i)
    .map(decode)
    .filter(Boolean);

function toArticle(a: ShopifyArticle): Article {
  return {
    slug: a.handle,
    title: a.title,
    tags: a.tags,
    excerpt: a.excerpt ?? "",
    date: a.publishedAt,
    palette: palette(mf(a.metafields, "palette"), a.handle),
    pattern: pattern(mf(a.metafields, "pattern")),
    image: a.image?.url ?? null,
    body: a.contentHtml ? paragraphs(a.contentHtml) : undefined,
  };
}

/* ------------------------------------------------------------------ catalogue */

export function getSite(): SiteSettings {
  return { promoTiers: PROMO_TIERS, freeShippingThreshold: SITE.freeShippingThreshold, shippingFee: SITE.shippingFee, sizes: [...SIZES], shapes: [...SHAPES] };
}

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export interface ProductQuery {
  collection?: string;
  q?: string;
  type?: ProductType;
  handles?: string[];
  sort?: ProductSort;
  onSale?: boolean;
  limit?: number;
  /** Include variants (needed to add to cart / pick options). */
  variants?: boolean;
}

const sortKeys = (sort: ProductSort | undefined, inCollection: boolean) => {
  switch (sort) {
    case "newest":
      return { sortKey: inCollection ? "CREATED" : "CREATED_AT", reverse: true };
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    default:
      return { sortKey: inCollection ? "COLLECTION_DEFAULT" : "BEST_SELLING", reverse: false };
  }
};

const searchTerm = (q: string) => q.replace(/["\\]/g, " ").trim();

function finish(products: Product[], q: ProductQuery) {
  let list = products;
  if (q.onSale) list = list.filter((p) => p.compareAt);
  if (q.sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  return list.slice(0, q.limit ?? 250);
}

async function productsByHandle(handles: string[], withVariants: boolean): Promise<Product[]> {
  const unique = [...new Set(handles)].slice(0, 250);
  const found = new Map<string, Product>();
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const fields = `${PRODUCT_FIELDS} ${withVariants ? VARIANT_FIELDS : ""}`;
    const query = `query(${chunk.map((_, j) => `$h${j}: String!`).join(", ")}) { ${chunk.map((_, j) => `p${j}: product(handle: $h${j}) { ${fields} }`).join("\n")} }`;
    const data = await storefront<Record<string, ShopifyProduct | null>>(query, Object.fromEntries(chunk.map((h, j) => [`h${j}`, h])));
    chunk.forEach((h, j) => {
      const p = data[`p${j}`];
      if (p) found.set(h, toProduct(p));
    });
  }
  return handles.map((h) => found.get(h)).filter((p): p is Product => !!p);
}

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const withVariants = !!q.variants;
  if (q.handles) return finish(await productsByHandle(q.handles, withVariants), q);

  const first = Math.min(250, q.onSale || q.sort === "rating" ? 250 : q.limit ?? 50);
  const fields = `${PRODUCT_FIELDS} ${withVariants ? VARIANT_FIELDS : ""}`;

  if (q.collection) {
    const { sortKey, reverse } = sortKeys(q.sort, true);
    const filters = [
      ...(q.type ? [{ productType: q.type }] : []),
    ];
    const data = await storefront<{ collection: { products: { nodes: ShopifyProduct[] } } | null }>(
      `query($handle: String!, $first: Int!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!]) {
        collection(handle: $handle) { products(first: $first, sortKey: $sortKey, reverse: $reverse, filters: $filters) { nodes { ${fields} } } }
      }`,
      { handle: q.collection, first, sortKey, reverse, filters },
    );
    let list = (data.collection?.products.nodes ?? []).map(toProduct);
    if (q.q) {
      const term = q.q.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(term));
    }
    return finish(list, q);
  }

  const { sortKey, reverse } = sortKeys(q.sort, false);
  const parts = [q.q ? searchTerm(q.q) : "", q.type ? `product_type:${q.type}` : ""].filter(Boolean);
  const data = await storefront<{ products: { nodes: ShopifyProduct[] } }>(
    `query($first: Int!, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
      products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${fields} } }
    }`,
    { first, query: parts.join(" ") || null, sortKey: q.q && !q.sort ? "RELEVANCE" : sortKey, reverse },
  );
  return finish(data.products.nodes.map(toProduct), q);
}

export async function getProduct(handle: string): Promise<{ product: Product; related: Product[] } | null> {
  const data = await storefront<{ product: ShopifyProduct | null; productRecommendations: ShopifyProduct[] | null }>(
    `query($handle: String!) {
      product(handle: $handle) { ${PRODUCT_FIELDS} ${VARIANT_FIELDS} }
      productRecommendations(productHandle: $handle) { ${PRODUCT_FIELDS} }
    }`,
    { handle },
  );
  if (!data.product) return null;
  const product = toProduct(data.product);
  let related = (data.productRecommendations ?? []).map(toProduct).filter((p) => p.handle !== handle);
  if (related.length < 4) {
    const more = await getProducts({ type: product.type, limit: 12 });
    related = [...related, ...more.filter((p) => p.handle !== handle && !related.some((r) => r.handle === p.handle))];
  }
  return { product, related: related.slice(0, 12) };
}

function withoutPosition(c: Collection & { position?: number }): Collection {
  const out = { ...c };
  delete out.position;
  return out;
}

export async function getCollections(): Promise<Collection[]> {
  const data = await storefront<{ collections: { nodes: ShopifyCollection[] } }>(`{ collections(first: 100) { nodes { ${COLLECTION_FIELDS} } } }`);
  return data.collections.nodes
    .map(toCollection)
    .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
    .map(withoutPosition);
}

export async function getCollection(handle: string, q: Omit<ProductQuery, "collection" | "handles"> = {}) {
  const data = await storefront<{ collection: ShopifyCollection | null }>(`query($handle: String!) { collection(handle: $handle) { ${COLLECTION_FIELDS} } }`, { handle });
  if (!data.collection) return null;
  const sort = q.sort ?? (handle === "new-arrivals" ? "newest" : "featured");
  const products = await getProducts({ ...q, sort, collection: handle, limit: q.limit ?? 250 });
  return { collection: withoutPosition(toCollection(data.collection)), total: products.length, products };
}

export async function getArticles(limit = 50): Promise<Article[]> {
  const data = await storefront<{ blog: { articles: { nodes: ShopifyArticle[] } } | null }>(
    `query($first: Int!, $blog: String!) { blog(handle: $blog) { articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) { nodes { ${ARTICLE_FIELDS} } } } }`,
    { first: Math.min(limit, 250), blog: BLOG_HANDLE },
  );
  return (data.blog?.articles.nodes ?? []).map(toArticle);
}

export async function getArticle(slug: string): Promise<Article | null> {
  const data = await storefront<{ blog: { articleByHandle: ShopifyArticle | null } | null }>(
    `query($handle: String!, $blog: String!) { blog(handle: $blog) { articleByHandle(handle: $handle) { ${ARTICLE_FIELDS} contentHtml } } }`,
    { handle: slug, blog: BLOG_HANDLE },
  );
  const a = data.blog?.articleByHandle;
  return a ? toArticle(a) : null;
}

/* ---- metaobjects (FAQs, reviews) ---- */

interface Metaobject {
  handle: string;
  updatedAt: string;
  fields: { key: string; value: string | null }[];
}

async function metaobjects(type: string, max = 1000): Promise<Record<string, string | null>[]> {
  const out: Record<string, string | null>[] = [];
  let after: string | null = null;
  while (out.length < max) {
    const data: { metaobjects: { nodes: Metaobject[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } = await storefront(
      `query($type: String!, $after: String) {
        metaobjects(type: $type, first: 250, after: $after) { nodes { handle updatedAt fields { key value } } pageInfo { hasNextPage endCursor } }
      }`,
      { type, after },
    );
    for (const n of data.metaobjects.nodes) out.push({ _handle: n.handle, _updatedAt: n.updatedAt, ...Object.fromEntries(n.fields.map((f) => [f.key, f.value])) });
    if (!data.metaobjects.pageInfo.hasNextPage) break;
    after = data.metaobjects.pageInfo.endCursor;
  }
  return out;
}

export async function getFaqs(): Promise<Faq[]> {
  const rows = await metaobjects("faq", 500);
  return rows
    .sort((a, b) => (num(a.position ?? undefined) ?? 9999) - (num(b.position ?? undefined) ?? 9999))
    .filter((r) => r.question && r.answer)
    .map((r) => ({ q: r.question!, a: r.answer!, category: r.category ?? undefined }));
}

export async function getReviews(q: { product?: string; rating?: number; limit?: number; offset?: number } = {}): Promise<{ summary: ReviewSummary; reviews: Review[] }> {
  const all = (await metaobjects("review", 5000))
    .map(
      (r): Review => ({
        id: r._handle!,
        name: r.name ?? "Customer",
        rating: Math.min(5, Math.max(1, num(r.rating ?? undefined) ?? 5)),
        title: r.title ?? "",
        body: r.body ?? "",
        product: r.product_handle ?? undefined,
        productTitle: r.product_title ?? undefined,
        variant: r.variant ?? undefined,
        date: r.date ?? r._updatedAt ?? new Date().toISOString(),
      }),
    )
    .filter((r) => !q.product || r.product === q.product)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  const count = all.length;
  const average = count ? Math.round((all.reduce((s, r) => s + r.rating, 0) / count) * 100) / 100 : 0;
  const distribution = Object.fromEntries([5, 4, 3, 2, 1].map((n) => [n, all.filter((r) => r.rating === n).length]));
  const list = q.rating ? all.filter((r) => r.rating === q.rating) : all;
  const offset = q.offset ?? 0;
  return { summary: { count, average, distribution }, reviews: list.slice(offset, offset + Math.min(q.limit ?? 50, 100)) };
}

/* ------------------------------------------------------------------ cart */

const CART_LINE_PRODUCT = `${PRODUCT_FIELDS}`;

const DISCOUNT_ALLOC = `
  __typename
  discountedAmount { amount }
  ... on CartCodeDiscountAllocation { code }
  ... on CartAutomaticDiscountAllocation { title }
`;

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  discountCodes { code applicable }
  discountAllocations { ${DISCOUNT_ALLOC} }
  lines(first: 100) {
    nodes {
      id quantity
      attributes { key value }
      cost { subtotalAmount { amount } }
      discountAllocations { ${DISCOUNT_ALLOC} }
      merchandise { ... on ProductVariant { id selectedOptions { name value } product { ${CART_LINE_PRODUCT} } } }
    }
  }
`;

interface Allocation {
  __typename: string;
  discountedAmount: Money;
  code?: string;
  title?: string;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  discountCodes: { code: string; applicable: boolean }[];
  discountAllocations: Allocation[];
  lines: {
    nodes: {
      id: string;
      quantity: number;
      attributes: { key: string; value: string | null }[];
      cost: { subtotalAmount: Money };
      discountAllocations: Allocation[];
      merchandise: { id: string; selectedOptions: { name: string; value: string }[]; product: ShopifyProduct };
    }[];
  };
}

export const CUSTOM_SIZES_ATTR = "Custom sizes";

const round = (n: number) => Math.round(n * 100) / 100;
const sumAlloc = (list: Allocation[], kind: "code" | "auto") =>
  list.filter((a) => (kind === "code" ? a.__typename === "CartCodeDiscountAllocation" : a.__typename !== "CartCodeDiscountAllocation")).reduce((s, a) => s + Number(a.discountedAmount.amount), 0);

/** Maps a Shopify cart onto the app's Quote shape. Shipping is an estimate; the real rate is chosen at Shopify checkout. */
export function cartToQuote(cart: ShopifyCart | null): Quote {
  const nodes = cart?.lines.nodes ?? [];
  const lines: CartLine[] = nodes.map((l) => {
    const v = { id: l.merchandise.id, availableForSale: true, selectedOptions: l.merchandise.selectedOptions };
    return {
      key: l.id,
      handle: l.merchandise.product.handle,
      variantId: l.merchandise.id,
      qty: l.quantity,
      size: option(v, "Size"),
      shape: option(v, "Shape"),
      customSizes: l.attributes.find((a) => a.key === CUSTOM_SIZES_ATTR)?.value ?? undefined,
      product: toProduct(l.merchandise.product),
      lineTotal: Number(l.cost.subtotalAmount.amount),
    };
  });
  const allLineAllocs = nodes.flatMap((l) => l.discountAllocations);
  const cartAllocs = cart?.discountAllocations ?? [];
  const subtotal = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  const promoDiscount = round(sumAlloc(allLineAllocs, "auto") + sumAlloc(cartAllocs, "auto"));
  const codeDiscount = round(sumAlloc(allLineAllocs, "code") + sumAlloc(cartAllocs, "code"));
  const setCount = lines.filter((l) => l.product.type === "set").reduce((s, l) => s + l.qty, 0);
  const tiers = PROMO_TIERS;
  const next = tiers.find((t) => setCount < t.buy + t.get);
  const applied = cart?.discountCodes.find((c) => c.applicable);
  const afterDiscounts = round(subtotal - promoDiscount - codeDiscount);
  const shipping = lines.length === 0 || afterDiscounts >= SITE.freeShippingThreshold ? 0 : SITE.shippingFee;

  return {
    lines,
    problems: [],
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal,
    setCount,
    freeCount: freeSetsFor(setCount, tiers),
    promoDiscount,
    code: applied?.code.toUpperCase() ?? null,
    codeValid: !!applied,
    codeDiscount,
    shipping,
    total: round(Math.max(0, afterDiscounts + shipping)),
    freeShippingThreshold: SITE.freeShippingThreshold,
    toFreeShipping: round(Math.max(0, SITE.freeShippingThreshold - afterDiscounts)),
    nextTier: next ? { ...next, setsNeeded: next.buy + next.get - setCount } : null,
    checkoutUrl: cart?.checkoutUrl ?? null,
  };
}

type CartResult = { cart: ShopifyCart | null; userErrors: { message: string }[]; warnings?: { message: string }[] };

function unwrap(r: CartResult): ShopifyCart {
  if (r.userErrors.length) throw new ShopifyError(r.userErrors.map((e) => e.message).join("; "));
  if (!r.cart) throw new ShopifyError("Cart not found");
  return r.cart;
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: { key: string; value: string }[];
}

export const cartApi = {
  async get(id: string) {
    const d = await storefront<{ cart: ShopifyCart | null }>(`query($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id }, { fresh: true });
    return d.cart;
  },
  async create(lines: CartLineInput[], discountCodes: string[] = []) {
    const d = await storefront<{ cartCreate: CartResult }>(
      `mutation($input: CartInput!) { cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { message } } }`,
      { input: { lines, discountCodes } },
      { fresh: true },
    );
    return unwrap(d.cartCreate);
  },
  async add(cartId: string, lines: CartLineInput[]) {
    const d = await storefront<{ cartLinesAdd: CartResult }>(
      `mutation($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
      { cartId, lines },
      { fresh: true },
    );
    return unwrap(d.cartLinesAdd);
  },
  async update(cartId: string, lines: { id: string; quantity: number }[]) {
    const d = await storefront<{ cartLinesUpdate: CartResult }>(
      `mutation($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
      { cartId, lines },
      { fresh: true },
    );
    return unwrap(d.cartLinesUpdate);
  },
  async remove(cartId: string, lineIds: string[]) {
    const d = await storefront<{ cartLinesRemove: CartResult }>(
      `mutation($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { message } } }`,
      { cartId, lineIds },
      { fresh: true },
    );
    return unwrap(d.cartLinesRemove);
  },
  async setCodes(cartId: string, discountCodes: string[]) {
    const d = await storefront<{ cartDiscountCodesUpdate: CartResult }>(
      `mutation($cartId: ID!, $codes: [String!]) { cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $codes) { cart { ${CART_FIELDS} } userErrors { message } } }`,
      { cartId, codes: discountCodes },
      { fresh: true },
    );
    return unwrap(d.cartDiscountCodesUpdate);
  },
};
