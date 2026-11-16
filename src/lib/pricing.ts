import type { Product } from "./data";

// Prices and promotions are always computed by the backend: POST /api/cart/quote on the Oreo Nails API ("db"),
// or the Shopify cart's cost and discount allocations (cartToQuote in ./shopify/storefront.ts).
// This file only holds the cart shapes and display helpers.

export interface CartItem {
  /** "db": handle|size|shape|custom (see lineKey). "shopify": cart line id. */
  key: string;
  handle: string;
  /** Shopify only. */
  variantId?: string;
  qty: number;
  size?: string;
  shape?: string;
  customSizes?: string;
}

export interface CartLine extends CartItem {
  product: Product;
  lineTotal: number;
}

export interface Quote {
  lines: CartLine[];
  problems: { key: string; handle: string; error: string }[];
  count: number;
  subtotal: number;
  setCount: number;
  freeCount: number;
  promoDiscount: number;
  code: string | null;
  codeValid: boolean;
  codeDiscount: number;
  /** "db" only. */
  codePercent?: number;
  /** "db": the chosen rate's price. "shopify": an estimate; the real rate is chosen at Shopify checkout. */
  shipping: number;
  /** "db" only — the rates offered at checkout. */
  shippingRate?: ShippingRateId;
  shippingRates?: ShippingRate[];
  total: number;
  freeShippingThreshold: number;
  toFreeShipping: number;
  nextTier: { buy: number; get: number; setsNeeded: number } | null;
  /** Shopify only. */
  checkoutUrl?: string | null;
}

export type ShippingRateId = "standard" | "express";
export interface ShippingRate {
  id: ShippingRateId;
  title: string;
  detail: string;
  price: number;
}

export const EMPTY_QUOTE: Quote = {
  lines: [],
  problems: [],
  count: 0,
  subtotal: 0,
  setCount: 0,
  freeCount: 0,
  promoDiscount: 0,
  code: null,
  codeValid: false,
  codeDiscount: 0,
  shipping: 0,
  total: 0,
  freeShippingThreshold: 69,
  toFreeShipping: 69,
  nextTier: null,
  checkoutUrl: null,
};

/** "db" cart line key. Must match the API's lineKey so quote lines map back to cart items. */
export const lineKey = (handle: string, size?: string, shape?: string, custom?: string) => [handle, size ?? "", shape ?? "", custom ?? ""].join("|");

export const money = (n: number) => `$${n.toFixed(2)}`;

export const discountPct = (p: Product) =>
  p.compareAt ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;

/** Free sets for a set count, given the store's promo tiers (used for the bundle builder preview). */
export function freeSetsFor(count: number, tiers: { buy: number; get: number }[]) {
  let free = 0;
  for (const t of tiers) if (count >= t.buy + t.get) free = t.get;
  return free;
}
