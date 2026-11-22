import { NextResponse } from "next/server";
import { accountApi, clearSessionCookie, getSessionToken, unreachable } from "@/lib/server/account";

export async function POST() {
  const session = await getSessionToken();
  if (session) await accountApi("/account/logout", { method: "POST", session }).catch(unreachable);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
