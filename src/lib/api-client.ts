// Browser-side API calls. Requests go to same-origin /api/*, which next.config.ts rewrites to the API server.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: { error?: string; fields?: Record<string, string[]>; problems?: { key: string; error: string }[] },
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "Can't reach the store server. Please try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldMsg = data?.fields ? Object.entries(data.fields as Record<string, string[]>).map(([k, v]) => `${k}: ${v[0]}`).join(", ") : "";
    throw new ApiError(res.status, data?.error && fieldMsg ? `${data.error} (${fieldMsg})` : data?.error ?? `Request failed (${res.status})`, data);
  }
  return data as T;
}
