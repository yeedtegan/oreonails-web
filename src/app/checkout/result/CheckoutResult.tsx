"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Header";
import { deleteCartItem } from "@/lib/designStore";

type Order = {
  id: string;
  status: "pending" | "paid" | "failed";
  total: number;
  currency: string;
  purchaseUrl: string | null;
  items: { designId: string; price: number }[];
};

type View =
  | { kind: "loading" }
  | { kind: "order"; order: Order; waitedTooLong: boolean }
  | { kind: "error"; message: string };

const POLL_MS = 3000;
/** Whop's webhook usually lands within seconds; after this, say it's still being confirmed. */
const PATIENCE_MS = 2 * 60 * 1000;

const money = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(n);

export default function CheckoutResult() {
  const orderId = useSearchParams().get("order") ?? "";
  const [view, setView] = useState<View>(orderId ? { kind: "loading" } : { kind: "error", message: "No order to show." });

  useEffect(() => {
    if (!orderId) return;
    let stop = false;
    const started = Date.now();
    (async () => {
      while (!stop) {
        let res: Response | null = null;
        try {
          res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        } catch {
          // offline for a moment — try again
        }
        if (res) {
          const data = (await res.json().catch(() => ({}))) as { order?: Order; error?: string };
          if (!res.ok || !data.order) {
            setView({ kind: "error", message: data.error ?? "We couldn't load this order." });
            return;
          }
          const order = data.order;
          if (order.status === "paid") {
            // paid: these designs are now an order, take them out of the cart
            await Promise.all(order.items.map((i) => deleteCartItem(i.designId).catch(() => {})));
          }
          setView({ kind: "order", order, waitedTooLong: Date.now() - started > PATIENCE_MS });
          if (order.status !== "pending") return;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    })();
    return () => {
      stop = true;
    };
  }, [orderId]);

  return (
    <div className="glass-card flex w-full flex-col items-center gap-4 rounded-3xl p-8 text-center">
      <Logo />
      {view.kind === "loading" && <p className="text-cocoa-soft">Checking your payment…</p>}

      {view.kind === "error" && (
        <>
          <p className="font-serif text-xl text-cocoa">{view.message}</p>
          <Link href="/" className="btn-gold rounded-full px-6 py-2.5 font-serif text-white">
            Back to the studio
          </Link>
        </>
      )}

      {view.kind === "order" && view.order.status === "paid" && (
        <>
          <h1 className="font-serif text-3xl text-cocoa">Thank you! 💅</h1>
          <p className="text-cocoa-soft">
            We received your payment of {money(view.order.total, view.order.currency)} for {view.order.items.length} custom press-on{" "}
            {view.order.items.length === 1 ? "set" : "sets"}. A confirmation will be sent to your email.
          </p>
          <p className="text-sm text-cocoa-soft">Order {view.order.id}</p>
          <Link href="/" className="btn-gold rounded-full px-6 py-2.5 font-serif text-white">
            Design more nails
          </Link>
        </>
      )}

      {view.kind === "order" && view.order.status === "pending" && (
        <>
          <h1 className="font-serif text-2xl text-cocoa">Confirming your payment…</h1>
          <p className="text-cocoa-soft">
            {view.waitedTooLong
              ? "This is taking longer than usual. If you completed the payment, your order will update automatically — you can safely close this page."
              : "This usually takes a few seconds."}
          </p>
          {view.order.purchaseUrl && (
            <a href={view.order.purchaseUrl} className="text-sm text-gold-dark underline">
              Haven&apos;t paid yet? Return to checkout
            </a>
          )}
        </>
      )}

      {view.kind === "order" && view.order.status === "failed" && (
        <>
          <h1 className="font-serif text-2xl text-cocoa">Payment didn&apos;t go through</h1>
          <p className="text-cocoa-soft">Your designs are still in your cart — please try checking out again.</p>
          <Link href="/" className="btn-gold rounded-full px-6 py-2.5 font-serif text-white">
            Back to my cart
          </Link>
        </>
      )}
    </div>
  );
}
