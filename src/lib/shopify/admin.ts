// Shopify Admin API — server only. Used by route handlers for things the Storefront API can't write:
// review submissions, newsletter sign-ups and contact messages.
//
// Auth: an app from the Dev Dashboard installed on the store (SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET) — tokens are
// fetched with the client-credentials grant and refreshed before they expire. A static SHOPIFY_ADMIN_TOKEN (legacy
// custom app, "shpat_…") also works.
import "server-only";
import { SHOPIFY_API_VERSION, SHOPIFY_STORE_DOMAIN } from "./config";

const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
const STATIC_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";

export const adminConfigured = () => !!(SHOPIFY_STORE_DOMAIN && ((CLIENT_ID && CLIENT_SECRET) || STATIC_TOKEN));

let cached: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

async function adminToken(): Promise<string> {
  if (!(CLIENT_ID && CLIENT_SECRET)) return STATIC_TOKEN;
  if (cached && cached.expiresAt - 5 * 60_000 > Date.now()) return cached.token;
  inflight ??= (async () => {
    const res = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
    if (!res.ok || !json?.access_token) throw new Error(`Shopify token exchange failed (${res.status})`);
    cached = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return json.access_token;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function admin<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!adminConfigured()) throw new Error("Shopify Admin API is not configured: set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.");
  const res = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await adminToken() },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (res.status === 401) cached = null; // revoked/expired early — fetch a fresh token next time
  const json = (await res.json().catch(() => null)) as { data?: T; errors?: unknown } | null;
  if (!res.ok || !json?.data || json.errors) throw new Error(`Shopify Admin request failed (${res.status}): ${JSON.stringify(json?.errors ?? "")}`);
  return json.data;
}

/** Throws when a mutation payload reports userErrors. */
export function check(payload: { userErrors?: { message: string; field?: string[] | null }[] }) {
  if (payload.userErrors?.length) throw new Error(payload.userErrors.map((e) => e.message).join("; "));
}

/** Creates a metaobject (e.g. a review or contact message). `active: false` keeps it hidden until approved in Shopify admin. */
export async function createMetaobject(type: string, fields: Record<string, string | undefined | null>, active: boolean) {
  const d = await admin<{ metaobjectCreate: { metaobject: { id: string } | null; userErrors: { message: string }[] } }>(
    `mutation($m: MetaobjectCreateInput!) { metaobjectCreate(metaobject: $m) { metaobject { id } userErrors { message field } } }`,
    {
      m: {
        type,
        fields: Object.entries(fields)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([key, value]) => ({ key, value: String(value) })),
        capabilities: { publishable: { status: active ? "ACTIVE" : "DRAFT" } },
      },
    },
  );
  check(d.metaobjectCreate);
  return d.metaobjectCreate.metaobject!.id;
}
