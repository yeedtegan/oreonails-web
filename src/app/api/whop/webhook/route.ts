import { NextResponse } from "next/server";
import { accountApi, unreachable } from "@/lib/server/account";

/**
 * Whop webhook endpoint (set https://<site>/api/whop/webhook in the Whop dashboard, event payment.succeeded).
 * Forwards the RAW body + Standard Webhooks headers unchanged to oreonails-api, which verifies the signature
 * (so oreonails-api can stay private). Whop retries on non-2xx.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const headers: Record<string, string> = { "Content-Type": req.headers.get("content-type") ?? "application/json" };
  for (const name of ["webhook-id", "webhook-timestamp", "webhook-signature"]) {
    const v = req.headers.get(name);
    if (v) headers[name] = v;
  }
  const res = await accountApi("/webhooks/whop", { method: "POST", headers, body: raw }).catch(unreachable);
  if (!res) return NextResponse.json({ error: "store unavailable" }, { status: 503 });
  return new NextResponse(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
