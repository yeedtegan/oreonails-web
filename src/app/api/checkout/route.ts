import { NextResponse } from "next/server";
import { accountApi, getSessionToken, relay, unreachable } from "@/lib/server/account";

/**
 * Checkout the cart: multipart { images[] (design PNGs from the cart), designIds[] } → the store creates the order
 * (prices set server-side) and a Whop checkout → { order, purchaseUrl }; the browser then goes to purchaseUrl.
 * Whop sends the customer back to /checkout/result?order=<id>.
 */
export async function POST(req: Request) {
  const session = await getSessionToken();
  if (!session) return NextResponse.json({ error: "Please sign in with Google to check out." }, { status: 401 });

  const form = await req.formData();
  // Public address of this site (behind a proxy request.url may be internal): SITE_URL wins.
  const origin = (process.env.SITE_URL ?? new URL(req.url).origin).replace(/\/+$/, "");
  form.set("returnUrl", `${origin}/checkout/result?order={orderId}`);

  const res = await accountApi("/account/orders", { method: "POST", body: form, session }).catch(unreachable);
  return relay(res);
}
