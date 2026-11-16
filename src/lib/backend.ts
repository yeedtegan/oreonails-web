/**
 * Which backend the storefront runs on, fixed at build time:
 *  - "db"      (default) — the Oreo Nails API + Postgres in ../server: own checkout, accounts and /admin.
 *  - "shopify" — Shopify Storefront API (headless): cart and checkout on Shopify, see ./shopify/.
 */
export const DATA_SOURCE: "db" | "shopify" = process.env.NEXT_PUBLIC_DATA_SOURCE === "shopify" ? "shopify" : "db";
export const isDb = DATA_SOURCE === "db";
