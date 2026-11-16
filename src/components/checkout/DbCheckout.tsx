"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { apiFetch, ApiError } from "@/lib/api-client";
import { money } from "@/lib/pricing";
import { COUNTRIES, countryByCode } from "@/components/checkout/regions";
import StripePayment, { type StripePaymentHandle } from "@/components/checkout/StripePayment";
import {
  CardBadges,
  CHECKOUT_SESSION_KEY,
  Checkbox,
  CheckoutFooter,
  CheckoutFrame,
  FloatingInput,
  FloatingSelect,
  HelpTip,
  LockIcon,
  MobileSummary,
  PaypalWordmark,
  Radio,
  SummaryItems,
  SummaryRow,
  SummaryTotal,
  TagIcon,
  type SummaryLine,
} from "@/components/checkout/ui";

interface PaymentConfig {
  card: "stripe" | "test" | null;
  stripePublishableKey: string | null;
  paypal: boolean;
}

interface AddressForm {
  countryCode: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
}

const EMPTY_ADDRESS: AddressForm = { countryCode: "US", firstName: "", lastName: "", company: "", address1: "", address2: "", city: "", province: "", zip: "", phone: "" };
const SAVED_KEY = "oreonails-checkout-info";

type Errors = Record<string, string>;

/* ---------------- card input formatting (test gateway) ---------------- */

const formatCardNumber = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 19);
  if (/^3[47]/.test(d)) return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
};
const formatExpiry = (v: string, prev: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (v.length < prev.length && prev.endsWith(" / ") && d.length === 2) return d.slice(0, 1); // backspace over the separator
  if (d.length >= 3) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  if (d.length === 2) return `${d} / `;
  return d;
};

/* ---------------- validation ---------------- */

function validateAddress(a: AddressForm, prefix: string, e: Errors) {
  const c = countryByCode(a.countryCode);
  if (!a.lastName.trim()) e[`${prefix}lastName`] = "Enter a last name";
  if (!a.address1.trim()) e[`${prefix}address1`] = "Enter an address";
  if (!a.city.trim()) e[`${prefix}city`] = "Enter a city";
  if (c.regions && !a.province) e[`${prefix}province`] = `Select a ${c.regionLabel!.toLowerCase()}`;
  if (!a.zip.trim()) e[`${prefix}zip`] = `Enter a ${c.zipLabel}`;
  else if (a.countryCode === "US" && !/^\d{5}(-\d{4})?$/.test(a.zip.trim())) e[`${prefix}zip`] = "Enter a valid ZIP code";
}

const addressComplete = (a: AddressForm) => {
  const c = countryByCode(a.countryCode);
  return !!(a.address1.trim() && a.city.trim() && a.zip.trim() && (!c.regions || a.province));
};

const toApiAddress = (a: AddressForm) => ({
  ...a,
  country: countryByCode(a.countryCode).name,
  province: countryByCode(a.countryCode).regions ? a.province : "",
});

/* ---------------- page ---------------- */

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { cart, totals, quoting, code, setCode, checkCode, hydrated, user, token, shippingRate, setShippingRate } = useStore();

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [ship, setShip] = useState<AddressForm>(EMPTY_ADDRESS);
  const [saveInfo, setSaveInfo] = useState(false);
  const [method, setMethod] = useState<"card" | "paypal">("card");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [billingSame, setBillingSame] = useState(true);
  const [bill, setBill] = useState<AddressForm>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Errors>({});
  const [payError, setPayError] = useState(params.get("cancelled") ? "Your PayPal payment was cancelled. You haven't been charged." : "");
  const [submitting, setSubmitting] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const stripeRef = useRef<StripePaymentHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    apiFetch<PaymentConfig>("/checkout/config")
      .then((c) => {
        setConfig(c);
        if (!c.card && c.paypal) setMethod("paypal");
      })
      .catch(() => setConfig({ card: null, stripePublishableKey: null, paypal: false }));
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "null");
      if (saved) {
        setEmail(saved.email ?? "");
        setShip({ ...EMPTY_ADDRESS, ...saved.ship });
        setSaveInfo(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user && !email) setEmail(user.email);
  }, [user, email]);

  const lines: SummaryLine[] = useMemo(
    () =>
      totals.lines.map((l) => ({
        key: l.key,
        title: l.product.title,
        variant: [[l.size, l.shape].filter(Boolean).join(" / "), l.customSizes].filter(Boolean).join(" · ") || undefined,
        qty: l.qty,
        total: l.lineTotal,
        product: l.product,
        shape: l.shape,
      })),
    [totals.lines],
  );

  if (!hydrated) return <CheckoutFrame main={<div className="h-96" />} summary={null} />;

  if (cart.length === 0) {
    return (
      <CheckoutFrame
        main={
          <div className="py-16 text-center">
            <h1 className="text-[21px] font-semibold">Your cart is empty</h1>
            <p className="mt-2 text-[#707070]">Add something you love and come back to check out.</p>
            <Link href="/collections/shop-all" className="mt-6 inline-flex h-[52px] items-center rounded-[5px] bg-[var(--accent)] px-8 text-[15px] font-semibold text-white">Continue shopping</Link>
          </div>
        }
        summary={<p className="text-[#707070]">No items</p>}
      />
    );
  }

  const shipCountry = countryByCode(ship.countryCode);
  const billCountry = countryByCode(bill.countryCode);
  const canShip = addressComplete(ship);
  const savings = totals.promoDiscount + totals.codeDiscount;
  const busy = submitting || quoting;
  const set = <K extends keyof AddressForm>(setter: typeof setShip, k: K) => (v: string) => {
    setter((a) => ({ ...a, [k]: v, ...(k === "countryCode" && { province: "" }) }));
    setErrors((e) => ({ ...e, [`${setter === setShip ? "ship." : "bill."}${k}`]: "" }));
  };
  const setCardField = (k: keyof typeof card) => (v: string) => {
    setCard((c) => ({ ...c, [k]: k === "number" ? formatCardNumber(v) : k === "exp" ? formatExpiry(v, c.exp) : k === "cvc" ? v.replace(/\D/g, "").slice(0, 4) : v }));
    setErrors((e) => ({ ...e, [`card.${k}`]: "" }));
  };

  // Not a <form>: on phones the summary sits inside the checkout form, and forms can't nest.
  const applyCode = async () => {
    if (!codeInput.trim() || codeBusy) return;
    setCodeBusy(true);
    try {
      if (await checkCode(codeInput)) {
        setCode(codeInput);
        setCodeInput("");
        setCodeErr("");
      } else setCodeErr("Enter a valid discount code or gift card");
    } catch (err) {
      setCodeErr((err as Error).message);
    } finally {
      setCodeBusy(false);
    }
  };

  const validate = () => {
    const e: Errors = {};
    if (!email.trim()) e.email = "Enter an email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email";
    validateAddress(ship, "ship.", e);
    if (method === "card" && config?.card === "test") {
      const digits = card.number.replace(/\D/g, "");
      if (!digits) e["card.number"] = "Enter a card number";
      else if (digits.length < 13) e["card.number"] = "Enter a valid card number";
      if (!/^\d{2} \/ \d{2}$/.test(card.exp)) e["card.exp"] = "Enter a valid expiration date";
      if (!/^\d{3,4}$/.test(card.cvc)) e["card.cvc"] = "Enter the CVV or security code on your card";
      if (!card.name.trim()) e["card.name"] = "Enter your name exactly as it's written on your card";
    }
    if (method === "card" && !billingSame) validateAddress(bill, "bill.", e);
    setErrors(e);
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setPayError("");
    const e = validate();
    if (Object.keys(e).length) {
      // Focus the first invalid field, like Shopify.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    if (!config?.card && method === "card") return setPayError("Card payments aren't available right now.");
    if (method === "card" && config?.card === "stripe") {
      const err = await stripeRef.current?.validate();
      if (err) return setPayError(err);
    }

    setSubmitting(true);
    try {
      if (saveInfo) localStorage.setItem(SAVED_KEY, JSON.stringify({ email: email.trim(), ship }));
      else localStorage.removeItem(SAVED_KEY);
    } catch {}

    try {
      const res = await apiFetch<{ number: string; key: string; next: { type: "done" } | { type: "stripe"; clientSecret: string } | { type: "redirect"; url: string } }>(
        "/checkout",
        {
          token,
          body: {
            items: cart.map(({ handle, qty, size, shape, customSizes }) => ({ handle, qty, size, shape, customSizes })),
            code: code || undefined,
            shippingRate,
            email: email.trim(),
            acceptsMarketing: marketing,
            shippingAddress: toApiAddress(ship),
            billingAddress: method === "card" && !billingSame ? toApiAddress(bill) : undefined,
            method,
            card:
              method === "card" && config?.card === "test"
                ? { number: card.number.replace(/\s/g, ""), exp: card.exp.replace(/\s/g, ""), cvc: card.cvc, name: card.name }
                : undefined,
          },
        },
      );
      try {
        sessionStorage.setItem(CHECKOUT_SESSION_KEY, res.number);
      } catch {}
      const thanks = `/checkout/thank-you?order=${res.number}&key=${encodeURIComponent(res.key)}`;
      if (res.next.type === "redirect") {
        window.location.href = res.next.url;
        return; // keep the button busy while the browser leaves
      }
      if (res.next.type === "stripe") {
        const err = await stripeRef.current!.confirm(res.next.clientSecret, `${window.location.origin}${thanks}`, email.trim());
        if (err) {
          setPayError(err);
          setSubmitting(false);
          return;
        }
      }
      router.push(thanks);
    } catch (err) {
      const msg = err instanceof ApiError && err.data?.problems?.length ? "Some items in your cart are no longer available. Review your cart and try again." : (err as Error).message;
      setPayError(msg);
      setSubmitting(false);
    }
  };

  /* ---------------- summary (shared by desktop column and mobile) ---------------- */

  const summary = (
    <div className="space-y-[21px]">
      <SummaryItems lines={lines} />
      <div className="flex gap-[11px]">
        <FloatingInput
          className="flex-1"
          label="Discount code or gift card"
          value={codeInput}
          onValue={(v) => {
            setCodeInput(v);
            setCodeErr("");
          }}
          error={codeErr}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyCode();
            }
          }}
        />
        <button
          type="button"
          onClick={applyCode}
          disabled={!codeInput.trim() || codeBusy}
          className="h-[50px] shrink-0 rounded-[5px] border border-[#dedede] px-[18px] text-[14px] font-semibold transition-colors enabled:border-[var(--accent)] enabled:bg-[var(--accent)] enabled:text-white disabled:bg-[#ededed] disabled:text-[#707070]"
        >
          Apply
        </button>
      </div>
      {totals.codeValid && totals.code && (
        <div className="-mt-2 flex flex-wrap gap-2">
          <span className="inline-flex h-[30px] items-center gap-1.5 rounded-[5px] bg-[#e6e6e6] pl-2.5 pr-1.5 text-[13px] font-medium">
            <TagIcon />
            {totals.code}
            <button type="button" aria-label={`Remove ${totals.code}`} onClick={() => setCode("")} className="grid h-5 w-5 place-items-center rounded text-[#707070] hover:text-black">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><path d="m1.5 1.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </span>
        </div>
      )}
      <div className="space-y-[10px]">
        <SummaryRow label={`Subtotal · ${totals.count} item${totals.count === 1 ? "" : "s"}`} value={money(totals.subtotal)} />
        {totals.promoDiscount > 0 && (
          <SummaryRow
            label="Order discount"
            value={`−${money(totals.promoDiscount)}`}
          >
            <span className="mt-1 flex items-center gap-1 text-[12px] text-[#707070]"><TagIcon />MIX &amp; MATCH ({totals.freeCount} FREE)</span>
          </SummaryRow>
        )}
        {totals.codeDiscount > 0 && (
          <SummaryRow label="Discount" value={`−${money(totals.codeDiscount)}`}>
            <span className="mt-1 flex items-center gap-1 text-[12px] text-[#707070]"><TagIcon />{totals.code} ({totals.codePercent}% OFF)</span>
          </SummaryRow>
        )}
        <SummaryRow
          label={
            <span className="inline-flex items-center gap-1">
              Shipping
              <HelpTip text={`Free standard shipping on orders over ${money(totals.freeShippingThreshold)}. Every set is crafted to order in 2–3 business days.`} />
            </span>
          }
          value={canShip ? (totals.shipping === 0 ? "FREE" : money(totals.shipping)) : "Enter shipping address"}
          muted={!canShip}
        />
        <SummaryTotal total={totals.total} savings={savings} />
      </div>
    </div>
  );

  /* ---------------- main column ---------------- */

  const main = (
    <form ref={formRef} noValidate onSubmit={submit}>
      {/* Contact */}
      <section>
        <div className="mb-[14px] flex items-baseline justify-between">
          <h2 className="text-[21px] font-semibold">Contact</h2>
          {!user && <Link href="/account" className="text-[14px] text-[var(--accent)] underline underline-offset-2">Sign in</Link>}
        </div>
        <FloatingInput label="Email" type="email" autoComplete="email" value={email} onValue={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: "" })); }} error={errors.email} />
        <div className="mt-[14px]">
          <Checkbox checked={marketing} onChange={setMarketing}>Email me with news and offers</Checkbox>
        </div>
      </section>

      {/* Delivery */}
      <section className="mt-[38px]">
        <h2 className="mb-[14px] text-[21px] font-semibold">Delivery</h2>
        <AddressFields value={ship} country={shipCountry} prefix="ship." errors={errors} set={(k) => set(setShip, k)} />
        <div className="mt-[14px]">
          <Checkbox checked={saveInfo} onChange={setSaveInfo}>Save this information for next time</Checkbox>
        </div>
      </section>

      {/* Shipping method */}
      <section className="mt-[28px]">
        <h3 className="mb-[14px] text-[17px] font-semibold">Shipping method</h3>
        {canShip ? (
          <div className="overflow-hidden rounded-[5px] border border-[#dedede]">
            {(totals.shippingRates ?? []).map((r, i) => {
              const on = shippingRate === r.id;
              return (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-center gap-[14px] px-[16px] py-[15px] ${i > 0 ? "border-t border-[#dedede]" : ""} ${on ? "bg-[#f6f2f6] shadow-[inset_0_0_0_1px_var(--accent)]" : ""}`}
                >
                  <input type="radio" name="shippingRate" className="sr-only" checked={on} onChange={() => setShippingRate(r.id)} />
                  <Radio checked={on} />
                  <span className="flex-1">
                    <span className="block text-[14px]">{r.title}</span>
                    <span className="block text-[12px] text-[#707070]">{r.detail}</span>
                  </span>
                  <span className="text-[14px] font-semibold">{r.price === 0 ? "FREE" : money(r.price)}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="rounded-[5px] bg-[#f5f5f5] px-[16px] py-[18px] text-[14px] text-[#707070]">Enter your shipping address to view available shipping methods.</p>
        )}
      </section>

      {/* Payment */}
      <section className="mt-[38px]">
        <h2 className="text-[21px] font-semibold">Payment</h2>
        <p className="mb-[14px] mt-1 text-[14px] text-[#707070]">All transactions are secure and encrypted.</p>
        {config === null ? (
          <div className="h-[120px] animate-pulse rounded-[5px] bg-[#f5f5f5]" />
        ) : !config.card && !config.paypal ? (
          <p className="rounded-[5px] border border-[#dedede] bg-[#f5f5f5] p-[16px] text-[#707070]">This store can&apos;t accept payments right now. Please contact us to complete your order.</p>
        ) : (
          <div className="overflow-hidden rounded-[5px] border border-[#dedede]">
            {config.card && (
              <PaymentOption
                id="card"
                selected={method === "card"}
                onSelect={() => setMethod("card")}
                label={config.card === "stripe" ? "Credit card & more" : "Credit card"}
                right={<CardBadges extra={config.card === "stripe" ? 5 : 2} />}
              >
                {config.card === "stripe" ? (
                  <StripePayment ref={stripeRef} publishableKey={config.stripePublishableKey!} amount={totals.total} />
                ) : (
                  <div className="grid grid-cols-2 gap-[11px]">
                    <p className="col-span-2 rounded-[5px] border border-dashed border-[#c9b9c7] bg-white px-3 py-2 text-[12px] leading-[18px] text-[#5b4b5a]">
                      <b>Test mode.</b> No real charge. Use <b>4242 4242 4242 4242</b> with any future date and any CVV. <span className="whitespace-nowrap">4000 0000 0000 0002</span> is declined.
                    </p>
                    <FloatingInput className="col-span-2" label="Card number" inputMode="numeric" autoComplete="cc-number" value={card.number} onValue={setCardField("number")} error={errors["card.number"]} suffix={<LockIcon />} />
                    <FloatingInput className="col-span-2 sm:col-span-1" label="Expiration date (MM / YY)" inputMode="numeric" autoComplete="cc-exp" value={card.exp} onValue={setCardField("exp")} error={errors["card.exp"]} />
                    <FloatingInput
                      className="col-span-2 sm:col-span-1"
                      label="Security code"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={card.cvc}
                      onValue={setCardField("cvc")}
                      error={errors["card.cvc"]}
                      suffix={<HelpTip text="3-digit security code usually found on the back of your card. American Express cards have a 4-digit code on the front." />}
                    />
                    <FloatingInput className="col-span-2" label="Name on card" autoComplete="cc-name" value={card.name} onValue={setCardField("name")} error={errors["card.name"]} />
                  </div>
                )}
                <div className="mt-[14px]">
                  <Checkbox checked={billingSame} onChange={setBillingSame}>Use shipping address as billing address</Checkbox>
                </div>
                {!billingSame && (
                  <div className="mt-[14px]">
                    <h3 className="mb-[11px] text-[14px] font-semibold">Billing address</h3>
                    <AddressFields value={bill} country={billCountry} prefix="bill." errors={errors} set={(k) => set(setBill, k)} />
                  </div>
                )}
              </PaymentOption>
            )}
            {config.paypal && (
              <PaymentOption id="paypal" selected={method === "paypal"} onSelect={() => setMethod("paypal")} label={<PaypalWordmark />} bordered={!!config.card}>
                <div className="flex flex-col items-center gap-3 px-4 py-2 text-center text-[14px]">
                  <svg width="140" height="56" viewBox="0 0 140 56" aria-hidden className="text-[#a3a3a3]">
                    <rect x="1" y="6" width="80" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M1 16h80" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M92 30h30m-8-8 8 8-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="126" y="18" width="12" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <p className="max-w-[360px]">After clicking &ldquo;Pay with PayPal&rdquo;, you will be redirected to PayPal to complete your purchase securely.</p>
                </div>
              </PaymentOption>
            )}
          </div>
        )}
      </section>

      {payError && (
        <div role="alert" className="mt-[21px] flex gap-2 rounded-[5px] border border-[#dd1d1d] bg-[#fff4f4] px-[14px] py-[12px] text-[14px] text-[#9c1414]">
          <svg width="18" height="18" viewBox="0 0 18 18" className="mt-px shrink-0" aria-hidden><circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M9 5v5M9 12.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          {payError}
        </div>
      )}

      {/* On phones Shopify repeats the summary just above the pay button. */}
      <section className="mt-[38px] lg:hidden">
        <h2 className="mb-[14px] text-[21px] font-semibold">Order summary</h2>
        {summary}
      </section>

      <button
        type="submit"
        disabled={busy || !config || (!config.card && !config.paypal)}
        className="mt-[28px] flex h-[56px] w-full items-center justify-center gap-2 rounded-[5px] bg-[var(--accent)] text-[19px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Processing" />
        ) : method === "paypal" ? (
          "Pay with PayPal"
        ) : (
          "Pay now"
        )}
      </button>

      <CheckoutFooter />
    </form>
  );

  return <CheckoutFrame main={main} summary={summary} mobileSummary={<MobileSummary total={money(totals.total)}>{summary}</MobileSummary>} />;
}

function PaymentOption({
  id,
  selected,
  onSelect,
  label,
  right,
  bordered,
  children,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  label: React.ReactNode;
  right?: React.ReactNode;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={bordered ? "border-t border-[#dedede]" : ""}>
      <label className={`flex min-h-[52px] cursor-pointer items-center gap-[14px] px-[16px] py-[12px] ${selected ? "bg-[#f6f2f6] shadow-[inset_0_0_0_1px_var(--accent)]" : ""}`}>
        <input type="radio" name="payment" value={id} className="sr-only" checked={selected} onChange={onSelect} />
        <Radio checked={selected} />
        <span className="flex-1 text-[14px]">{label}</span>
        {right}
      </label>
      {selected && <div className="border-t border-[#dedede] bg-[#f5f5f5] p-[16px]">{children}</div>}
    </div>
  );
}

function AddressFields({
  value: a,
  country,
  prefix,
  errors,
  set,
}: {
  value: AddressForm;
  country: ReturnType<typeof countryByCode>;
  prefix: string;
  errors: Errors;
  set: (k: keyof AddressForm) => (v: string) => void;
}) {
  const err = (k: string) => errors[`${prefix}${k}`];
  const ac = (s: string) => (prefix === "ship." ? `shipping ${s}` : `billing ${s}`);
  return (
    <div className="grid grid-cols-2 gap-[11px] sm:grid-cols-6">
      <FloatingSelect
        className="col-span-2 sm:col-span-6"
        label="Country/Region"
        value={a.countryCode}
        onValue={set("countryCode")}
        options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
        autoComplete={ac("country")}
      />
      <FloatingInput className="col-span-1 sm:col-span-3" label="First name (optional)" autoComplete={ac("given-name")} value={a.firstName} onValue={set("firstName")} />
      <FloatingInput className="col-span-1 sm:col-span-3" label="Last name" autoComplete={ac("family-name")} value={a.lastName} onValue={set("lastName")} error={err("lastName")} />
      <FloatingInput className="col-span-2 sm:col-span-6" label="Company (optional)" autoComplete={ac("organization")} value={a.company} onValue={set("company")} />
      <FloatingInput className="col-span-2 sm:col-span-6" label="Address" autoComplete={ac("address-line1")} value={a.address1} onValue={set("address1")} error={err("address1")} />
      <FloatingInput className="col-span-2 sm:col-span-6" label="Apartment, suite, etc. (optional)" autoComplete={ac("address-line2")} value={a.address2} onValue={set("address2")} />
      <FloatingInput className={`col-span-2 ${country.regions ? "sm:col-span-2" : "sm:col-span-3"}`} label="City" autoComplete={ac("address-level2")} value={a.city} onValue={set("city")} error={err("city")} />
      {country.regions && (
        <FloatingSelect
          className="col-span-1 sm:col-span-2"
          label={country.regionLabel!}
          value={a.province}
          onValue={set("province")}
          placeholder={country.regionLabel}
          options={country.regions.map((r) => ({ value: r, label: r }))}
          error={err("province")}
          autoComplete={ac("address-level1")}
        />
      )}
      <FloatingInput
        className={country.regions ? "col-span-1 sm:col-span-2" : "col-span-2 sm:col-span-3"}
        label={country.zipLabel}
        autoComplete={ac("postal-code")}
        value={a.zip}
        onValue={set("zip")}
        error={err("zip")}
      />
      {prefix === "ship." && (
        <FloatingInput
          className="col-span-2 sm:col-span-6"
          label="Phone (optional)"
          type="tel"
          autoComplete={ac("tel")}
          value={a.phone}
          onValue={set("phone")}
          suffix={<HelpTip text="In case we need to contact you about your order" />}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
