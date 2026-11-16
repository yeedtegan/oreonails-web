"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { ACCENT, SYSTEM_FONT } from "./ui";

export interface StripePaymentHandle {
  /** Validates the fields; returns an error message or null. */
  validate(): Promise<string | null>;
  /** Confirms the payment for a server-created intent. Returns an error message or null on success. */
  confirm(clientSecret: string, returnUrl: string, email: string): Promise<string | null>;
}

const stripePromises = new Map<string, Promise<Stripe | null>>();
const getStripe = (key: string) => {
  if (!stripePromises.has(key)) stripePromises.set(key, loadStripe(key));
  return stripePromises.get(key)!;
};

/**
 * Stripe Payment Element in "deferred intent" mode: it renders before the order exists, and the
 * PaymentIntent is created by the API (with the server-computed total) only when the customer pays.
 * Card numbers go straight from the browser to Stripe; they never touch our server.
 */
const StripePayment = forwardRef<StripePaymentHandle, { publishableKey: string; amount: number }>(function StripePayment({ publishableKey, amount }, ref) {
  const node = useRef<HTMLDivElement>(null);
  const stripe = useRef<Stripe | null>(null);
  const elements = useRef<StripeElements | null>(null);
  const [error, setError] = useState("");
  const amountCents = Math.max(50, Math.round(amount * 100)); // Stripe's minimum charge is $0.50

  useEffect(() => {
    let cancelled = false;
    getStripe(publishableKey)
      .then((s) => {
        if (cancelled || !s || !node.current) return;
        stripe.current = s;
        elements.current = s.elements({
          mode: "payment",
          amount: amountCents,
          currency: "usd",
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: ACCENT, borderRadius: "5px", fontFamily: SYSTEM_FONT, fontSizeBase: "14px", colorDanger: "#dd1d1d" },
            rules: { ".Input": { border: "1px solid #dedede", boxShadow: "none", padding: "14px 11px" } },
          },
        });
        elements.current.create("payment", { layout: { type: "accordion", defaultCollapsed: false, radios: true, spacedAccordionItems: false } }).mount(node.current);
      })
      .catch(() => setError("Card payments couldn't load. Check your connection and refresh the page."));
    return () => {
      cancelled = true;
      elements.current?.getElement("payment")?.destroy();
      elements.current = null;
    };
    // Mount once per key; amount changes are pushed with update() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishableKey]);

  useEffect(() => {
    elements.current?.update({ amount: amountCents });
  }, [amountCents]);

  useImperativeHandle(ref, () => ({
    async validate() {
      if (!elements.current) return "Card payments are still loading. Try again in a moment.";
      const { error } = await elements.current.submit();
      return error?.message ?? (error ? "Check your payment details" : null);
    },
    async confirm(clientSecret, returnUrl, email) {
      if (!stripe.current || !elements.current) return "Card payments are still loading. Try again in a moment.";
      const { error } = await stripe.current.confirmPayment({
        elements: elements.current,
        clientSecret,
        confirmParams: { return_url: returnUrl, receipt_email: email },
        redirect: "if_required",
      });
      return error ? error.message ?? "Your payment couldn't be processed." : null;
    },
  }));

  return (
    <div>
      <div ref={node} className="min-h-[120px]" />
      {error && <p className="mt-2 text-[12px] text-[#dd1d1d]">{error}</p>}
    </div>
  );
});

export default StripePayment;
