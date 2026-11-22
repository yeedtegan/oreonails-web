import { NextResponse } from "next/server";
import { accountApi, clearSessionCookie, getSessionToken, relay, unreachable } from "@/lib/server/account";

/** The signed-in customer: { user } or { user: null }. */
export async function GET() {
  const session = await getSessionToken();
  const noStore = { "Cache-Control": "no-store" };
  if (!session) return NextResponse.json({ user: null }, { headers: noStore });
  const res = await accountApi("/account/me", { session }).catch(unreachable);
  if (res?.status === 401) {
    await clearSessionCookie(); // expired / signed out elsewhere
    return NextResponse.json({ user: null }, { headers: noStore });
  }
  return relay(res);
}
