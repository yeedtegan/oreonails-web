import { NextResponse } from "next/server";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_HISTORY, MAX_PROMPT, MAX_REFS, MORE_STYLES, STYLES } from "@/lib/constants";
import { accountApi } from "@/lib/server/account";
import { BUSY, NO_HAND, NO_STORE, REJECTED, UNAVAILABLE } from "@/lib/server/generateErrors";

const STYLE_LABELS = new Map([...STYLES, ...MORE_STYLES].map((s) => [s.id as string, s.label]));

/**
 * Nail length, for every generation: a length the customer asks for wins; otherwise the free edge is 6–10 mm.
 * Edits without a length take the one from the latest earlier request that gave one (sent as `history`);
 * if none did, the current length is kept and only nails still at natural length get the default.
 */
const LENGTH_RULE = {
  create:
    "Nail length: if the design request says how long the nails should be or how far they extend past the fingertip, follow it exactly. Otherwise make the free edge of every nail extend 6–10 mm (about 1/4 to 3/8 inch) past the fingertip, like medium-length press-on / acrylic extensions, with a natural, consistent length for each finger.",
  edit:
    "Nail length: if this request says how long the nails should be or how far they extend past the fingertip (including longer / shorter), follow it exactly. Otherwise, if an earlier request listed below asked for a nail length, keep the nails at that length (the most recent one asked for) — even if it is short. Otherwise keep the current length, except nails at natural length (free edge shorter than 6 mm past the fingertip), which get extended to 6–10 mm (about 1/4 to 3/8 inch) like medium-length press-on / acrylic extensions. Keep a natural, consistent length for each finger.",
};
const SPREAD = "Spread any added details across the full length of each nail so they are not crowded.";

/** the customer's reference photos come after the photo to edit (oreonails-api keeps that order) */
const refsNote = (n: number) =>
  n > 0 &&
  `The first image is the photo to edit. The other ${n === 1 ? "image is a reference photo" : `${n} images are reference photos`} from the customer: use ${n === 1 ? "it" : "them"} only as inspiration for the nail colors, patterns, art and details — do not copy their hands, skin, background or framing, and do not add them to the result.`;
/** a request with reference photos only */
const REFS_ONLY = "Recreate the nail design from the reference photos (colors, patterns, art and details)";

function buildPrompt(userPrompt: string, styles: string[], refs: number) {
  const styleText = styles
    .map((s) => STYLE_LABELS.get(s))
    .filter(Boolean)
    .join(", ");
  return [
    "Edit this photo of a hand: apply a professional manicure nail design to the fingernails.",
    refsNote(refs),
    (userPrompt || refs > 0) && `Design request: ${userPrompt || REFS_ONLY}.`,
    styleText && `Nail style: ${styleText}.`,
    LENGTH_RULE.create,
    "Keep the hand, skin tone, pose, framing, lighting and background exactly the same — only change the nails.",
    "Photorealistic, high detail, salon quality.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Refining an existing design: change only what the customer asked for. */
function buildEditPrompt(instruction: string, history: string[], refs: number) {
  return [
    "This photo shows a hand with a manicure. Edit ONLY the nails according to this request:",
    `${instruction || REFS_ONLY}.`,
    refsNote(refs),
    history.length > 0 &&
      `Earlier requests that led to this design (oldest first, already applied — for context only): ${history.map((h) => `"${h}"`).join("; ")}.`,
    LENGTH_RULE.edit,
    SPREAD,
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
  const history = form
    .getAll("history")
    .map((h) => String(h).replace(/\s+/g, " ").trim().slice(0, MAX_PROMPT))
    .filter(Boolean)
    .slice(-MAX_HISTORY);

  const refs = form.getAll("refs").filter((r): r is File => r instanceof File && r.size > 0);
  if (refs.length > MAX_REFS) {
    return NextResponse.json({ error: `Attach up to ${MAX_REFS} reference photos.` }, { status: 400 });
  }
  if (refs.some((r) => !ACCEPTED_TYPES.includes(r.type))) {
    return NextResponse.json({ error: "Reference photos must be JPG, PNG or WEBP." }, { status: 400 });
  }
  if (refs.some((r) => r.size > MAX_FILE_BYTES)) {
    return NextResponse.json({ error: "Each reference photo must be 10 MB or smaller." }, { status: 413 });
  }

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
  if (mode === "edit" && !prompt && !refs.length) {
    return NextResponse.json({ error: "Tell us what you'd like to change." }, { status: 400 });
  }
  if (!prompt && styles.length === 0 && !refs.length) {
    return NextResponse.json({ error: "Describe your design or choose a style." }, { status: 400 });
  }

  // generation takes minutes: oreonails-api runs it as a background job and the browser polls
  // GET /api/generate/<jobId> (short requests — fine on Workers, and leaving the page doesn't lose it)
  const finalPrompt = mode === "edit" ? buildEditPrompt(prompt, history, refs.length) : buildPrompt(prompt, styles, refs.length);
  const upstreamForm = new FormData();
  upstreamForm.append("image", image, image.name || "hand.png");
  refs.forEach((r, i) => upstreamForm.append("refs", r, r.name || `ref-${i + 1}.jpg`));
  upstreamForm.append("prompt", finalPrompt);
  // the customer's own photo (not one of our designs): the API checks there is a hand in it first
  if (mode === "create") upstreamForm.append("checkHand", "1");
  const res = await accountApi("/generate-image/jobs", { method: "POST", body: upstreamForm }).catch((err) => {
    console.error("[generate] image API unreachable:", err);
    return null;
  });
  if (!res) return NextResponse.json({ error: UNAVAILABLE, retryable: true }, { status: 503, headers: NO_STORE });
  const data = (await res.json().catch(() => ({}))) as { jobId?: string; error?: string; code?: string };
  if (res.status === 202 && data.jobId) {
    return NextResponse.json({ jobId: data.jobId }, { status: 202, headers: NO_STORE });
  }
  if (data.code === "no_hand") {
    return NextResponse.json({ error: NO_HAND, retryable: false, code: "no_hand" }, { status: 422, headers: NO_STORE });
  }
  console.error("[generate] image API refused the job", res.status, data.error ?? "");
  if (res.status === 429 || res.status >= 500) {
    return NextResponse.json({ error: BUSY, retryable: true }, { status: 503, headers: NO_STORE });
  }
  return NextResponse.json({ error: REJECTED, retryable: false }, { status: 422, headers: NO_STORE });
}
