import { NextResponse } from "next/server";
import { accountApi, relay, setSessionCookie, unreachable } from "@/lib/server/account";

/** Sign in with Google: { credential } (ID token from the Google button) → session cookie + { user }. */
export async function POST(req: Request) {
  const { credential } = (await req.json().catch(() => ({}))) as { credential?: unknown };
  if (typeof credential !== "string" || !credential) {
    return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
  }
  const res = await accountApi("/account/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  }).catch(unreachable);
  if (!res?.ok) {
    if (res?.status === 401) {
      // keep the customer message generic, but log why oreonails-api rejected the token
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn("[auth/google] rejected by oreonails-api:", error ?? "(no reason)");
      return NextResponse.json({ error: "Google sign-in failed. Please try again." }, { status: 401 });
    }
    return relay(res);
  }
  const data = (await res.json()) as { sessionToken: string; expiresAt: string; user: unknown };
  await setSessionCookie(data.sessionToken, data.expiresAt);
  return NextResponse.json({ user: data.user }, { headers: { "Cache-Control": "no-store" } });
}
