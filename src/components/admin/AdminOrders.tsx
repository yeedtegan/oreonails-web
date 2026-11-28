"use client";

import { useCallback, useEffect, useState } from "react";
import { CloseIcon } from "../icons";
import { titleCase } from "@/lib/shop";
import { adminFetch, dateTime, usd, type AdminOrder, type AdminOrderItem, type OrderStats, type OrderStatus, type ShippingAddress } from "./api";

const PAGE = 30;

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: "Đã thanh toán", className: "bg-[#eef7ef] text-[#2f6b39] border-[#bcd8bf]" },
  pending: { label: "Chờ thanh toán", className: "bg-[#fff6e5] text-[#8a5a00] border-[#f0d9a8]" },
  failed: { label: "Lỗi", className: "bg-wine/10 text-wine border-wine/30" },
};

const Badge = ({ status }: { status: OrderStatus }) => (
  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${STATUS[status].className}`}>{STATUS[status].label}</span>
);

const itemCount = (o: AdminOrder) => o.items.reduce((n, i) => n + i.quantity, 0);
const options = (i: AdminOrderItem) => [i.size, i.length && titleCase(i.length), i.shape && titleCase(i.shape)].filter(Boolean).join(" / ");

function itemImage(order: AdminOrder, i: AdminOrderItem): string | null {
  if (i.designId && i.image) return `/api/admin/orders/${encodeURIComponent(order.id)}/images/${encodeURIComponent(i.image)}`;
  if (i.productId) return `/api/admin/products/${encodeURIComponent(i.productId)}/image`;
  return null;
}

const recipient = (a: ShippingAddress) => [a.firstName, a.lastName].filter(Boolean).join(" ");
/** the address as the lines of a shipping label */
const labelLines = (a: ShippingAddress) =>
  [recipient(a), a.address1, a.address2, `${a.city}, ${a.state} ${a.zip}`.replace(/^, |,\s*$/g, "").trim(), a.country, a.phone].filter(
    (l): l is string => !!l && !!l.trim(),
  );
const METHOD = { standard: "Standard (thường)", express: "Express" } as const;

/** "Delivery" step of the customer's checkout: who / where to ship, and how */
function Delivery({ order }: { order: AdminOrder }) {
  const a = order.shippingAddress;
  const [copied, setCopied] = useState(false);
  const fields: [string, string | undefined][] = a
    ? [
        ["Người nhận", recipient(a)],
        ["Email", a.email || order.email],
        ["Điện thoại", a.phone],
        ["Địa chỉ", a.address1],
        ["Địa chỉ 2", a.address2],
        ["Thành phố", a.city],
        ["Bang / Tỉnh", a.state],
        ["ZIP / Mã bưu chính", a.zip],
        ["Quốc gia", a.country],
      ]
    : [];

  async function copy() {
    if (!a) return;
    try {
      await navigator.clipboard.writeText(labelLines(a).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }

  return (
    <section aria-labelledby="delivery-title" className="mt-4 rounded-2xl border border-line bg-ivory p-4 text-[14px]">
      <div className="flex items-center justify-between gap-3">
        <h3 id="delivery-title" className="font-semibold">
          Delivery
        </h3>
        {a && (
          <button type="button" onClick={copy} className="min-h-9 rounded-full border border-line bg-white px-3.5 text-[13px] hover:bg-pink-2">
            {copied ? "Đã copy ✓" : "Copy địa chỉ"}
          </button>
        )}
      </div>
      <p className="mt-1 text-cocoa-soft">
        Phương thức giao: <span className="text-cocoa">{order.shippingMethod ? METHOD[order.shippingMethod] : "—"}</span>
      </p>
      {a ? (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {fields
            .filter(([, v]) => v && v.trim())
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-cocoa-soft">{k}</dt>
                <dd className="min-w-0 font-medium break-words select-all">{v}</dd>
              </div>
            ))}
        </dl>
      ) : (
        <p className="mt-2 rounded-xl bg-[#fff6e5] px-3 py-2 text-[#8a5a00]">Đơn này không có địa chỉ giao hàng (tạo trước khi web có bước Delivery).</p>
      )}
    </section>
  );
}

function Detail({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  let designNo = 0;
  const row = "flex justify-between gap-3 py-1";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-cocoa/40" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="order-title" className="drawer-right absolute inset-y-0 right-0 flex w-full flex-col bg-cream tab:w-[min(600px,100%)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id="order-title" className="truncate text-[19px] font-semibold">
              Đơn {order.id}
            </h2>
            <p className="text-[13px] text-cocoa-soft">{dateTime(order.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-pink-2">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge status={order.status} />
            {order.paidAt && <span className="text-[13px] text-cocoa-soft">thanh toán lúc {dateTime(order.paidAt)}</span>}
          </div>
          {order.failureReason && <p className="mt-2 rounded-xl bg-wine/10 px-3.5 py-2 text-[14px] text-wine">Lý do lỗi: {order.failureReason}</p>}

          <section className="mt-4 rounded-2xl border border-line bg-ivory p-4 text-[14px]">
            <p>
              <span className="text-cocoa-soft">Khách: </span>
              <a href={`mailto:${order.email}`} className="font-medium underline">
                {order.email}
              </a>
            </p>
            {order.whopPaymentId && (
              <p className="mt-1">
                <span className="text-cocoa-soft">Mã thanh toán Whop: </span>
                {order.whopPaymentId}
              </p>
            )}
            {order.notes && (
              <p className="mt-2 rounded-xl bg-pink-2 px-3 py-2">
                <span className="font-medium">Ghi chú của khách:</span> {order.notes}
              </p>
            )}
          </section>

          <Delivery order={order} />

          <h3 className="mt-5 mb-2 font-semibold">Sản phẩm ({itemCount(order)})</h3>
          <ul className="space-y-2">
            {order.items.map((i, k) => {
              const name = i.designId ? `Custom design ${++designNo}` : (i.name ?? i.productId ?? "Sản phẩm");
              const src = itemImage(order, i);
              return (
                <li key={k} className="flex items-center gap-3 rounded-2xl border border-line bg-ivory p-2.5">
                  {src ? (
                    <a href={src} target="_blank" rel="noreferrer" title="Mở ảnh lớn" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin order image */}
                      <img src={src} alt="" className={`rounded-lg bg-[#fcf1eb] object-cover ${i.designId ? "h-20 w-20" : "h-12 w-[100px] mix-blend-multiply"}`} />
                    </a>
                  ) : (
                    <span className="h-12 w-[100px] shrink-0 rounded-lg bg-pink-2" />
                  )}
                  <div className="min-w-0 flex-1 text-[14px]">
                    <p className="font-medium">{name}</p>
                    <p className="text-cocoa-soft">
                      {options(i) || "—"} · {usd(i.price, order.currency)} × {i.quantity}
                    </p>
                    {i.designId && <p className="truncate text-[12px] text-cocoa-soft">design {i.designId}</p>}
                  </div>
                  <b className="font-semibold">{usd(i.price * i.quantity, order.currency)}</b>
                </li>
              );
            })}
          </ul>

          <section className="mt-4 rounded-2xl border border-line bg-ivory px-4 py-3 text-[14px]">
            <div className={row}>
              <span>Tiền hàng</span>
              <span>{usd(order.subtotal, order.currency)}</span>
            </div>
            {order.codeDiscount > 0 && (
              <div className={row}>
                <span>Mã giảm giá {order.discountCode}</span>
                <span className="text-[#2f6b39]">−{usd(order.codeDiscount, order.currency)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className={row}>
                <span>Khuyến mãi</span>
                <span className="text-[#2f6b39]">−{usd(order.discount, order.currency)}</span>
              </div>
            )}
            <div className={row}>
              <span>Phí ship{order.shippingMethod === "express" ? " (Express)" : order.shippingMethod === "standard" ? " (thường)" : ""}</span>
              <span>{order.shipping > 0 ? usd(order.shipping, order.currency) : "Miễn phí"}</span>
            </div>
            <div className={`${row} mt-1 border-t border-line pt-2 text-[16px] font-semibold`}>
              <span>Tổng</span>
              <span>{usd(order.total, order.currency)}</span>
            </div>
          </section>
          <p className="mt-3 text-[13px] text-cocoa-soft">Chi tiết thanh toán: tra trong Whop theo mã thanh toán hoặc email của khách.</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [stats, setStats] = useState<OrderStats>([]);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<AdminOrder | null>(null);

  /** one page of orders (older than `before`) with the current filter */
  const fetchPage = useCallback(
    (before?: string) => {
      const q = new URLSearchParams({ limit: String(PAGE) });
      if (status) q.set("status", status);
      if (before) q.set("before", before);
      return adminFetch<{ orders: AdminOrder[]; stats: OrderStats }>(`orders?${q}`);
    },
    [status],
  );

  /** another filter: empty the list until its orders arrive */
  function pickStatus(s: OrderStatus | "") {
    if (s === status) return;
    setStatus(s);
    setOrders(null);
    setError("");
  }

  useEffect(() => {
    let cancelled = false;
    fetchPage()
      .then((d) => {
        if (cancelled) return;
        setOrders(d.orders);
        setStats(d.stats);
        setMore(d.orders.length === PAGE);
      })
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : "Lỗi"));
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  async function loadMore() {
    if (!orders?.length) return;
    setLoadingMore(true);
    try {
      const d = await fetchPage(orders[orders.length - 1].createdAt);
      setOrders([...orders, ...d.orders.filter((o) => !orders.some((x) => x.id === o.id))]);
      setStats(d.stats);
      setMore(d.orders.length === PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoadingMore(false);
    }
  }

  const stat = (s: OrderStatus) => stats.find((x) => x.status === s) ?? { count: 0, total: 0 };
  const allCount = stats.reduce((n, s) => n + s.count, 0);

  return (
    <div>
      <h1 className="text-[26px] font-semibold">Đơn hàng</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 tab:grid-cols-3">
        <div className="rounded-2xl border border-line bg-ivory p-4">
          <p className="text-[13px] text-cocoa-soft">Doanh thu (đã thanh toán)</p>
          <p className="mt-1 text-[24px] font-semibold">{usd(stat("paid").total)}</p>
          <p className="text-[13px] text-cocoa-soft">{stat("paid").count} đơn</p>
        </div>
        <div className="rounded-2xl border border-line bg-ivory p-4">
          <p className="text-[13px] text-cocoa-soft">Chờ thanh toán</p>
          <p className="mt-1 text-[24px] font-semibold">{stat("pending").count}</p>
          <p className="text-[13px] text-cocoa-soft">khách mở trang thanh toán nhưng chưa trả</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-line bg-ivory p-4 tab:col-span-1">
          <p className="text-[13px] text-cocoa-soft">Tổng số đơn</p>
          <p className="mt-1 text-[24px] font-semibold">{allCount}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["", "paid", "pending", "failed"] as const).map((s) => (
          <button
            key={s || "all"}
            type="button"
            aria-pressed={status === s}
            onClick={() => pickStatus(s)}
            className={`min-h-10 rounded-full border px-4 text-[14px] ${status === s ? "border-brown bg-brown text-white" : "border-line bg-white"}`}
          >
            {s ? STATUS[s].label : "Tất cả"} ({s ? stat(s).count : allCount})
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-xl bg-wine/10 px-4 py-3 text-wine">{error}</p>}
      {!orders && !error && <p className="mt-10 text-center text-cocoa-soft">Đang tải…</p>}
      {orders && orders.length === 0 && <p className="mt-10 text-center text-cocoa-soft">Chưa có đơn nào.</p>}

      {orders && orders.length > 0 && (
        <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-ivory">
          {orders.map((o) => (
            <li key={o.id} className="border-b border-line last:border-0">
              <button type="button" onClick={() => setOpen(o)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-pink-2/50">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{o.email}</span>
                    <Badge status={o.status} />
                    {o.notes && <span className="rounded-full bg-pink-2 px-2 py-px text-[11px]">có ghi chú</span>}
                  </p>
                  <p className="truncate text-[13px] text-cocoa-soft">
                    {dateTime(o.createdAt)} · {itemCount(o)} sản phẩm · {o.id}
                  </p>
                  <p className="truncate text-[13px]">
                    {o.shippingAddress ? (
                      <>
                        Giao tới {recipient(o.shippingAddress)} · {[o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.country].filter(Boolean).join(", ")}
                        {o.shippingMethod === "express" && <span className="ml-1.5 rounded-full bg-brown px-2 py-px text-[11px] text-white">Express</span>}
                      </>
                    ) : (
                      <span className="text-cocoa-soft">Chưa có địa chỉ giao hàng</span>
                    )}
                  </p>
                </div>
                <b className="shrink-0 font-semibold">{usd(o.total, o.currency)}</b>
              </button>
            </li>
          ))}
        </ul>
      )}
      {more && (
        <div className="mt-4 text-center">
          <button type="button" onClick={loadMore} disabled={loadingMore} className="min-h-10 rounded-full border border-line bg-white px-5 disabled:opacity-60">
            {loadingMore ? "Đang tải…" : "Tải thêm"}
          </button>
        </div>
      )}

      {open && <Detail order={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
