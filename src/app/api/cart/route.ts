import { NextResponse } from "next/server";
import { accountApi, getSessionToken, relay, unreachable } from "@/lib/server/account";

/** The signed-in customer's cart: { items: [{ designId, sessionId, price, addedAt }] }. */
export async function GET() {
  const session = await getSessionToken();
  if (!session) return NextResponse.json({ error: "Please sign in to see your cart." }, { status: 401 });
  const res = await accountApi("/account/cart", { session }).catch(unreachable);
  return relay(res);
}
