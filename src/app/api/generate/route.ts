import { NextResponse } from "next/server";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_PROMPT, MORE_STYLES, STYLES } from "@/lib/constants";
import { accountApi } from "@/lib/server/account";
import { BUSY, NO_STORE, REJECTED, UNAVAILABLE } from "@/lib/server/generateErrors";

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

/**
 * Refining an existing design: change only what the customer asked for.
 * `lengthen` (Quick Add): nails 6–10 mm past the fingertips, so the added details have room
 * instead of squeezing them onto the current short nails.
 */
function buildEditPrompt(instruction: string, lengthen: boolean) {
  return [
    "This photo shows a hand with a manicure. Edit ONLY the nails according to this request:",
    `${instruction}.`,
    lengthen &&
      "Also set the nail length: on every nail the free edge must extend 6–10 mm (about 1/4 to 3/8 inch) past the fingertip, like medium-length press-on / acrylic extensions — lengthen nails that are shorter than that and shorten nails that are longer, keeping all nails a natural, consistent length for each finger. Keep the same nail shape and design, and spread the added details across the full length of each nail so they are not crowded.",
    "Keep the rest of the current nail design as it is unless the request changes it.",
    "Keep the hand, skin tone, pose, framing, lighting and background exactly the same.",
    "Photorealistic, high detail, salon quality.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const image = form.get("image");
  const prompt = String(form.get("prompt") ?? "").trim();
  const styles = form.getAll("styles").map(String);
  const mode = form.get("mode") === "edit" ? "edit" : "create";
  const lengthen = form.get("lengthen") === "1";

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

  // generation takes minutes: oreonails-api runs it as a background job and the browser polls
  // GET /api/generate/<jobId> (short requests — fine on Workers, and leaving the page doesn't lose it)
  const finalPrompt = mode === "edit" ? buildEditPrompt(prompt, lengthen) : buildPrompt(prompt, styles);
  const upstreamForm = new FormData();
  upstreamForm.append("image", image, image.name || "hand.png");
  upstreamForm.append("prompt", finalPrompt);
  const res = await accountApi("/generate-image/jobs", { method: "POST", body: upstreamForm }).catch((err) => {
    console.error("[generate] image API unreachable:", err);
    return null;
  });
  if (!res) return NextResponse.json({ error: UNAVAILABLE, retryable: true }, { status: 503, headers: NO_STORE });
  const data = (await res.json().catch(() => ({}))) as { jobId?: string; error?: string };
  if (res.status === 202 && data.jobId) {
    return NextResponse.json({ jobId: data.jobId }, { status: 202, headers: NO_STORE });
  }
  console.error("[generate] image API refused the job", res.status, data.error ?? "");
  if (res.status === 429 || res.status >= 500) {
    return NextResponse.json({ error: BUSY, retryable: true }, { status: 503, headers: NO_STORE });
  }
  return NextResponse.json({ error: REJECTED, retryable: false }, { status: 422, headers: NO_STORE });
}
