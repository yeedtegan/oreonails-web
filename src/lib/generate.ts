"use client";

export class GenerationError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
  ) {
    super(message);
  }
}

export type DesignRequest =
  /** first design, from the customer's hand photo */
  | { mode: "create"; image: Blob; prompt: string; styles: string[] }
  /** refine an existing design with a chat instruction · `lengthen`: Quick Add — make the nails longer to fit the details */
  | { mode: "edit"; image: Blob; prompt: string; lengthen?: boolean };

const LOST = "Connection lost while creating your design. Please try again.";
const UNAVAILABLE = "Our design studio is unavailable right now. Please try again in a few minutes.";
const POLL_MS = 3000;
/** stop waiting after this long without a single answer from our server */
const OFFLINE_GIVE_UP_MS = 2 * 60 * 1000;

async function errorFrom(res: Response): Promise<GenerationError> {
  const data = await res.json().catch(() => ({}));
  return new GenerationError(data.error ?? UNAVAILABLE, data.retryable ?? true);
}

/** Starts a generation on our server and returns its job id (the design itself takes minutes). */
export async function startDesign(req: DesignRequest): Promise<string> {
  const body = new FormData();
  body.append("mode", req.mode);
  body.append("image", req.image, req.image instanceof File ? req.image.name : "design.png");
  body.append("prompt", req.prompt.trim());
  if (req.mode === "create") req.styles.forEach((s) => body.append("styles", s));
  if (req.mode === "edit" && req.lengthen) body.append("lengthen", "1");

  let res: Response;
  try {
    res = await fetch("/api/generate", { method: "POST", body });
  } catch {
    throw new GenerationError(LOST, true);
  }
  if (!res.ok) throw await errorFrom(res);
  const { jobId } = await res.json().catch(() => ({}));
  if (!jobId) throw new GenerationError(UNAVAILABLE, true);
  return jobId as string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Waits for a job started with startDesign — also one started before a page reload.
 * Network hiccups (tab in background, page restored from the back/forward cache, flaky
 * wifi) are retried; only a real answer from the server ends the wait.
 */
export async function waitForDesign(jobId: string): Promise<{ id: string; blob: Blob }> {
  let lastContact = Date.now();
  for (;;) {
    let res: Response | null = null;
    try {
      res = await fetch(`/api/generate/${encodeURIComponent(jobId)}`, { cache: "no-store" });
    } catch {
      // network error — handled below
    }
    // our server answered but couldn't reach the design studio for a moment: same as being offline
    if (res?.status === 503 && (await res.clone().json().catch(() => ({}))).offline) res = null;
    if (res) {
      lastContact = Date.now();
      if (res.status === 202) {
        // still generating
      } else if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
        try {
          return { id: res.headers.get("x-job-id") ?? jobId, blob: await res.blob() };
        } catch {
          // body cut off: ask again, the result is kept on the server
        }
      } else {
        throw await errorFrom(res);
      }
    } else if (Date.now() - lastContact > OFFLINE_GIVE_UP_MS) {
      throw new GenerationError(LOST, true);
    }
    await sleep(POLL_MS);
  }
}
