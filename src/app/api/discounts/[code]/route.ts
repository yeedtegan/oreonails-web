import { accountApi, relay, unreachable } from "@/lib/server/account";

/** Is this discount code valid? → { code, percent } or 404. The store checks it again when the order is placed. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const res = await accountApi(`/discounts/${encodeURIComponent(code.slice(0, 40))}`).catch(unreachable);
  return relay(res);
}
