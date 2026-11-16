import { NextResponse } from "next/server";
import { getProducts, getReviews } from "@/lib/shopify/storefront";
import { createMetaobject } from "@/lib/shopify/admin";
import { fail, num, readJson, str } from "../_lib";

/** GET /api/reviews?product=&rating=&limit=&offset= — approved reviews (Shopify "review" metaobjects) + summary. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    return NextResponse.json(await getReviews({ product: p.get("product") || undefined, rating: num(p.get("rating")), limit: num(p.get("limit")), offset: num(p.get("offset")) }));
  } catch (e) {
    return fail(502, (e as Error).message);
  }
}

/** POST /api/reviews — stored as a DRAFT metaobject; it shows on the site once approved (set Active) in Shopify admin. */
export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b) return fail(400, "Invalid request");
  const name = str(b.name);
  const body = str(b.body);
  const title = str(b.title);
  const handle = str(b.product);
  const variant = str(b.variant);
  const rating = Number(b.rating);

  const fields: Record<string, string[]> = {};
  if (!name || name.length > 80) fields.name = ["Name is required (max 80 characters)"];
  if (!body || body.length > 4000) fields.body = ["Review is required (max 4000 characters)"];
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fields.rating = ["Rating must be 1–5"];
  if (title && title.length > 120) fields.title = ["Title is too long"];
  if (Object.keys(fields).length) return fail(400, "Please check the form", fields);

  try {
    let productTitle: string | undefined;
    if (handle) {
      const [product] = await getProducts({ handles: [handle] });
      if (!product) return fail(400, "Unknown product");
      productTitle = product.title;
    }
    await createMetaobject(
      "review",
      {
        name,
        rating: String(rating),
        title: title || "Review",
        body,
        product_handle: handle,
        product_title: productTitle,
        variant,
        date: new Date().toISOString(),
      },
      false,
    );
    return NextResponse.json({ ok: true, pending: true }, { status: 201 });
  } catch (e) {
    console.error("review submit failed", e);
    return fail(502, "We couldn't save your review. Please try again.");
  }
}
