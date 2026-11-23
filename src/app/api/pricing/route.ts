import { NextResponse } from "next/server";
import { accountApi, relay, unreachable } from "@/lib/server/account";

/** Promo tiers, shipping fee, sizes… set by the store — the cart shows a preview with them. */
export async function GET() {
  const res = await accountApi("/pricing").catch(unreachable);
  if (!res?.ok) return relay(res);
  return NextResponse.json(await res.json(), { headers: { "Cache-Control": "public, max-age=300" } });
}
