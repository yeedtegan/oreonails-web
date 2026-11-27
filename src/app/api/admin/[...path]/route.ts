import { NextResponse } from "next/server";
import { accountApi, getSessionToken, relay, unreachable } from "@/lib/server/account";

/**
 * Shop admin (/admin pages) → oreonails-api /admin/*, with the signed-in user's session. The API checks that the
 * account has role "admin"; this route only forwards. Images come back as bytes, everything else as JSON.
 */
type Ctx = { params: Promise<{ path: string[] }> };

async function forward(req: Request, { params }: Ctx) {
  const session = await getSessionToken();
  if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const { path } = await params;
  const target = `/admin/${path.map(encodeURIComponent).join("/")}${new URL(req.url).search}`;
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const headers = new Headers();
  const type = req.headers.get("content-type");
  if (hasBody && type) headers.set("Content-Type", type); // keeps the multipart boundary for image uploads
  const res = await accountApi(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    session,
  }).catch(unreachable);
  if (res?.ok && res.body && res.headers.get("content-type")?.startsWith("image/")) {
    return new Response(res.body, { headers: { "Content-Type": res.headers.get("content-type")!, "Cache-Control": "private, max-age=300" } });
  }
  return relay(res);
}

export const GET = forward;
export const PUT = forward;
