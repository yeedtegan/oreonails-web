import { NextResponse } from "next/server";
import { createMetaobject } from "@/lib/shopify/admin";
import { EMAIL_RE, fail, readJson, str } from "../_lib";

/**
 * POST /api/contact { name, email, phone?, topic, message, ...extra } — saved as a "contact_message" metaobject,
 * visible in Shopify admin under Content → Metaobjects. Extra fields (custom-design form) go into `meta`.
 */
export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b) return fail(400, "Invalid request");
  const KNOWN = ["name", "email", "phone", "topic", "message"];
  const rest = Object.fromEntries(Object.entries(b).filter(([k]) => !KNOWN.includes(k)));
  const name = str(b.name);
  const email = str(b.email);
  const phone = str(b.phone);
  const topic = str(b.topic);
  const message = str(b.message);

  const fields: Record<string, string[]> = {};
  if (!name || name.length > 120) fields.name = ["Name is required"];
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) fields.email = ["Enter a valid email"];
  if (!topic || topic.length > 80) fields.topic = ["Choose a topic"];
  if (!message || message.length > 5000) fields.message = ["Message is required"];
  if (phone && phone.length > 40) fields.phone = ["Phone is too long"];
  if (Object.keys(fields).length) return fail(400, "Please check the form", fields);

  try {
    await createMetaobject(
      "contact_message",
      {
        name,
        email,
        phone,
        topic,
        message,
        meta: Object.keys(rest).length ? JSON.stringify(rest).slice(0, 4000) : undefined,
        received_at: new Date().toISOString(),
      },
      true,
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("contact submit failed", e);
    return fail(502, "We couldn't send your message. Please email us instead.");
  }
}
