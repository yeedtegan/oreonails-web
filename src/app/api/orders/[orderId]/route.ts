import { NextResponse } from "next/server";
import { accountApi, getSessionToken, relay, unreachable } from "@/lib/server/account";

/** Status of one of the customer's orders: { order } (status pending | paid | failed). */
export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await getSessionToken();
  if (!session) return NextResponse.json({ error: "Please sign in to see your order." }, { status: 401 });
  const res = await accountApi(`/account/orders/${encodeURIComponent(orderId)}`, { session }).catch(unreachable);
  return relay(res);
}
