"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/data";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { Badge, Empty, ErrorNote, PageHeader, Table, dateTime, inputCls, money } from "@/components/admin/ui";

const STATUSES = ["Processing", "In production", "Shipped", "Delivered", "Cancelled"];

function OrdersInner() {
  const params = useSearchParams();
  const { call, notify } = useAdmin();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [query, setQuery] = useState(q);
  const [open, setOpen] = useState<string | null>(params.get("q"));
  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // "abandoned" = checkouts that were started but never paid (Shopify's Abandoned checkouts).
  const abandoned = status === "abandoned";
  const path = `/orders?${new URLSearchParams({ ...(abandoned ? { payment: "pending" } : status && { status }), ...(query && { q: query }) })}`;
  const { data, setData, error, loading } = useAdminData<{ orders: Order[] }>(path);

  const update = async (o: Order, next: string) => {
    try {
      const res = await call<{ order: Order }>(`/orders/${o.number}`, { method: "PATCH", body: { status: next } });
      setData((d) => d && { orders: d.orders.map((x) => (x.number === o.number ? res.order : x)) });
      notify(`#${o.number} marked ${next}`);
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Orders" subtitle="Update an order's status and the customer sees it on Track Order." />
      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...STATUSES, "abandoned"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`h-9 rounded-full px-4 text-[13.5px] font-semibold ${status === s ? "bg-plum text-white" : "bg-white text-plum border border-[#ebe4e9]"}`}>
            {s === "abandoned" ? "Abandoned checkouts" : s || "All"}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, email or name" className={`${inputCls} ml-auto h-9 max-w-xs`} />
      </div>
      <ErrorNote>{error}</ErrorNote>
      {data && data.orders.length === 0 ? (
        <Empty>{loading ? "Loading…" : "No orders match."}</Empty>
      ) : (
        <Table head={["Order", "Customer", "Date", "Items", "Total", abandoned ? "Payment" : "Status"]}>
          {data?.orders.map((o) => (
            <Fragment key={o.number}>
              <tr className="cursor-pointer hover:bg-[#fcfafb]" onClick={() => setOpen(open === o.number ? null : o.number)}>
                <td className="px-4 py-3 font-semibold">#{o.number}</td>
                <td className="px-4 py-3">{o.name}<span className="block text-[12.5px] text-muted">{o.email}</span></td>
                <td className="px-4 py-3 text-muted">{dateTime(o.createdAt)}</td>
                <td className="px-4 py-3">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td className="px-4 py-3 font-semibold">{money(o.total)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {abandoned ? <Badge>Not paid</Badge> : <select value={o.status} onChange={(e) => update(o, e.target.value)} className="h-8 rounded-lg border border-[#ddd5db] bg-white px-2 text-[13px]">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>}
                </td>
              </tr>
              {open === o.number && (
                <tr className="bg-[#fcfafb]">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                      <ul className="space-y-1.5 text-[13.5px]">
                        {o.items.map((i, k) => (
                          <li key={k} className="flex justify-between gap-4">
                            <span>
                              {i.qty} × <b>{i.title}</b> {[i.size, i.shape].filter(Boolean).join(" / ")}
                              {i.customSizes && <span className="text-muted"> · {i.customSizes}</span>}
                            </span>
                            <span>{money(i.unitPrice * i.qty)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-1 text-[13px]">
                        <p className="flex justify-between"><span>Subtotal</span><span>{money(o.subtotal)}</span></p>
                        {o.promoDiscount > 0 && <p className="flex justify-between"><span>Mix &amp; match</span><span>−{money(o.promoDiscount)}</span></p>}
                        {o.codeDiscount > 0 && <p className="flex justify-between"><span>Code {o.code}</span><span>−{money(o.codeDiscount)}</span></p>}
                        <p className="flex justify-between"><span>Shipping</span><span>{o.shipping ? money(o.shipping) : "Free"}</span></p>
                        <p className="flex justify-between font-bold"><span>Total</span><span>{money(o.total)}</span></p>
                        {o.shippingMethod && <p className="pt-2 text-muted">{o.shippingMethod}</p>}
                        <p className="pt-2 text-muted">Ship to: {o.address}{o.phone && ` · ${o.phone}`}</p>
                        <p className="text-muted">
                          Payment: {o.paymentStatus === "pending" ? "not completed" : o.paymentDetail ?? "Card"}
                          {o.paidAt && ` · ${dateTime(o.paidAt)}`}
                        </p>
                        {o.acceptsMarketing && <p className="text-muted">Subscribed to emails at checkout</p>}
                        <p className="pt-1"><Badge>{abandoned ? "Not paid" : o.status}</Badge></p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </Table>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
