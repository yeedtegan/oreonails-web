import { NextResponse } from "next/server";
import { accountApi, getSessionToken, relay, unreachable } from "@/lib/server/account";

type Ctx = { params: Promise<{ productId: string }> };

const signIn = () => NextResponse.json({ error: "Please sign in to save your cart." }, { status: 401 });

/** Put a Shop product in the account cart / change it: JSON { quantity, size?, length?, addedAt? }. */
export async function PUT(req: Request, { params }: Ctx) {
  const { productId } = await params;
  const session = await getSessionToken();
  if (!session) return signIn();
  const res = await accountApi(`/account/cart/products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
    session,
  }).catch(unreachable);
  return relay(res);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { productId } = await params;
  const session = await getSessionToken();
  if (!session) return signIn();
  const res = await accountApi(`/account/cart/products/${encodeURIComponent(productId)}`, { method: "DELETE", session }).catch(unreachable);
  return relay(res);
}
