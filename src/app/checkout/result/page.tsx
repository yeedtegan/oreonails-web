import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutResult from "./CheckoutResult";

export const metadata: Metadata = { title: "Your order — Oreo Nails" };

/** Whop sends the customer back here after paying: /checkout/result?order=<orderId>. */
export default function CheckoutResultPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={<p className="text-cocoa-soft">Loading your order…</p>}>
        <CheckoutResult />
      </Suspense>
    </main>
  );
}
