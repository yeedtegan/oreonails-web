import { NextResponse } from "next/server";
import { admin, check } from "@/lib/shopify/admin";
import { SITE } from "@/lib/data";
import { EMAIL_RE, fail, readJson, str } from "../_lib";

const CONSENT = { marketingState: "SUBSCRIBED", marketingOptInLevel: "SINGLE_OPT_IN" };

/** POST /api/newsletter { email } — subscribes the email as a Shopify customer with email-marketing consent. */
export async function POST(req: Request) {
  const email = str((await readJson(req))?.email)?.toLowerCase();
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) return fail(400, "Please enter a valid email");

  try {
    const found = await admin<{ customers: { nodes: { id: string }[] } }>(`query($q: String!) { customers(first: 1, query: $q) { nodes { id } } }`, { q: `email:${JSON.stringify(email)}` });
    const existing = found.customers.nodes[0];
    if (existing) {
      const d = await admin<{ customerEmailMarketingConsentUpdate: { userErrors: { message: string }[] } }>(
        `mutation($input: CustomerEmailMarketingConsentUpdateInput!) { customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } } }`,
        { input: { customerId: existing.id, emailMarketingConsent: CONSENT } },
      );
      check(d.customerEmailMarketingConsentUpdate);
    } else {
      const d = await admin<{ customerCreate: { userErrors: { message: string }[] } }>(
        `mutation($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { message } } }`,
        { input: { email, emailMarketingConsent: CONSENT, tags: ["newsletter"] } },
      );
      check(d.customerCreate);
    }
    return NextResponse.json({ ok: true, code: SITE.welcomeCode });
  } catch (e) {
    console.error("newsletter signup failed", e);
    return fail(502, "We couldn't sign you up right now. Please try again.");
  }
}
