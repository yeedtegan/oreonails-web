# Oreo Nails — press-on nail storefront

Next.js 15 (App Router) + Tailwind v4, running as a **headless Shopify** storefront. Shopify holds the
catalogue, cart, checkout (Shopify Payments, Shop Pay, PayPal…), orders, customer accounts and discounts.
This app is the shop front only.

```bash
cp .env.example .env.local   # fill in the Shopify values
npm install && npm run dev   # http://localhost:3000
```

No store yet? Set `NEXT_PUBLIC_SHOPIFY_STOREFRONT_URL=https://mock.shop/api` to browse Shopify's demo catalogue.

## Setting up the Shopify store (once)

1. **Plan & payments.** Any paid Shopify plan. Turn on Shopify Payments under Settings → Payments.
   Shopify Payments is only offered to businesses registered in [supported countries](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries)
   (Vietnam is not one of them).
2. **Storefront token.** Install the **Headless** sales channel → create a storefront → copy the *public* access
   token into `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`.
3. **Admin token.** Settings → Apps and sales channels → Develop apps → create an app with the scopes listed in
   `.env.example`, install it, copy the Admin API token into `SHOPIFY_ADMIN_TOKEN`.
4. **Import the old catalogue.** With the old API still running (`cd ../server && npm run dev`):

   ```bash
   npm run shopify:migrate -- --dry-run     # shows what will be copied
   OLD_ADMIN_TOKEN=… npm run shopify:migrate # OLD_ADMIN_TOKEN = ../server ADMIN_TOKEN (optional)
   ```

   It creates the metafield/metaobject definitions, collections, products (sets get Size × Shape variants),
   the Nail Guide blog, FAQs, reviews, the mix & match Buy X Get Y discounts, discount codes and (with
   `OLD_ADMIN_TOKEN`) newsletter subscribers. It is safe to re-run. Past orders, customer accounts, loyalty
   points and the old contact inbox are **not** migrated.
5. **In Shopify admin, set by hand:**
   - Shipping (Settings → Shipping and delivery): Standard $5.99, free over $69; Express $14.99.
     The cart shows an estimate using `SITE.freeShippingThreshold` / `SITE.shippingFee` in `src/lib/data.ts`,
     so keep them in sync.
   - Customer accounts (Settings → Customer accounts): use the new customer accounts.
   - Checkout branding, order-confirmation emails and the order-number prefix (e.g. `#ON`).
   - Point your domain's checkout at Shopify. Keep `www` on this app and use something like
     `checkout.oreonails.com` for Shopify (Settings → Domains).

## Where things live
- `src/lib/shopify/storefront.ts` — Storefront API: catalogue queries, mapping Shopify data onto the app's types, the cart.
- `src/lib/shopify/admin.ts` — Admin API (server only), used by `src/app/api/{reviews,newsletter,contact}`.
- `src/lib/api-server.ts` — what server components call; `src/app/api/products` serves browser-side search, favorites and recommendations.
- `src/context/StoreContext.tsx` — Shopify cart (id in localStorage), favorites, discount code, hand-off to checkout.
- `src/lib/data.ts` — shared types and static config (nav, size chart, promo tiers, contact info).
- `scripts/shopify-migrate.mjs` — one-off import from the old API.

### Where to manage content now
| What | Shopify admin |
|---|---|
| Products, prices, images, collections | Products / Collections. Custom fields (palette, pattern, shape, sets included, rating) are metafields in the `oreo` namespace. |
| Collection grouping in the menu | Collection metafield `oreo.group`: `shop`, `collection`, `season` or `other`; order by `oreo.position`. |
| Nail Guide articles | Online Store → Blog posts → blog "Nail Guide" (`nail-guide`). |
| FAQs | Content → Metaobjects → FAQ. |
| Reviews | Content → Metaobjects → Review. New reviews from the site arrive as **Draft**; set them to Active to publish. |
| Contact / custom-design requests | Content → Metaobjects → Contact message. |
| Newsletter subscribers | Customers (tag `newsletter`, email marketing subscribed). |
| Mix & match promo, discount codes | Discounts. The tiers shown in the UI are `PROMO_TIERS` in `src/lib/data.ts`. |
| Orders, refunds, fulfilment, tracking | Orders. |

Catalogue pages are cached for 60 seconds, so edits in Shopify show up within a minute.
