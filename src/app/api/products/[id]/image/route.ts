import { accountApi, relay, unreachable } from "@/lib/server/account";

/** Product photo from the store (public; the URL carries ?v=<updatedAt>, so it can be cached). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await accountApi(`/products/${encodeURIComponent(id)}/image`).catch(unreachable);
  if (!res?.ok || !res.body) return relay(res);
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
