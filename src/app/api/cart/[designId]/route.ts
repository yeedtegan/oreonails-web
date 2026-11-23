import { NextResponse } from "next/server";
import { accountApi, getSessionToken, relay, unreachable } from "@/lib/server/account";

type Ctx = { params: Promise<{ designId: string }> };

const signIn = () => NextResponse.json({ error: "Please sign in to save your cart." }, { status: 401 });

/** Add a design to the account cart (also used to merge the guest cart after sign-in): multipart { image, sessionId, addedAt? }. */
export async function PUT(req: Request, { params }: Ctx) {
  const { designId } = await params;
  const session = await getSessionToken();
  if (!session) return signIn();
  const body = await req.formData();
  const res = await accountApi(`/account/cart/${encodeURIComponent(designId)}`, { method: "PUT", body, session }).catch(unreachable);
  return relay(res);
}

/** Change quantity / size / length of a design in the account cart: JSON { quantity, size, length }. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { designId } = await params;
  const session = await getSessionToken();
  if (!session) return signIn();
  const res = await accountApi(`/account/cart/${encodeURIComponent(designId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
    session,
  }).catch(unreachable);
  return relay(res);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { designId } = await params;
  const session = await getSessionToken();
  if (!session) return signIn();
  const res = await accountApi(`/account/cart/${encodeURIComponent(designId)}`, { method: "DELETE", session }).catch(unreachable);
  return relay(res);
}
