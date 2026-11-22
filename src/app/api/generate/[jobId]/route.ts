import { NextResponse } from "next/server";
import { accountApi } from "@/lib/server/account";
import { BUSY, INTERRUPTED, NO_STORE, REJECTED } from "@/lib/server/generateErrors";

/**
 * Poll a design job started by POST /api/generate (the job runs on oreonails-api).
 * 202 { status: "running" } · 200 image bytes · 4xx/5xx { error, retryable } · 404 unknown/expired job
 * · 503 { offline: true } when oreonails-api can't be reached for a moment (the browser keeps polling).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const res = await accountApi(`/generate-image/jobs/${encodeURIComponent(jobId)}`).catch(() => null);

  if (!res || (res.status >= 520 && res.status <= 530)) {
    // network / Cloudflare tunnel hiccup (52x) — not an answer about the job
    return NextResponse.json({ offline: true }, { status: 503, headers: { ...NO_STORE, "Retry-After": "3" } });
  }
  if (res.status === 202) return NextResponse.json({ status: "running" }, { status: 202, headers: NO_STORE });

  const type = res.headers.get("content-type") ?? "";
  if (res.ok && type.startsWith("image/") && res.body) {
    // only forward what the browser needs (not upstream session headers)
    return new Response(res.body, {
      status: 200,
      headers: { "Content-Type": type, "X-Job-Id": res.headers.get("x-job-id") ?? jobId, ...NO_STORE },
    });
  }

  const { error } = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 404 || res.status === 400) {
    return NextResponse.json({ error: INTERRUPTED, retryable: true, gone: true }, { status: 404, headers: NO_STORE });
  }
  console.error("[generate] job failed", jobId, res.status, error ?? "");
  // 5xx = the generator failed on its side: temporary. 4xx = it rejected this request: retrying won't help.
  return res.status >= 500
    ? NextResponse.json({ error: BUSY, retryable: true }, { status: 503, headers: NO_STORE })
    : NextResponse.json({ error: REJECTED, retryable: false }, { status: 422, headers: NO_STORE });
}
