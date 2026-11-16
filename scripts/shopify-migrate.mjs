#!/usr/bin/env node
/**
 * One-off migration: copies the Oreo Nails catalogue from the old API (../server) into Shopify via the Admin API.
 * Safe to re-run — everything is upserted by handle / code / email.
 *
 *   node --env-file=.env.local scripts/shopify-migrate.mjs [--dry-run] [--only=meta,collections,products,articles,faqs,reviews,discounts,subscribers]
 *
 * Env:
 *   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN  your-store.myshopify.com
 *   SHOPIFY_ADMIN_TOKEN               Admin API token (custom app) — scopes listed in .env.example
 *   OLD_API_URL                       old API (default http://localhost:4000) — must be running
 *   OLD_ADMIN_TOKEN                   old API's ADMIN_TOKEN — optional; enables inactive products, discount codes, subscribers
 *
 * What it creates in Shopify:
 *   - metafield definitions (namespace "oreo") on products, collections and articles, readable by the Storefront API
 *   - metaobject definitions: faq, review (public), contact_message (private)
 *   - collections (+ an unpublished smart collection "all-sets" used by the mix & match discounts)
 *   - products: sets get Size × Shape variants; tools/bundles a single variant; images are re-uploaded
 *   - the "nail-guide" blog and its articles, FAQs, reviews
 *   - automatic Buy X Get Y discounts for the promo tiers + the discount codes
 *   - newsletter subscribers as customers with email-marketing consent
 * Not migrated: past orders, customer accounts/passwords, loyalty points, contact-form inbox.
 */

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const ONLY = (args.find((a) => a.startsWith("--only="))?.slice(7).split(",") ?? []).filter(Boolean);
const step = (name) => ONLY.length === 0 || ONLY.includes(name);

const DOMAIN = (process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
let TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";
const VERSION = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-04";
const OLD = (process.env.OLD_API_URL || "http://localhost:4000").replace(/\/$/, "");
const OLD_ADMIN = process.env.OLD_ADMIN_TOKEN || "";
const NS = "oreo";
const BLOG = "nail-guide";

if (!DRY && (!DOMAIN || !((CLIENT_ID && CLIENT_SECRET) || TOKEN))) {
  console.error("Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_TOKEN), or pass --dry-run.");
  process.exit(1);
}

/** Dev Dashboard apps: exchange client id/secret for an Admin token (client-credentials grant). */
async function fetchToken() {
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.access_token) throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(json)}`);
  TOKEN = json.access_token;
}

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = (text) => String(text ?? "").split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* ------------------------------------------------------------------ HTTP */

class SchemaError extends Error {}

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429 && attempt < 8) {
      await sleep(2000);
      continue;
    }
    const json = await res.json().catch(() => null);
    const errors = json?.errors;
    if (Array.isArray(errors) && errors.some((e) => e.extensions?.code === "THROTTLED") && attempt < 8) {
      await sleep(2000);
      continue;
    }
    if (!res.ok || errors) {
      const msg = JSON.stringify(errors ?? json ?? res.status);
      // Unknown field/argument: lets callers fall back to an older/newer API shape.
      if (/undefinedField|argumentNotAccepted|doesn't exist on type|isn't a defined input field|missingRequiredArguments/i.test(msg)) throw new SchemaError(msg);
      throw new Error(`Admin API ${res.status}: ${msg}`);
    }
    return json.data;
  }
}

/** Runs `primary`; if the API version doesn't know a field it uses, runs `fallback` instead. */
async function either(primary, fallback) {
  try {
    return await primary();
  } catch (e) {
    if (e instanceof SchemaError) return fallback();
    throw e;
  }
}

function check(payload, what, ignoreCodes = []) {
  const errs = (payload?.userErrors ?? []).filter((e) => !ignoreCodes.includes(e.code));
  if (errs.length) throw new Error(`${what}: ${errs.map((e) => `${e.field?.join(".") ?? ""} ${e.message}`).join("; ")}`);
  return payload;
}

async function old(path, { admin = false } = {}) {
  const res = await fetch(`${OLD}/api${path}`, { headers: admin && OLD_ADMIN ? { Authorization: `Bearer ${OLD_ADMIN}` } : {} });
  if (!res.ok) throw new Error(`Old API ${path} → ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ helpers */

let publications = null;
async function publish(id) {
  if (!publications) {
    const d = await gql(`{ publications(first: 25) { nodes { id name } } }`);
    publications = d.publications.nodes;
    log(`  publishing to: ${publications.map((p) => p.name).join(", ")}`);
  }
  if (!publications.length) return;
  const d = await gql(
    `mutation($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`,
    { id, input: publications.map((p) => ({ publicationId: p.id })) },
  );
  check(d.publishablePublish, `publish ${id}`);
}

const uploaded = new Map();
/** Returns a URL Shopify can fetch: public URLs pass through, local ones (old API /uploads) are staged-uploaded. */
async function shopifyImage(src) {
  if (!src) return null;
  const url = /^https?:\/\//.test(src) ? src : `${OLD}${src.startsWith("/") ? "" : "/"}${src}`;
  if (!/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url)) return url;
  if (uploaded.has(url)) return uploaded.get(url);
  const res = await fetch(url);
  if (!res.ok) {
    log(`  ! image not found, skipped: ${url}`);
    return null;
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  const filename = url.split("/").pop().split("?")[0] || "image.jpg";
  const d = await gql(
    `mutation($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
    { input: [{ resource: "IMAGE", filename, mimeType, httpMethod: "POST", fileSize: String(bytes.length) }] },
  );
  const target = check(d.stagedUploadsCreate, "stagedUploadsCreate").stagedTargets[0];
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([bytes], { type: mimeType }), filename);
  const up = await fetch(target.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`staged upload failed: ${up.status}`);
  uploaded.set(url, target.resourceUrl);
  return target.resourceUrl;
}

const mfs = (pairs) =>
  pairs
    .filter(([, , v]) => v !== undefined && v !== null && v !== "")
    .map(([key, type, value]) => ({ namespace: NS, key, type, value: typeof value === "string" ? value : JSON.stringify(value) }));

/* ------------------------------------------------------------------ steps */

async function ensureDefinitions() {
  log("\n▸ Metafield & metaobject definitions");
  const defs = [
    ["PRODUCT", "palette", "json"],
    ["PRODUCT", "pattern", "single_line_text_field"],
    ["PRODUCT", "shape", "single_line_text_field"],
    ["PRODUCT", "sets_included", "number_integer"],
    ["PRODUCT", "rating", "number_decimal"],
    ["PRODUCT", "review_count", "number_integer"],
    ["COLLECTION", "group", "single_line_text_field"],
    ["COLLECTION", "palette", "json"],
    ["COLLECTION", "pattern", "single_line_text_field"],
    ["COLLECTION", "position", "number_integer"],
    ["ARTICLE", "palette", "json"],
    ["ARTICLE", "pattern", "single_line_text_field"],
  ];
  for (const [ownerType, key, type] of defs) {
    const d = await gql(
      `mutation($d: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $d) { createdDefinition { id } userErrors { field message code } } }`,
      { d: { name: key.replace(/_/g, " "), namespace: NS, key, type, ownerType, access: { storefront: "PUBLIC_READ" } } },
    );
    check(d.metafieldDefinitionCreate, `metafield ${ownerType}.${key}`, ["TAKEN", "DUPLICATE"]);
  }

  const text = "single_line_text_field";
  const long = "multi_line_text_field";
  const objects = [
    { type: "faq", name: "FAQ", displayNameKey: "question", storefront: "PUBLIC_READ", fields: [["question", text], ["answer", long], ["category", text], ["position", "number_integer"]] },
    {
      type: "review",
      name: "Review",
      displayNameKey: "title",
      storefront: "PUBLIC_READ",
      fields: [["name", text], ["rating", "number_integer"], ["title", text], ["body", long], ["product_handle", text], ["product_title", text], ["variant", text], ["date", text]],
    },
    {
      type: "contact_message",
      name: "Contact message",
      displayNameKey: "topic",
      storefront: "NONE",
      fields: [["name", text], ["email", text], ["phone", text], ["topic", text], ["message", long], ["meta", long], ["received_at", text]],
    },
  ];
  for (const o of objects) {
    const d = await gql(
      `mutation($d: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $d) { metaobjectDefinition { id } userErrors { field message code } } }`,
      {
        d: {
          type: o.type,
          name: o.name,
          displayNameKey: o.displayNameKey,
          access: { storefront: o.storefront },
          capabilities: { publishable: { enabled: true } },
          fieldDefinitions: o.fields.map(([key, type]) => ({ key, name: key.replace(/_/g, " "), type })),
        },
      },
    );
    check(d.metaobjectDefinitionCreate, `metaobject ${o.type}`, ["TAKEN", "DUPLICATE"]);
  }
  log("  ok");
}

async function collectionId(handle) {
  return either(
    async () => (await gql(`query($h: String!) { collectionByIdentifier(identifier: { handle: $h }) { id } }`, { h: handle })).collectionByIdentifier?.id ?? null,
    async () => (await gql(`query($h: String!) { collectionByHandle(handle: $h) { id } }`, { h: handle })).collectionByHandle?.id ?? null,
  );
}

async function upsertCollection(input, { publishIt = true } = {}) {
  const id = await collectionId(input.handle);
  if (id) {
    const d = await gql(`mutation($input: CollectionInput!) { collectionUpdate(input: $input) { collection { id } userErrors { field message } } }`, { input: { ...input, id } });
    check(d.collectionUpdate, `collection ${input.handle}`);
  } else {
    const d = await gql(`mutation($input: CollectionInput!) { collectionCreate(input: $input) { collection { id } userErrors { field message } } }`, { input });
    check(d.collectionCreate, `collection ${input.handle}`);
  }
  const finalId = id ?? (await collectionId(input.handle));
  if (publishIt) await publish(finalId);
  return finalId;
}

async function migrateCollections(collections) {
  log(`\n▸ Collections (${collections.length})`);
  const ids = new Map();
  for (const [i, c] of collections.entries()) {
    if (DRY) continue;
    const image = await shopifyImage(c.image);
    const id = await upsertCollection({
      title: c.title,
      handle: c.handle,
      descriptionHtml: html(c.description),
      sortOrder: "MANUAL",
      ...(image && { image: { src: image, altText: c.title } }),
      metafields: mfs([
        ["group", "single_line_text_field", c.group],
        ["palette", "json", c.palette],
        ["pattern", "single_line_text_field", c.pattern],
        ["position", "number_integer", String(c.position ?? i)],
      ]),
    });
    ids.set(c.handle, id);
    log(`  ✓ ${c.handle}`);
  }
  if (!DRY) {
    // Rule-based, unpublished: the mix & match discounts target every product of type "set".
    ids.set(
      "all-sets",
      await upsertCollection(
        { title: "All sets (mix & match discount)", handle: "all-sets", ruleSet: { appliedDisjunctively: false, rules: [{ column: "TYPE", relation: "EQUALS", condition: "set" }] } },
        { publishIt: false },
      ),
    );
    log("  ✓ all-sets (smart, unpublished)");
  }
  return ids;
}

async function productId(handle) {
  return either(
    async () => (await gql(`query($h: String!) { productByIdentifier(identifier: { handle: $h }) { id } }`, { h: handle })).productByIdentifier?.id ?? null,
    async () => (await gql(`query($h: String!) { productByHandle(handle: $h) { id } }`, { h: handle })).productByHandle?.id ?? null,
  );
}

async function migrateProducts(products, site, collectionIds) {
  log(`\n▸ Products (${products.length})`);
  const ids = new Map();
  for (const p of products) {
    const isSet = p.type === "set";
    const price = Number(p.price).toFixed(2);
    const compareAtPrice = p.compareAt ? Number(p.compareAt).toFixed(2) : null;
    const variant = (optionValues) => ({ optionValues, price, compareAtPrice, inventoryPolicy: "CONTINUE" });
    const productOptions = isSet
      ? [
          { name: "Size", values: site.sizes.map((name) => ({ name })) },
          { name: "Shape", values: site.shapes.map((name) => ({ name })) },
        ]
      : [{ name: "Title", values: [{ name: "Default Title" }] }];
    const variants = isSet
      ? site.sizes.flatMap((s) => site.shapes.map((sh) => variant([{ optionName: "Size", name: s }, { optionName: "Shape", name: sh }])))
      : [variant([{ optionName: "Title", name: "Default Title" }])];
    if (DRY) {
      log(`  · ${p.handle} (${p.type}, ${variants.length} variants)`);
      continue;
    }
    const files = [];
    for (const src of p.images ?? []) {
      const url = await shopifyImage(src);
      if (url) files.push({ originalSource: url, contentType: "IMAGE", alt: p.title });
    }
    const input = {
      title: p.title,
      handle: p.handle,
      descriptionHtml: html(p.description),
      productType: p.type,
      vendor: "Oreo Nails",
      status: p.active === false ? "DRAFT" : "ACTIVE",
      productOptions,
      variants,
      collections: (p.collections ?? []).map((h) => collectionIds.get(h)).filter(Boolean),
      ...(files.length && { files }),
      metafields: mfs([
        ["palette", "json", p.palette],
        ["pattern", "single_line_text_field", p.pattern],
        ["shape", "single_line_text_field", p.shape],
        ["sets_included", "number_integer", p.setsIncluded != null ? String(p.setsIncluded) : null],
        ["rating", "number_decimal", String(p.rating ?? 0)],
        ["review_count", "number_integer", String(p.reviewCount ?? 0)],
      ]),
    };
    const M = `product { id } userErrors { field message code }`;
    const d = await either(
      () => gql(`mutation($input: ProductSetInput!, $id: ProductSetIdentifiers) { productSet(input: $input, identifier: $id, synchronous: true) { ${M} } }`, { input, id: { handle: p.handle } }),
      async () => {
        const id = await productId(p.handle);
        return gql(`mutation($input: ProductSetInput!) { productSet(input: $input, synchronous: true) { ${M} } }`, { input: { ...input, ...(id && { id }) } });
      },
    );
    const id = check(d.productSet, `product ${p.handle}`).product.id;
    ids.set(p.handle, id);
    if (p.active !== false) await publish(id);
    log(`  ✓ ${p.handle}`);
  }
  return ids;
}

async function orderCollections(collections, productIds, collectionIds) {
  log("\n▸ Collection product order");
  for (const c of collections) {
    const cid = collectionIds.get(c.handle);
    if (!cid) continue;
    const data = await old(`/collections/${encodeURIComponent(c.handle)}?limit=200`).catch(() => null);
    const moves = (data?.products ?? [])
      .map((p) => productIds.get(p.handle))
      .filter(Boolean)
      .slice(0, 250)
      .map((id, i) => ({ id, newPosition: String(i) }));
    if (!moves.length) continue;
    const d = await gql(`mutation($id: ID!, $moves: [MoveInput!]!) { collectionReorderProducts(id: $id, moves: $moves) { job { id } userErrors { field message } } }`, { id: cid, moves });
    check(d.collectionReorderProducts, `reorder ${c.handle}`);
    log(`  ✓ ${c.handle} (${moves.length})`);
  }
}

async function migrateArticles() {
  const { articles } = await old("/articles?limit=200");
  log(`\n▸ Nail Guide articles (${articles.length})`);
  if (DRY) return;
  const blogs = (await gql(`{ blogs(first: 50) { nodes { id handle } } }`)).blogs.nodes;
  let blogId = blogs.find((b) => b.handle === BLOG)?.id;
  if (!blogId) {
    const d = await gql(`mutation($blog: BlogCreateInput!) { blogCreate(blog: $blog) { blog { id } userErrors { field message } } }`, { blog: { title: "Nail Guide", handle: BLOG } });
    blogId = check(d.blogCreate, "blogCreate").blog.id;
  }
  const existing = new Map(
    (await gql(`query($id: ID!) { blog(id: $id) { articles(first: 250) { nodes { id handle } } } }`, { id: blogId })).blog.articles.nodes.map((a) => [a.handle, a.id]),
  );
  for (const summary of articles) {
    const { article: a } = await old(`/articles/${encodeURIComponent(summary.slug)}`);
    const image = await shopifyImage(a.image);
    const fields = {
      title: a.title,
      handle: a.slug,
      body: (a.body ?? []).map((p) => `<p>${esc(p)}</p>`).join(""),
      summary: a.excerpt ? `<p>${esc(a.excerpt)}</p>` : "",
      tags: a.tags ?? [],
      isPublished: true,
      publishDate: new Date(a.date).toISOString(),
      author: { name: "The Oreo Nails Studio" },
      ...(image && { image: { url: image, altText: a.title } }),
      metafields: mfs([
        ["palette", "json", a.palette],
        ["pattern", "single_line_text_field", a.pattern],
      ]),
    };
    const id = existing.get(a.slug);
    if (id) {
      const d = await gql(`mutation($id: ID!, $a: ArticleUpdateInput!) { articleUpdate(id: $id, article: $a) { article { id } userErrors { field message } } }`, { id, a: fields });
      check(d.articleUpdate, `article ${a.slug}`);
    } else {
      const d = await gql(`mutation($a: ArticleCreateInput!) { articleCreate(article: $a) { article { id } userErrors { field message } } }`, { a: { ...fields, blogId } });
      check(d.articleCreate, `article ${a.slug}`);
    }
    log(`  ✓ ${a.slug}`);
  }
}

async function upsertMetaobject(type, handle, fields) {
  const d = await gql(
    `mutation($h: MetaobjectHandleInput!, $m: MetaobjectUpsertInput!) { metaobjectUpsert(handle: $h, metaobject: $m) { metaobject { id } userErrors { field message } } }`,
    {
      h: { type, handle },
      m: {
        fields: Object.entries(fields)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([key, value]) => ({ key, value: String(value) })),
        capabilities: { publishable: { status: "ACTIVE" } },
      },
    },
  );
  check(d.metaobjectUpsert, `${type} ${handle}`);
}

async function migrateFaqs() {
  const { faqs } = await old("/faqs");
  log(`\n▸ FAQs (${faqs.length})`);
  if (DRY) return;
  for (const [i, f] of faqs.entries()) await upsertMetaobject("faq", `faq-${i + 1}`, { question: f.q, answer: f.a, category: f.category, position: i });
  log("  ok");
}

async function migrateReviews() {
  const all = [];
  for (let offset = 0; ; offset += 100) {
    const { reviews } = await old(`/reviews?limit=100&offset=${offset}`);
    all.push(...reviews);
    if (reviews.length < 100) break;
  }
  log(`\n▸ Reviews (${all.length})`);
  if (DRY) return;
  for (const r of all) {
    await upsertMetaobject("review", `review-${slug(r.id)}`, {
      name: r.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      product_handle: r.product,
      product_title: r.productTitle,
      variant: r.variant,
      date: r.date,
    });
  }
  log("  ok");
}

async function migrateDiscounts(site, collectionIds) {
  log("\n▸ Discounts");
  const setsId = collectionIds.get("all-sets") ?? (DRY ? null : await collectionId("all-sets"));
  const startsAt = new Date().toISOString();

  const existingAuto = DRY
    ? []
    : (
        await gql(`{ automaticDiscountNodes(first: 100) { nodes { automaticDiscount { ... on DiscountAutomaticBxgy { title } } } } }`)
      ).automaticDiscountNodes.nodes.map((n) => n.automaticDiscount?.title);

  for (const t of site.promoTiers) {
    const title = `Mix & match: buy ${t.buy} get ${t.get} free`;
    if (DRY || existingAuto.includes(title)) {
      log(`  · ${title}${DRY ? "" : " (exists)"}`);
      continue;
    }
    if (!setsId) throw new Error("all-sets collection missing — run the collections step first");
    const items = { collections: { add: [setsId] } };
    const d = await gql(
      `mutation($d: DiscountAutomaticBxgyInput!) { discountAutomaticBxgyCreate(automaticBxgyDiscount: $d) { automaticDiscountNode { id } userErrors { field message } } }`,
      {
        d: {
          title,
          startsAt,
          usesPerOrderLimit: "1",
          customerBuys: { items, value: { quantity: String(t.buy) } },
          customerGets: { items, value: { discountOnQuantity: { quantity: String(t.get), effect: { percentage: 1.0 } } } },
          combinesWith: { orderDiscounts: true, productDiscounts: false, shippingDiscounts: true },
        },
      },
    );
    check(d.discountAutomaticBxgyCreate, title);
    log(`  ✓ ${title}`);
  }

  let codes = [{ code: "WELCOME10", percent: 10, active: true }];
  if (OLD_ADMIN) codes = (await old("/admin/discounts", { admin: true })).discounts;
  for (const c of codes.filter((c) => c.active)) {
    if (DRY) {
      log(`  · code ${c.code} (${c.percent}%)`);
      continue;
    }
    const exists = (await gql(`query($c: String!) { codeDiscountNodeByCode(code: $c) { id } }`, { c: c.code })).codeDiscountNodeByCode;
    if (exists) {
      log(`  · code ${c.code} (exists)`);
      continue;
    }
    const base = {
      title: `${c.code} — ${c.percent}% off`,
      code: c.code,
      startsAt,
      customerGets: { value: { percentage: c.percent / 100 }, items: { all: true } },
      appliesOncePerCustomer: c.code === "WELCOME10",
      combinesWith: { productDiscounts: true, orderDiscounts: false, shippingDiscounts: true },
    };
    const M = `mutation($d: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $d) { codeDiscountNode { id } userErrors { field message } } }`;
    const d = await either(
      () => gql(M, { d: { ...base, context: { all: "ALL" } } }),
      () => gql(M, { d: { ...base, customerSelection: { all: true } } }),
    );
    check(d.discountCodeBasicCreate, `code ${c.code}`);
    log(`  ✓ code ${c.code}`);
  }
}

async function migrateSubscribers() {
  if (!OLD_ADMIN) {
    log("\n▸ Subscribers — skipped (set OLD_ADMIN_TOKEN to migrate)");
    return;
  }
  const { subscribers } = await old("/admin/subscribers", { admin: true });
  log(`\n▸ Subscribers (${subscribers.length})`);
  if (DRY) return;
  const consent = { marketingState: "SUBSCRIBED", marketingOptInLevel: "SINGLE_OPT_IN" };
  for (const s of subscribers) {
    const email = String(s.email).toLowerCase();
    const found = (await gql(`query($q: String!) { customers(first: 1, query: $q) { nodes { id } } }`, { q: `email:${JSON.stringify(email)}` })).customers.nodes[0];
    if (found) {
      const d = await gql(
        `mutation($i: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $i) { userErrors { field message } } }`,
        { i: { customerId: found.id, emailMarketingConsent: consent } },
      );
      check(d.customerEmailMarketingConsentUpdate, email);
    } else {
      const d = await gql(`mutation($i: CustomerInput!) { customerCreate(input: $i) { customer { id } userErrors { field message } } }`, {
        i: { email, emailMarketingConsent: consent, tags: ["newsletter"] },
      });
      check(d.customerCreate, email);
    }
  }
  log("  ok");
}

/* ------------------------------------------------------------------ main */

async function main() {
  log(`Old API: ${OLD}${OLD_ADMIN ? " (admin)" : ""}  →  Shopify: ${DOMAIN || "(dry run)"} [${VERSION}]${DRY ? "  DRY RUN" : ""}`);
  if (!DRY && CLIENT_ID && CLIENT_SECRET) await fetchToken();
  const site = await old("/site");

  const collections = OLD_ADMIN ? (await old("/admin/collections", { admin: true })).collections : (await old("/collections")).collections;
  const products = [];
  for (let offset = 0; ; offset += 200) {
    const page = OLD_ADMIN ? await old(`/admin/products?limit=200&offset=${offset}`, { admin: true }) : await old(`/products?limit=200&offset=${offset}`);
    products.push(...page.products);
    if (page.products.length < 200) break;
  }

  if (step("meta") && !DRY) await ensureDefinitions();
  let collectionIds = new Map();
  if (step("collections")) collectionIds = await migrateCollections(collections);
  else if (!DRY) for (const c of [...collections, { handle: "all-sets" }]) collectionIds.set(c.handle, await collectionId(c.handle));
  if (step("products")) {
    const productIds = await migrateProducts(products, site, collectionIds);
    if (!DRY) await orderCollections(collections, productIds, collectionIds);
  }
  if (step("articles")) await migrateArticles();
  if (step("faqs")) await migrateFaqs();
  if (step("reviews")) await migrateReviews();
  if (step("discounts")) await migrateDiscounts(site, collectionIds);
  if (step("subscribers")) await migrateSubscribers();
  log("\nDone.");
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
