import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Accounts + orders live on the image-generation server (oreonails-api: /account/*, /webhooks/whop). The browser only
 * talks to this Next app; these helpers forward to that server with its token and the customer's session.
 */
const API_URL = process.env.IMAGE_API_URL ?? "http://127.0.0.1:8791";
/** Same value as IMAGE_API_TOKEN on oreonails-api (required when it listens beyond 127.0.0.1). */
const API_TOKEN = process.env.IMAGE_API_TOKEN ?? "";

export const SESSION_COOKIE = "oreo_session";

export type PublicUser = { id: string; email: string; name: string; picture: string | null; role?: "user" | "admin" };

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** fetch to oreonails-api with the server token (+ the customer's session when given). */
export async function accountApi(path: string, init: RequestInit & { session?: string } = {}): Promise<Response> {
  const { session, headers, ...rest } = init;
  const h = new Headers(headers);
  if (API_TOKEN) h.set("Authorization", `Bearer ${API_TOKEN}`);
  if (session) h.set("X-User-Session", session);
  return fetch(new URL(path, API_URL), { ...rest, headers: h, cache: "no-store" });
}

/** Pass the API's JSON answer through; unreachable server → 503 with a friendly message. */
export async function relay(res: Response | null): Promise<NextResponse> {
  if (!res) {
    return NextResponse.json({ error: "Our store is unavailable right now. Please try again in a few minutes." }, { status: 503 });
  }
  const text = await res.text().catch(() => "");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // not oreonails-api talking (e.g. a Cloudflare error page: tunnel down 502/530, timeout 524) — log what it was
    console.error(`[account] non-JSON answer from oreonails-api: ${res.status} ${res.url}`, text.slice(0, 300));
    const down = res.status >= 500;
    return NextResponse.json(
      { error: down ? "Our store is unavailable right now. Please try again in a few minutes." : "Unexpected answer from our store." },
      { status: down ? 503 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(data, { status: res.status, headers: { "Cache-Control": "no-store" } });
}

export const unreachable = (err: unknown) => {
  console.error("[account] oreonails-api unreachable:", err);
  return null;
};
