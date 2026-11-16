"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/context/StoreContext";

/** /checkout hands the cart over to Shopify's hosted checkout (Shopify Payments, Shop Pay, PayPal…). */
export default function CheckoutRedirect() {
  const { hydrated, checkout } = useStore();
  const [empty, setEmpty] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    checkout().then((ok) => !ok && setEmpty(true));
  }, [hydrated, checkout]);

  return (
    <div className="container-x py-24 text-center">
      {empty ? (
        <>
          <h1 className="font-display text-[30px] font-medium">Your cart is empty</h1>
          <Link href="/collections/shop-all" className="btn-dark mt-8">Shop all</Link>
        </>
      ) : (
        <p className="text-[16px] text-muted">Taking you to secure checkout…</p>
      )}
    </div>
  );
}
