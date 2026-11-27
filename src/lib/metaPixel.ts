"use client";

/**
 * Meta (Facebook) Pixel — standard events for ads tracking.
 * The pixel only loads when NEXT_PUBLIC_META_PIXEL_ID is set (see MetaPixel.tsx); without it every call here is a no-op.
 * Several pixels: comma-separated ids ("111,222") — each one is initialised and every event goes to all of them.
 * No personal data is sent: only product ids, names, quantities and prices.
 */

/** pixel ids from NEXT_PUBLIC_META_PIXEL_ID ("111" or "111,222"); only digits are kept */
export const META_PIXEL_IDS = [...new Set((process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").split(/[\s,]+/).filter((id) => /^\d+$/.test(id)))];

type Fbq = (command: "track" | "trackCustom", event: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export type PixelEvent = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | "Search" | "CustomizeProduct" | "AddToWishlist";

/** e.g. { content_ids: ["angel-glow"], content_type: "product", value: 35.49, currency: "USD" } */
export type PixelParams = {
  content_ids?: string[];
  content_name?: string;
  content_type?: "product" | "product_group";
  contents?: { id: string; quantity: number; item_price?: number }[];
  num_items?: number;
  value?: number;
  currency?: string;
  search_string?: string;
};

/**
 * Sends a standard event. `eventID` lets Meta drop duplicates (e.g. the same order's Purchase sent twice, or later
 * the same event from the Conversions API on the server).
 */
export function track(event: PixelEvent, params?: PixelParams, eventID?: string) {
  if (!META_PIXEL_IDS.length || typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", event, params, eventID ? { eventID } : undefined);
  } catch {
    // tracking must never break the shop
  }
}

/** the store's currency (from /api/pricing), as Meta wants it: "USD" */
export const pixelCurrency = (currency: string | null | undefined) => (currency || "usd").toUpperCase();

/** one product, for ViewContent / AddToWishlist */
export const productParams = (p: { id: string; name: string; price: number }, currency?: string | null): PixelParams => ({
  content_ids: [p.id],
  content_name: p.name,
  content_type: "product",
  value: p.price,
  currency: pixelCurrency(currency),
});
