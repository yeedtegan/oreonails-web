import { NextResponse } from "next/server";
import { accountApi, getSessionToken, relay, unreachable } from "@/lib/server/account";

/** Image of a design in the account cart (to show it on a device that doesn't have it yet). */
export async function GET(_req: Request, { params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  const session = await getSessionToken();
  if (!session) return NextResponse.json({ error: "Please sign in to see your cart." }, { status: 401 });
  const res = await accountApi(`/account/cart/${encodeURIComponent(designId)}/image`, { session }).catch(unreachable);
  if (!res?.ok || !res.body) return relay(res);
  return new Response(res.body, {
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/octet-stream", "Cache-Control": "private, no-store" },
  });
}
