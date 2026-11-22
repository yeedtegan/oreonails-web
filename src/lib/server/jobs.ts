/**
 * In-memory registry of design generations. A generation takes minutes, so the browser
 * starts a job, keeps its id, and polls for the result — if the customer leaves the page
 * and comes back, they pick the same job up again instead of losing it.
 *
 * Lives in this Node process (self-hosted `next start` / `next dev`). Not shared between
 * several server instances or serverless functions; a restart forgets running jobs (the
 * browser then shows "interrupted, try again").
 */

export type JobResult =
  | { status: "running" }
  | { status: "done"; contentType: string; body: Buffer; upstreamJobId?: string }
  | { status: "error"; httpStatus: number; error: string; retryable: boolean };

type Job = { result: JobResult; createdAt: number; finishedAt?: number };

/** how long a finished result can still be collected */
const KEEP_FINISHED_MS = 60 * 60 * 1000;
/** safety net for a job that never settles */
const MAX_RUNNING_MS = 20 * 60 * 1000;

// survive module reloads in dev
const g = globalThis as typeof globalThis & { __nailJobs?: Map<string, Job> };
const jobs = (g.__nailJobs ??= new Map<string, Job>());

function sweep(now = Date.now()) {
  for (const [id, job] of jobs) {
    const expired = job.finishedAt ? now - job.finishedAt > KEEP_FINISHED_MS : now - job.createdAt > MAX_RUNNING_MS;
    if (expired) jobs.delete(id);
  }
}

/** Starts `work` in the background and returns the job id right away. */
export function startJob(work: () => Promise<JobResult>): string {
  sweep();
  const id = crypto.randomUUID();
  const job: Job = { result: { status: "running" }, createdAt: Date.now() };
  jobs.set(id, job);
  work()
    .catch((err): JobResult => {
      console.error("[jobs] generation crashed:", err);
      return { status: "error", httpStatus: 500, error: "Something went wrong. Please try again.", retryable: true };
    })
    .then((result) => {
      job.result = result;
      job.finishedAt = Date.now();
    });
  return id;
}

export function getJob(id: string): JobResult | undefined {
  sweep();
  return jobs.get(id)?.result;
}
