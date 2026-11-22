import { NextResponse } from "next/server";
import { getJob } from "@/lib/server/jobs";

/**
 * Poll a design job started by POST /api/generate.
 * 202 { status: "running" } · 200 image bytes · 4xx/5xx { error, retryable } · 404 unknown/expired job
 */
export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getJob(jobId);
  const noStore = { "Cache-Control": "no-store" };

  if (!job) {
    return NextResponse.json(
      { error: "This design was interrupted before it finished. Please try again.", retryable: true, gone: true },
      { status: 404, headers: noStore },
    );
  }
  if (job.status === "running") {
    return NextResponse.json({ status: "running" }, { status: 202, headers: noStore });
  }
  if (job.status === "error") {
    return NextResponse.json({ error: job.error, retryable: job.retryable }, { status: job.httpStatus, headers: noStore });
  }

  // only forward what the browser needs (not upstream session headers)
  const headers: Record<string, string> = { "Content-Type": job.contentType, ...noStore };
  headers["X-Job-Id"] = job.upstreamJobId ?? jobId;
  return new Response(new Uint8Array(job.body), { status: 200, headers });
}
