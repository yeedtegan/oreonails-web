import http from "node:http";
import https from "node:https";
import { NextResponse } from "next/server";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_PROMPT, MORE_STYLES, STYLES } from "@/lib/constants";
import { startJob, type JobResult } from "@/lib/server/jobs";

/** Image-generation service: POST /generate-image, multipart { image, prompt } → image bytes. */
const IMAGE_API_URL = process.env.IMAGE_API_URL ?? "http://127.0.0.1:8791";
/** Same as IMAGE_API_TOKEN on oreonails-api (required by it when it listens beyond 127.0.0.1). */
const IMAGE_API_TOKEN = process.env.IMAGE_API_TOKEN ?? "";
/** Generation takes a few minutes; Node's fetch gives up on headers after 5 min, so use node:http. */
const UPSTREAM_TIMEOUT_MS = 10 * 60 * 1000;

const STYLE_LABELS = new Map([...STYLES, ...MORE_STYLES].map((s) => [s.id as string, s.label]));

function buildPrompt(userPrompt: string, styles: string[]) {
  const styleText = styles
    .map((s) => STYLE_LABELS.get(s))
    .filter(Boolean)
    .join(", ");
  return [
    "Edit this photo of a hand: apply a professional manicure nail design to the fingernails.",
    userPrompt && `Design request: ${userPrompt}.`,
    styleText && `Nail style: ${styleText}.`,
    "Keep the hand, skin tone, pose, framing, lighting and background exactly the same — only change the nails.",
    "Photorealistic, high detail, salon quality.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Refining an existing design: change only what the customer asked for. */
function buildEditPrompt(instruction: string) {
  return [
    "This photo shows a hand with a manicure. Edit ONLY the nails according to this request:",
    `${instruction}.`,
    "Keep the rest of the current nail design as it is unless the request changes it.",
    "Keep the hand, skin tone, pose, framing, lighting and background exactly the same.",
    "Photorealistic, high detail, salon quality.",
  ].join(" ");
}

type Upstream = { status: number; contentType: string; jobId?: string; body: Buffer };

async function callImageApi(image: File, prompt: string): Promise<Upstream> {
  const form = new FormData();
  form.append("image", image, image.name || "hand.png");
  form.append("prompt", prompt);
  // let the platform encode the multipart body + boundary for us
  const encoded = new Request("http://localhost", { method: "POST", body: form });
  const payload = Buffer.from(await encoded.arrayBuffer());

  const url = new URL("/generate-image", IMAGE_API_URL);
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": encoded.headers.get("content-type")!,
          "Content-Length": payload.length,
          ...(IMAGE_API_TOKEN ? { Authorization: `Bearer ${IMAGE_API_TOKEN}` } : {}),
        },
        timeout: UPSTREAM_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 502,
            contentType: String(res.headers["content-type"] ?? ""),
            jobId: res.headers["x-job-id"] as string | undefined,
            body: Buffer.concat(chunks),
          }),
        );
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end(payload);
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const image = form.get("image");
  const prompt = String(form.get("prompt") ?? "").trim();
  const styles = form.getAll("styles").map(String);
  const mode = form.get("mode") === "edit" ? "edit" : "create";

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "A hand photo is required." }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.includes(image.type)) {
    return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
  }
  if (image.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 413 });
  }
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json({ error: `Prompt must be ${MAX_PROMPT} characters or fewer.` }, { status: 400 });
  }
  if (mode === "edit" && !prompt) {
    return NextResponse.json({ error: "Tell us what you'd like to change." }, { status: 400 });
  }
  if (!prompt && styles.length === 0) {
    return NextResponse.json({ error: "Describe your design or choose a style." }, { status: 400 });
  }

  // generation takes minutes: run it as a background job the browser polls
  // (GET /api/generate/<jobId>), so leaving the page doesn't lose it
  const finalPrompt = mode === "edit" ? buildEditPrompt(prompt) : buildPrompt(prompt, styles);
  const jobId = startJob(() => generate(image, finalPrompt));
  return NextResponse.json({ jobId }, { status: 202, headers: { "Cache-Control": "no-store" } });
}

async function generate(image: File, prompt: string): Promise<JobResult> {
  let upstream: Upstream;
  try {
    upstream = await callImageApi(image, prompt);
  } catch (err) {
    const timedOut = err instanceof Error && err.message === "timeout";
    console.error("[generate] image API unreachable:", err);
    return {
      status: "error",
      httpStatus: timedOut ? 504 : 503,
      error: timedOut
        ? "Your design is taking longer than usual. Please try again in a few minutes."
        : "Our design studio is unavailable right now. Please try again in a few minutes.",
      retryable: true,
    };
  }

  if (upstream.status !== 200 || !upstream.contentType.startsWith("image/")) {
    let detail = "";
    try {
      detail = JSON.parse(upstream.body.toString("utf8")).error ?? "";
    } catch {}
    console.error("[generate] image API error", upstream.status, detail);
    // 5xx = the generator failed on its side (lost state, busy…): temporary, ask to retry later.
    // 4xx = it rejected this request: retrying the same photo will not help.
    const temporary = upstream.status >= 500 || upstream.status === 200;
    return temporary
      ? {
          status: "error",
          httpStatus: 503,
          error: "Our design studio is busy right now and couldn't finish your design. Please try again in a few minutes.",
          retryable: true,
        }
      : {
          status: "error",
          httpStatus: 422,
          error: "We couldn't create a design from this photo. Please try a clearer photo of your hand.",
          retryable: false,
        };
  }

  return { status: "done", contentType: upstream.contentType, body: upstream.body, upstreamJobId: upstream.jobId };
}
