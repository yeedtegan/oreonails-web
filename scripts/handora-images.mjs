#!/usr/bin/env node
/**
 * Scrapes the product gallery images from handoranails.com with Playwright and adds the ones
 * missing from the matching products (same handle) in our Shopify store.
 *
 *   npm run shopify:handora-images                         # every store product tagged demo-handora
 *   npm run shopify:handora-images -- --handles=a,b        # only these handles
 *   npm run shopify:handora-images -- --max=8 --dry-run    # cap images per product, change nothing
 *   --concurrency=1 --delay=2000                           # pages at once / pause between pages (ms)
 *
 * Safe to re-run: images already on a product (same file name) are skipped.
 *
 * Images are attached by URL (Shopify downloads them itself), so nothing is saved locally.
 * Every gallery image is taken, including the size-guide and toolkit images.
 */
import { chromium } from "playwright";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const DRY = !!args["dry-run"];
const MAX = Number(args.max || 20);
const CONCURRENCY = Number(args.concurrency || 1);
const DELAY = Number(args.delay || 2000);
const SOURCE = "https://handoranails.com";
const TAG = "demo-handora";

const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-04";
if (!shop || !process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
  console.error("Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in .env.local");
  process.exit(1);
}

/* ---------------------------------------------------------------- Shopify Admin */

let token;
async function gql(query, variables, tries = 4) {
  token ??= (
    await (
      await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }),
      })
    ).json()
  ).access_token;
  const r = await fetch(`https://${shop}/admin/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json().catch(() => ({}));
  const throttled = r.status === 429 || j.errors?.some?.((e) => e.extensions?.code === "THROTTLED");
  if (throttled && tries) {
    await sleep(2000);
    return gql(query, variables, tries - 1);
  }
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 400));
  return j.data;
}

const MEDIA = `media(first: 100) { nodes { ... on MediaImage { image { url } } } }`;

async function storeProducts() {
  if (typeof args.handles === "string") {
    const out = [];
    for (const handle of args.handles.split(",").filter(Boolean)) {
      const d = await gql(`query($h: String!) { productByIdentifier(identifier: { handle: $h }) { id handle title ${MEDIA} } }`, { h: handle });
      if (d.productByIdentifier) out.push(d.productByIdentifier);
      else console.log(`· ${handle}: not in store, skipped`);
    }
    return out;
  }
  const out = [];
  let after = null;
  do {
    const d = await gql(
      `query($q: String!, $after: String) { products(first: 50, query: $q, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle title ${MEDIA} } } }`,
      { q: `tag:${TAG}`, after },
    );
    out.push(...d.products.nodes);
    after = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (after);
  return out;
}

async function addMedia(productId, urls, alt) {
  const media = urls.map((originalSource) => ({ originalSource, mediaContentType: "IMAGE", alt }));
  const d = await gql(
    `mutation($product: ProductUpdateInput!, $media: [CreateMediaInput!]) { productUpdate(product: $product, media: $media) { userErrors { field message } } }`,
    { product: { id: productId }, media },
  );
  const errors = d.productUpdate.userErrors;
  if (errors.length) throw new Error(errors.map((e) => e.message).join("; "));
}

/* ---------------------------------------------------------------- Scraping */

/** File name without extension, query or the "_<uuid>" suffix Shopify adds on upload — used to spot duplicates. */
const fileKey = (url) =>
  decodeURIComponent(new URL(url, SOURCE).pathname.split("/").pop() || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, "");

/** Full-size URL: drop the width/height/crop resize params, keep the version. */
function fullSize(src) {
  const u = new URL(src, SOURCE);
  const v = u.searchParams.get("v");
  u.search = v ? `?v=${v}` : "";
  return u.toString();
}

async function scrape(page, handle, attempt = 0) {
  let res;
  try {
    res = await page.goto(`${SOURCE}/products/${handle}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  } catch (e) {
    if (attempt >= 3) throw e;
    await sleep(5000); // transient network error — retry
    return scrape(page, handle, attempt + 1);
  }
  if (res?.status() === 429 && attempt < 4) {
    // Rate limited: honour Retry-After when given, else back off 30s, 60s, 90s…
    const wait = (Number(res.headers()["retry-after"]) || 30 * (attempt + 1)) * 1000;
    console.log(`  … ${handle}: rate limited, waiting ${wait / 1000}s`);
    await sleep(wait);
    return scrape(page, handle, attempt + 1);
  }
  if (!res || res.status() >= 400) throw new Error(`HTTP ${res?.status()}`);
  await page.waitForSelector(".product-gallery__media--image img", { timeout: 20_000 });
  const srcs = await page.$$eval(".product-gallery__media--image img", (imgs) =>
    imgs.map((i) => i.getAttribute("data-src") || i.currentSrc || i.getAttribute("src") || "").filter(Boolean),
  );
  const seen = new Set();
  const urls = [];
  for (const s of srcs) {
    const url = fullSize(s);
    const key = fileKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(url);
  }
  return urls;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------- Main */

const products = await storeProducts();
console.log(`${products.length} products${DRY ? " (dry run)" : ""}\n`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
// Images, fonts and media aren't needed to read the gallery's URLs.
await context.route("**/*", (route) => (["image", "font", "media"].includes(route.request().resourceType()) ? route.abort() : route.continue()));

let added = 0, unchanged = 0, failed = 0;
const queue = [...products];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    const page = await context.newPage();
    for (let p; (p = queue.shift()); ) {
      try {
        const scraped = (await scrape(page, p.handle)).slice(0, MAX);
        const have = new Set(p.media.nodes.filter((m) => m.image).map((m) => fileKey(m.image.url)));
        const missing = scraped.filter((u) => !have.has(fileKey(u)));
        if (!missing.length) {
          unchanged++;
          console.log(`= ${p.handle}: ${scraped.length} scraped, all present`);
        } else {
          if (!DRY) await addMedia(p.id, missing, p.title);
          added += missing.length;
          console.log(`+ ${p.handle}: ${scraped.length} scraped, ${DRY ? "would add" : "added"} ${missing.length}`);
        }
      } catch (e) {
        failed++;
        console.log(`✗ ${p.handle}: ${e.message}`);
      }
      await sleep(DELAY); // be polite to the source site
    }
    await page.close();
  }),
);
await browser.close();

console.log(`\n${DRY ? "would add" : "added"} ${added} images · ${unchanged} products already complete · ${failed} failed`);
if (failed) process.exitCode = 1;
