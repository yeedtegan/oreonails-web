"use client";

import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { isDb } from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { money } from "@/lib/pricing";
import type { Address, Order, Product } from "@/lib/data";
import { CHECKOUT_SESSION_KEY, CheckoutFooter, CheckoutFrame, MobileSummary, SummaryItems, SummaryRow, SummaryTotal, TagIcon, type SummaryLine } from "@/components/checkout/ui";

function AddressLines({ a }: { a?: Address | null }) {
  if (!a) return <p className="text-[#707070]">—</p>;
  return (
    <address className="not-italic leading-[21px]">
      {[a.firstName, a.lastName].filter(Boolean).join(" ")}
      {a.company && <><br />{a.company}</>}
      <br />{a.address1}
      {a.address2 && <><br />{a.address2}</>}
      <br />{[a.city, a.province, a.zip].filter(Boolean).join(" ")}
      <br />{a.country}
      {a.phone && <><br />{a.phone}</>}
    </address>
  );
}

const sameAddress = (a?: Address | null, b?: Address | null) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function ThankYouInner() {
  const params = useSearchParams();
  const number = params.get("order") ?? "";
  const key = params.get("key") ?? "";
  const { clearCart } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  // Confirm the payment with the gateway (the server checks with Stripe/PayPal, never the browser).
  useEffect(() => {
    if (!number || !key) return setError("This order link is incomplete.");
    let cancelled = false;
    apiFetch<{ order: Order }>(`/checkout/orders/${encodeURIComponent(number)}/complete`, { body: { key } })
      .then(({ order }) => !cancelled && setOrder(order))
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [number, key, attempt]);

  // Some methods (bank redirects, PayPal eChecks) settle a few seconds later: poll briefly.
  useEffect(() => {
    if (order?.paymentStatus !== "pending" || attempt >= 6) return;
    const t = setTimeout(() => setAttempt((a) => a + 1), 2500);
    return () => clearTimeout(t);
  }, [order, attempt]);

  // The cart becomes this order once it's paid.
  useEffect(() => {
    if (order?.paymentStatus !== "paid") return;
    try {
      if (sessionStorage.getItem(CHECKOUT_SESSION_KEY) === order.number) {
        sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
        clearCart();
      }
    } catch {}
  }, [order, clearCart]);

  useEffect(() => {
    if (!order) return;
    const handles = [...new Set(order.items.map((i) => i.handle))].join(",");
    apiFetch<{ products: Product[] }>(`/products?handles=${encodeURIComponent(handles)}&limit=100`)
      .then((r) => setProducts(new Map(r.products.map((p) => [p.handle, p]))))
      .catch(() => {});
  }, [order]);

  if (error) {
    return (
      <CheckoutFrame
        main={
          <div className="py-16">
            <h1 className="text-[21px] font-semibold">We couldn&apos;t find that order</h1>
            <p className="mt-2 text-[#707070]">{error} If you were charged, contact us with your email address and we&apos;ll sort it out.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/pages/contact" className="inline-flex h-[52px] items-center rounded-[5px] border border-[#dedede] px-6 font-semibold">Contact us</Link>
              <Link href="/" className="inline-flex h-[52px] items-center rounded-[5px] bg-[var(--accent)] px-6 font-semibold text-white">Continue shopping</Link>
            </div>
          </div>
        }
        summary={null}
      />
    );
  }

  if (!order) {
    return (
      <CheckoutFrame
        main={
          <div className="flex items-center gap-3 py-16 text-[#707070]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dedede] border-t-[var(--accent)]" />
            Confirming your payment…
          </div>
        }
        summary={null}
      />
    );
  }

  const paid = order.paymentStatus === "paid";
  const firstName = order.shippingAddress?.firstName || order.name.split(" ")[0];
  const lines: SummaryLine[] = order.items.map((i, n) => ({
    key: `${i.handle}-${n}`,
    title: i.title,
    variant: [[i.size, i.shape].filter(Boolean).join(" / "), i.customSizes].filter(Boolean).join(" · ") || undefined,
    qty: i.qty,
    total: i.unitPrice * i.qty,
    product: products.get(i.handle),
    shape: i.shape ?? undefined,
  }));
  const count = order.items.reduce((s, i) => s + i.qty, 0);

  const summary = (
    <div className="space-y-[21px]">
      <SummaryItems lines={lines} />
      <div className="space-y-[10px]">
        <SummaryRow label={`Subtotal · ${count} item${count === 1 ? "" : "s"}`} value={money(order.subtotal)} />
        {order.promoDiscount > 0 && (
          <SummaryRow label="Order discount" value={`−${money(order.promoDiscount)}`}>
            <span className="mt-1 flex items-center gap-1 text-[12px] text-[#707070]"><TagIcon />MIX &amp; MATCH</span>
          </SummaryRow>
        )}
        {order.codeDiscount > 0 && (
          <SummaryRow label="Discount" value={`−${money(order.codeDiscount)}`}>
            <span className="mt-1 flex items-center gap-1 text-[12px] text-[#707070]"><TagIcon />{order.code}</span>
          </SummaryRow>
        )}
        <SummaryRow label="Shipping" value={order.shipping === 0 ? "FREE" : money(order.shipping)} />
        <SummaryTotal total={order.total} savings={order.promoDiscount + order.codeDiscount} />
      </div>
    </div>
  );

  const main = (
    <div>
      <div className="flex items-center gap-[14px]">
        <span className={`grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border-2 ${paid ? "border-[var(--accent)] text-[var(--accent)]" : "border-[#dedede] text-[#707070]"}`}>
          {paid ? (
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dedede] border-t-[var(--accent)]" />
          )}
        </span>
        <div>
          <p className="text-[14px] text-[#707070]">Confirmation #{order.number}</p>
          <h1 className="text-[24px] font-semibold leading-tight">{paid ? `Thank you${firstName ? `, ${firstName}` : ""}!` : "Your payment is processing"}</h1>
        </div>
      </div>

      <section className="mt-[28px] rounded-[5px] border border-[#dedede] p-[18px]">
        {paid ? (
          <>
            <h2 className="text-[17px] font-semibold">Your order is confirmed</h2>
            <p className="mt-1.5 text-[14px] text-[#707070]">
              You&apos;ll receive a confirmation email with your order number shortly. Each set is hand-painted to order: we start crafting it now and ship it within 2–3 business days.
            </p>
            {!!order.pointsAwarded && <p className="mt-2 text-[14px] text-[var(--accent)]">You earned {order.pointsAwarded} Oreo Club points with this order.</p>}
          </>
        ) : (
          <>
            <h2 className="text-[17px] font-semibold">We&apos;re waiting for your payment to clear</h2>
            <p className="mt-1.5 text-[14px] text-[#707070]">
              This page updates automatically. If your payment didn&apos;t go through, you haven&apos;t been charged. <Link href="/checkout" className="text-[var(--accent)] underline">Return to checkout</Link> to try again.
            </p>
            {attempt >= 6 && (
              <button onClick={() => setAttempt(0)} className="mt-3 h-[40px] rounded-[5px] border border-[#dedede] px-4 text-[14px] font-semibold">Check again</button>
            )}
          </>
        )}
      </section>

      <section className="mt-[14px] rounded-[5px] border border-[#dedede] p-[18px]">
        <h2 className="text-[17px] font-semibold">Order details</h2>
        <div className="mt-[14px] grid gap-x-[28px] gap-y-[21px] text-[14px] sm:grid-cols-2">
          <div>
            <h3 className="mb-1.5 font-semibold">Contact information</h3>
            <p className="break-all">{order.email}</p>
          </div>
          <div>
            <h3 className="mb-1.5 font-semibold">Payment method</h3>
            <p>{order.paymentDetail ?? (order.paymentMethod === "paypal" ? "PayPal" : "Card")} · <b>{money(order.total)}</b></p>
          </div>
          <div>
            <h3 className="mb-1.5 font-semibold">Shipping address</h3>
            <AddressLines a={order.shippingAddress} />
          </div>
          <div>
            <h3 className="mb-1.5 font-semibold">Billing address</h3>
            {sameAddress(order.shippingAddress, order.billingAddress) ? <p>Same as shipping address</p> : <AddressLines a={order.billingAddress} />}
          </div>
          <div>
            <h3 className="mb-1.5 font-semibold">Shipping method</h3>
            <p>{order.shippingMethod ?? "Standard Shipping"}</p>
          </div>
        </div>
      </section>

      <div className="mt-[21px] flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-[14px] sm:text-left">
          Need help? <Link href="/pages/contact" className="text-[var(--accent)] underline underline-offset-2">Contact us</Link>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/pages/track-order?order=${order.number}&email=${encodeURIComponent(order.email)}`} className="inline-flex h-[52px] items-center justify-center rounded-[5px] border border-[#dedede] px-6 text-[14px] font-semibold">
            Track order
          </Link>
          <Link href="/" className="inline-flex h-[52px] items-center justify-center rounded-[5px] bg-[var(--accent)] px-6 text-[14px] font-semibold text-white">Continue shopping</Link>
        </div>
      </div>

      <CheckoutFooter />
    </div>
  );

  return <CheckoutFrame main={main} summary={summary} mobileSummary={<MobileSummary total={money(order.total)}>{summary}</MobileSummary>} />;
}

export default function ThankYouPage() {
  if (!isDb) notFound(); // Shopify shows its own order status page.
  return (
    <Suspense fallback={null}>
      <ThankYouInner />
    </Suspense>
  );
}
