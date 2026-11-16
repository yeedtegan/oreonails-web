// Shopify connection settings. The Storefront token is a *public* token (safe in the browser);
// the Admin token is secret and only read by server code (see ./admin.ts).

export const SHOPIFY_API_VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-04";

/** e.g. "oreonails.myshopify.com" — the store's myshopify domain, without https://. */
export const SHOPIFY_STORE_DOMAIN = (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

export const SHOPIFY_STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || "";

/** Full Storefront GraphQL URL. Override only for testing (e.g. https://mock.shop/api). */
export const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_URL || (SHOPIFY_STORE_DOMAIN ? `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json` : "");

/** Shopify-hosted customer account (orders, addresses, order status). */
export const SHOPIFY_ACCOUNT_URL = SHOPIFY_STORE_DOMAIN ? `https://${SHOPIFY_STORE_DOMAIN}/account` : "";

/** Handle of the Shopify blog that holds the Nail Guide articles. */
export const BLOG_HANDLE = "nail-guide";

/** Metafield namespace used for Oreo-specific product / collection / article data. */
export const NS = "oreo";
