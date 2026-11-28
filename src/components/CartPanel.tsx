"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { isProduct, isSet, lineOptions, useCart, type CartItem } from "./CartContext";
import GoogleSignInButton from "./GoogleSignInButton";
import { Logo } from "./Header";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BagIcon,
  BuildingIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  CloseIcon,
  GiftIcon,
  HomeIcon,
  LockIcon,
  MailIcon,
  NoteIcon,
  PhoneIcon,
  PinIcon,
  TagIcon,
  TrashIcon,
  TruckIcon,
} from "./icons";
import { EMPTY_ADDRESS, SHIP_COUNTRIES, US_STATES, addressProblems, hasShippingBasics, isUS, loadAddress, saveAddress, type Address } from "@/lib/address";
import { money, nextTier, type ShippingMethod } from "@/lib/pricing";
import { pixelCurrency, track } from "@/lib/metaPixel";
import { LENGTHS, SIZES, titleCase } from "@/lib/shop";

const MAX_NOTES = 500;

/**
 * Sends the cart to our store → Whop checkout URL. Prices, the free-set promo, the discount code and shipping are
 * worked out again by the store; the browser says what is in the cart, the code, the shipping method and the address.
 */
async function startCheckout(
  items: CartItem[],
  o: { notes: string; discountCode?: string; shippingMethod: ShippingMethod; address: Address },
): Promise<string> {
  const form = new FormData();
  const designs = items.filter((i) => !isProduct(i) && i.blob);
  for (const item of designs) {
    form.append("designIds", item.id);
    // already in the account cart → the server has its picture: don't upload ~2 MB again
    if (!item.synced) form.append("images", item.blob!, `${item.id}.png`);
  }
  form.append("designs", JSON.stringify(designs.map((i) => ({ designId: i.id, ...lineOptions(i) }))));
  form.append("products", JSON.stringify(items.filter(isProduct).map((i) => ({ productId: i.productId, ...lineOptions(i) }))));
  if (o.notes.trim()) form.append("notes", o.notes.trim());
  if (o.discountCode) form.append("discountCode", o.discountCode);
  form.append("shippingMethod", o.shippingMethod);
  form.append("shipping", JSON.stringify(o.address));
  const res = await fetch("/api/checkout", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { purchaseUrl?: string; error?: string };
  if (!res.ok || !data.purchaseUrl) throw new Error(data.error ?? "Could not start checkout. Please try again.");
  return data.purchaseUrl;
}

/** thin promo: "Add 1 more and get 1 set FREE" · $x to free ship · progress over the promo steps */
function PromoBar() {
  const { pricing, totals } = useCart();
  if (!pricing) return null;
  const { tiers, shippingFee, freeShippingMin } = pricing;
  const showShipping = shippingFee > 0;
  if (!tiers.length && !showShipping) return null;

  const max = tiers.at(-1)?.sets ?? 1;
  const next = nextTier(totals.sets, tiers);
  const extra = next ? next.free - totals.freeSets : 0;
  const goods = totals.subtotal - totals.discount;

  return (
    <div className="rounded-[14px] bg-[linear-gradient(135deg,#7a4a33,#5a3424)] px-3.5 pt-[9px] pb-1.5 text-white">
      <p className="flex items-center gap-2 text-[13.5px]">
        <GiftIcon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1">
          {!tiers.length ? (
            "Hand-painted sets, made to order"
          ) : next ? (
            <>
              Add {next.sets - totals.sets} more and get {extra === 1 ? "1 set" : `${extra} sets`} <b>FREE</b>
            </>
          ) : (
            <>
              You’ve unlocked <b>{totals.freeSets} FREE sets</b>
            </>
          )}
        </span>
        {showShipping && (
          <span className="hidden items-center gap-[5px] text-[12px] whitespace-nowrap opacity-90 min-[481px]:inline-flex">
            <TruckIcon className="h-[15px] w-[15px]" />
            {goods >= freeShippingMin ? "Free shipping" : `${money(freeShippingMin - goods)} to free ship`}
          </span>
        )}
      </p>
      {tiers.length > 0 && (
        <>
          <div className="relative mt-[9px] mr-2.5 ml-1 h-1 rounded-sm bg-white/25">
            <i className="absolute inset-y-0 left-0 rounded-sm bg-[#f4c7b8]" style={{ width: `${Math.min(1, totals.sets / max) * 100}%` }} />
            {tiers.map((t) => (
              <span
                key={t.sets}
                title={`${t.sets} sets, ${t.free} free`}
                className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${totals.sets >= t.sets ? "bg-[#f4c7b8]" : "bg-[#6a3e2b]"}`}
                style={{ left: `${(t.sets / max) * 100}%` }}
              />
            ))}
          </div>
          <div className="relative mt-[3px] mr-2.5 ml-1 h-4 text-[10.5px] opacity-85">
            {tiers.map((t, k) => (
              <span
                key={t.sets}
                className={`absolute whitespace-nowrap ${k === tiers.length - 1 ? "-translate-x-[88%]" : "-translate-x-1/2"}`}
                style={{ left: `${(t.sets / max) * 100}%` }}
              >
                {t.sets} sets · {t.free} free
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CartLine({ item, name, onOpen }: { item: CartItem; name: string; onOpen?: () => void }) {
  const { update, remove, pricing } = useCart();
  const o = lineOptions(item);
  const max = pricing?.maxQuantity ?? 10;
  const sized = isSet(item);
  // sets are painted to order: every length can be picked
  const lengths = [...LENGTHS];
  const chosen = o.size && o.length ? `${o.size}|${o.length}` : "";
  const step = "grid h-9 w-9 place-items-center rounded-full bg-pink-2 text-lg leading-none disabled:opacity-40";

  return (
    <li className="mt-2.5 rounded-[18px] border border-line bg-ivory px-3.5 py-3 soft-shadow">
      <div className="grid grid-cols-[70px_1fr_auto] items-center gap-3.5 tab:grid-cols-[86px_1fr_auto]">
        <button type="button" onClick={onOpen} disabled={!onOpen} title={onOpen ? "Open this design and its edit history" : undefined} className="enabled:hover:opacity-85">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob / store image */}
          <img src={item.url} alt={name} className="h-[54px] w-[70px] rounded-[10px] bg-white object-contain p-1 tab:h-16 tab:w-[86px]" />
        </button>
        <div className="min-w-0">
          <h4 className="truncate text-[16px] font-medium">{name}</h4>
          <p className={`text-[13px] ${sized && !chosen ? "text-wine" : "text-cocoa-soft"}`}>
            {sized ? (chosen ? [o.size, titleCase(o.length!), o.shape && titleCase(o.shape)].filter(Boolean).join(" / ") : "Choose your size") : "Tool"} ·{" "}
            {money(item.price)} / {sized ? "set" : "pc"}
          </p>
        </div>
        <div className="text-right font-semibold">{money(item.price * o.quantity)}</div>
      </div>
      <div className="mt-2.5 flex items-center gap-2.5 text-[14px]">
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label={`Decrease ${name}`} disabled={o.quantity <= 1} onClick={() => update(item.id, { quantity: o.quantity - 1 })} className={step}>
            −
          </button>
          <b className="w-6 text-center font-medium" aria-live="polite">
            {o.quantity}
          </b>
          <button type="button" aria-label={`Increase ${name}`} disabled={o.quantity >= max} onClick={() => update(item.id, { quantity: o.quantity + 1 })} className={step}>
            +
          </button>
        </div>
        {sized && (
          <label className="relative ml-auto">
            <span className="sr-only">Change size of {name}</span>
            <select
              value={chosen}
              onChange={(e) => {
                const [size, length] = e.target.value.split("|");
                update(item.id, { size, length });
              }}
              className="cursor-pointer appearance-none bg-transparent pr-5 font-medium"
            >
              <option value="" disabled>
                Change size
              </option>
              {lengths.flatMap((l) =>
                SIZES.map((s) => (
                  <option key={`${s}|${l}`} value={`${s}|${l}`}>
                    {s} / {titleCase(l)}
                  </option>
                )),
              )}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2" />
          </label>
        )}
        <button
          type="button"
          onClick={() => remove(item.id)}
          aria-label={`Remove ${name} from cart`}
          className={`flex min-h-9 items-center gap-1.5 border-l border-line pl-3 hover:text-wine ${sized ? "" : "ml-auto"}`}
        >
          <TrashIcon className="h-5 w-5" />
          <span className="hidden min-[481px]:inline">Remove</span>
        </button>
      </div>
    </li>
  );
}

/** "Add discount code" — a toggle on phones, always open on larger screens */
function DiscountCode() {
  const { discount, applyDiscount, removeDiscount } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function apply(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await applyDiscount(code);
      setMsg({ text: `Code applied — ${d.percent}% off your order.`, ok: true });
      setCode("");
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "That code isn’t valid.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  if (discount) {
    return (
      <div className="mb-1 flex items-center gap-2 py-1 text-[13.5px]">
        <TagIcon className="h-[17px] w-[17px] text-brown" />
        <span>
          <b className="font-semibold">{discount.code}</b> applied · {discount.percent}% off
        </span>
        <button type="button" onClick={removeDiscount} className="ml-auto min-h-8 text-[13px] text-brown underline">
          Remove
        </button>
      </div>
    );
  }
  return (
    <div className="mb-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus());
        }}
        className="flex min-h-[34px] w-full items-center gap-2 text-[13.5px] text-brown tab:hidden"
      >
        <TagIcon className="h-[17px] w-[17px]" />
        Add discount code
        <ChevronDownIcon className={`ml-auto h-[17px] w-[17px] transition ${open ? "rotate-180" : ""}`} />
      </button>
      <form onSubmit={apply} className={`${open ? "flex" : "hidden"} items-center gap-2 rounded-xl border border-[#d9c8c0] bg-white py-[3px] pr-[3px] pl-3 tab:flex`}>
        <TagIcon className="h-[18px] w-[18px] text-cocoa-soft" />
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          aria-label="Discount code"
          autoComplete="off"
          className="min-h-[38px] min-w-0 flex-1 bg-transparent text-[16px] uppercase outline-none placeholder:normal-case"
        />
        <button type="submit" disabled={busy || !code.trim()} className="rounded-[9px] bg-[linear-gradient(180deg,#a87458,#8e5d40)] px-[18px] py-2 text-[14px] text-white disabled:opacity-50">
          {busy ? "…" : "Apply"}
        </button>
      </form>
      {msg && <p className={`mt-1 text-[12.5px] ${msg.ok ? "text-[#2f7d4f]" : "text-wine"}`}>{msg.text}</p>}
    </div>
  );
}

/** one input of the delivery form (icon on the left, red border when wrong) */
function Field({ icon, bad, children }: { icon?: ReactNode; bad?: boolean; children: ReactNode }) {
  return (
    <label className={`mb-2 flex min-h-11 items-center gap-2.5 rounded-xl border bg-white px-3 focus-within:border-brown ${bad ? "border-wine" : "border-line"}`}>
      {icon}
      {children}
    </label>
  );
}
const input = "min-h-[42px] w-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-cocoa-soft";
const fieldIcon = "h-5 w-5 shrink-0 text-cocoa-soft";

const SHIPPING_LABEL: Record<ShippingMethod, string> = {
  standard: "Standard (5–8 business days)",
  express: "Express (2–3 business days)",
};

/**
 * Cart drawer (full screen on phones, a panel on the right on desktop), in 2 steps:
 *   1. Cart — sets with quantity / size, the free-set promo, discount code → Buy Now
 *   2. Delivery — contact + shipping address, shipping method, order notes → Check Out (Whop's secure payment)
 */
export default function CartPanel({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [signIn, setSignIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // the address typed last time (this browser) — the panel only renders after a click, never on the server
  const [address, setAddress] = useState<Address>(() => (typeof window === "undefined" ? EMPTY_ADDRESS : loadAddress()));
  const [bad, setBad] = useState<(keyof Address)[]>([]);
  const midRef = useRef<HTMLDivElement>(null);

  const missingSize = cart.items.some((i) => isSet(i) && (!i.size || !i.length));
  const { count, totals, pricing, discount, shippingMethod } = cart;
  const items = `${count} item${count === 1 ? "" : "s"}`;
  const express = (pricing?.expressShippingFee ?? 0) > 0;
  const showMethods = hasShippingBasics(address);
  const effectiveStep = count === 0 ? 1 : step;

  function set<K extends keyof Address>(k: K, v: Address[K]) {
    const next = { ...address, [k]: v };
    if (k === "country") next.state = "";
    setAddress(next);
    saveAddress(next);
    if (bad.includes(k)) setBad(bad.filter((x) => x !== k));
  }

  function toDelivery() {
    if (missingSize) return setError("Choose a size for every set.");
    setError("");
    setStep(2);
    if (!address.email && user?.email) set("email", user.email);
  }

  async function checkout() {
    const problems = addressProblems(address);
    setBad(problems);
    if (problems.length) {
      setError("Please complete the highlighted fields.");
      midRef.current?.querySelector<HTMLElement>(`[data-k="${problems[0]}"]`)?.focus();
      return;
    }
    if (!user) return setSignIn(true);
    setBusy(true);
    setError("");
    track("InitiateCheckout", {
      content_ids: cart.items.map((i) => i.productId ?? i.id),
      content_type: "product",
      contents: cart.items.map((i) => ({ id: i.productId ?? i.id, quantity: lineOptions(i).quantity, item_price: i.price })),
      num_items: cart.count,
      value: cart.totals.total,
      currency: pixelCurrency(cart.pricing?.currency),
    });
    try {
      window.location.assign(await startCheckout(cart.items, { notes: cart.notes, discountCode: discount?.code, shippingMethod, address }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  // Escape closes; the page behind doesn't scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  let designNo = 0;
  const names = new Map(cart.items.map((i) => [i.id, isProduct(i) ? (i.name ?? "Oreo Nails set") : `Custom Design #${++designNo}`]));
  const row = "flex justify-between gap-2.5 py-0.5 text-[14px] tab:py-[2px] tab:text-[14.5px]";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-cocoa/45" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="cart-title" className="drawer-right absolute inset-y-0 right-0 flex w-full flex-col bg-cream tab:w-[min(520px,100%)]">
        {/* phones: back + logo */}
        <div className="relative flex items-center justify-center px-[18px] pt-[max(0.75rem,env(safe-area-inset-top))] tab:hidden">
          <button type="button" onClick={effectiveStep === 2 ? () => setStep(1) : onClose} aria-label="Back" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full">
            <ChevronLeftIcon className="h-7 w-7" />
          </button>
          <Logo />
        </div>

        <div className="flex flex-none items-center gap-3 px-5 py-3.5 text-[22px] font-medium tab:text-[24px]">
          {effectiveStep === 2 ? (
            <button type="button" onClick={() => setStep(1)} aria-label="Back to cart" className="-ml-2 hidden h-11 w-11 place-items-center rounded-full hover:bg-pink-2 tab:grid">
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          ) : (
            <BagIcon className="h-[26px] w-[26px]" />
          )}
          <h2 id="cart-title">{effectiveStep === 1 ? "Cart" : "Delivery"}</h2>
          <small className="text-[15px] font-normal">({items})</small>
          <button type="button" onClick={onClose} aria-label="Close cart" autoFocus className="ml-auto hidden h-11 w-11 place-items-center rounded-full tab:grid">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center gap-3 px-2.5 py-[60px] text-center text-cocoa-soft">
            <BagIcon className="h-10 w-10" />
            <p>Your cart is empty.</p>
            <Link href="/shop" onClick={onClose} className="btn-brown btn-label inline-flex min-h-11 items-center rounded-full px-[22px] text-white">
              Shop nail sets
            </Link>
          </div>
        ) : effectiveStep === 1 ? (
          // ───────── step 1: the cart ─────────
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3.5">
            <PromoBar />
            <ul>
              {cart.items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  name={names.get(item.id)!}
                  onOpen={
                    isProduct(item)
                      ? undefined
                      : () => {
                          cart.openDesign(item);
                          onClose();
                        }
                  }
                />
              ))}
            </ul>
          </div>
        ) : (
          // ───────── step 2: delivery ─────────
          <div ref={midRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3.5">
            <div className="mt-0.5 mb-1.5 rounded-[14px] border border-line bg-ivory px-3 py-2">
              <div className="flex items-center gap-1.5 pb-1 text-[14px]">
                <b className="font-semibold">Your order</b>
                <span className="text-cocoa-soft">({items})</span>
                <button type="button" onClick={() => setStep(1)} className="ml-auto min-h-8 text-[13px] text-brown underline">
                  Edit
                </button>
              </div>
              {cart.items.map((i) => {
                const o = lineOptions(i);
                return (
                  <div key={i.id} className="flex items-center gap-2.5 border-t border-dashed border-line py-[5px] text-[13px]">
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob / store image */}
                      <img src={i.url} alt="" className="h-[34px] w-11 rounded-lg bg-white object-contain p-0.5" />
                      <i className="absolute -top-1.5 -right-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-[9px] bg-cocoa text-[10.5px] text-white not-italic">{o.quantity}</i>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
                      <b className="font-medium">{names.get(i.id)}</b>
                      <span className="truncate text-[12px] text-cocoa-soft">
                        {isSet(i) ? [o.size, o.length && titleCase(o.length), o.shape && titleCase(o.shape)].filter(Boolean).join(" / ") : "Tool"}
                      </span>
                    </div>
                    <b className="font-medium">{money(i.price * o.quantity)}</b>
                  </div>
                );
              })}
            </div>

            <h5 className="mt-3.5 mb-2 text-[15px] font-semibold">Contact</h5>
            <Field icon={<MailIcon className={fieldIcon} />} bad={bad.includes("email")}>
              <input data-k="email" type="email" value={address.email} onChange={(e) => set("email", e.target.value)} placeholder="Email (optional)" autoComplete="email" className={input} />
            </Field>

            <h5 className="mt-3.5 mb-2 text-[15px] font-semibold">Delivery</h5>
            <Field icon={<PinIcon className={fieldIcon} />}>
              <span className="flex flex-1 flex-col">
                <small className="mt-1 text-[11px] text-cocoa-soft">Country/Region</small>
                <select value={address.country} onChange={(e) => set("country", e.target.value)} className="min-h-6 appearance-none bg-transparent pb-1 font-semibold outline-none">
                  {SHIP_COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </span>
              <ChevronDownIcon className="h-5 w-5 shrink-0" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <input value={address.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="First name (optional)" autoComplete="given-name" className={input} />
              </Field>
              <Field bad={bad.includes("lastName")}>
                <input data-k="lastName" value={address.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Last name" autoComplete="family-name" className={input} />
              </Field>
            </div>
            <Field icon={<HomeIcon className={fieldIcon} />} bad={bad.includes("address1")}>
              <input data-k="address1" value={address.address1} onChange={(e) => set("address1", e.target.value)} placeholder="Address" autoComplete="address-line1" className={input} />
            </Field>
            <Field icon={<BuildingIcon className={fieldIcon} />}>
              <input value={address.address2} onChange={(e) => set("address2", e.target.value)} placeholder="Apartment, suite, etc. (optional)" autoComplete="address-line2" className={input} />
            </Field>
            <div className="grid grid-cols-2 gap-2 min-[481px]:grid-cols-3">
              <div className="col-span-2 min-[481px]:col-span-1">
                <Field bad={bad.includes("city")}>
                  <input data-k="city" value={address.city} onChange={(e) => set("city", e.target.value)} placeholder="City" autoComplete="address-level2" className={input} />
                </Field>
              </div>
              <Field bad={bad.includes("state")}>
                {isUS(address) ? (
                  <select data-k="state" value={address.state} onChange={(e) => set("state", e.target.value)} aria-label="State" className={`${input} appearance-none`}>
                    <option value="">State</option>
                    {US_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input data-k="state" value={address.state} onChange={(e) => set("state", e.target.value)} placeholder="State / province" autoComplete="address-level1" className={input} />
                )}
              </Field>
              <Field bad={bad.includes("zip")}>
                <input
                  data-k="zip"
                  value={address.zip}
                  onChange={(e) => set("zip", e.target.value)}
                  placeholder={isUS(address) ? "ZIP code" : "Postal code"}
                  inputMode={isUS(address) ? "numeric" : "text"}
                  autoComplete="postal-code"
                  className={input}
                />
              </Field>
            </div>
            <Field icon={<PhoneIcon className={fieldIcon} />} bad={bad.includes("phone")}>
              <input data-k="phone" type="tel" value={address.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" autoComplete="tel" className={input} />
            </Field>

            <h5 className="mt-3.5 mb-2 text-[15px] font-semibold">Shipping method</h5>
            {!showMethods ? (
              <p className="flex items-center gap-2.5 rounded-xl bg-pink-2 px-3.5 py-3 text-[14px]">
                <TruckIcon className="h-5 w-5 shrink-0" />
                Enter your shipping address to view available shipping methods.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                {(["standard", ...(express ? ["express" as const] : [])] as ShippingMethod[]).map((m) => {
                  const fee = m === "express" ? (pricing?.expressShippingFee ?? 0) : cart.totals.subtotal - totals.discount >= (pricing?.freeShippingMin ?? 0) ? 0 : (pricing?.shippingFee ?? 0);
                  return (
                    <label key={m} className={`flex cursor-pointer items-center gap-3 border-b border-line px-3.5 py-3 text-[14px] last:border-0 ${shippingMethod === m ? "bg-pink-2/60" : ""}`}>
                      <input type="radio" name="ship-method" checked={shippingMethod === m} onChange={() => cart.setShippingMethod(m)} className="accent-[#6e412a]" />
                      <span className="flex-1">{SHIPPING_LABEL[m]}</span>
                      <b className="font-semibold">{fee > 0 ? money(fee) : "FREE"}</b>
                    </label>
                  );
                })}
              </div>
            )}

            <details className="group mt-2 border-b border-line" open={!!cart.notes || undefined}>
              <summary className="flex cursor-pointer list-none items-center gap-2.5 px-0.5 py-[13px] font-medium [&::-webkit-details-marker]:hidden">
                <NoteIcon className="h-[22px] w-[22px]" />
                Add order notes
                <ChevronDownIcon className="ml-auto h-[18px] w-[18px] transition group-open:rotate-180" />
              </summary>
              <div className="px-0.5 pb-3.5">
                <label htmlFor="cart-notes" className="mb-1.5 block text-[14px]">
                  Special instructions for seller
                </label>
                <textarea
                  id="cart-notes"
                  value={cart.notes}
                  onChange={(e) => cart.setNotes(e.target.value.slice(0, MAX_NOTES))}
                  maxLength={MAX_NOTES}
                  placeholder="e.g. Nail shape, color adjustments, or design details…"
                  className="min-h-20 w-full resize-y rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-brown"
                />
                <p className="text-right text-xs text-cocoa-soft">
                  {cart.notes.length}/{MAX_NOTES}
                </p>
              </div>
            </details>
          </div>
        )}

        {/* pinned summary */}
        {count > 0 && (
          <div className="flex-none border-t border-line bg-ivory px-[18px] pt-2 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-10px_24px_rgba(110,65,42,.07)] tab:pt-2.5">
            <DiscountCode />
            <div className={row}>
              <span>Subtotal{effectiveStep === 1 ? ` (${items})` : ""}</span>
              <b className="font-semibold">{money(totals.subtotal)}</b>
            </div>
            {totals.discount > 0 && (
              <div className={`${row} text-[#2f7d4f]`}>
                <span>
                  {totals.freeSets} free set{totals.freeSets === 1 ? "" : "s"}
                </span>
                <span>−{money(totals.discount)}</span>
              </div>
            )}
            {discount && totals.codeDiscount > 0 && (
              <div className={`${row} text-[#2f7d4f]`}>
                <span>Discount ({discount.code})</span>
                <span>−{money(totals.codeDiscount)}</span>
              </div>
            )}
            {effectiveStep === 1 ? (
              <div className={`${row} text-[13px] text-cocoa-soft`}>
                <span>Shipping &amp; taxes</span>
                <span>Calculated next step</span>
              </div>
            ) : (
              <>
                <div className={row}>
                  <span>Shipping</span>
                  <span className="text-cocoa-soft">{!showMethods ? "Enter shipping address" : totals.shipping ? money(totals.shipping) : "Free"}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2.5 pt-1 pb-1.5 text-[18px] font-semibold tab:pb-2 tab:text-[20px]">
                  <span>Total</span>
                  <span>
                    <small className="mr-1.5 text-[13px] font-normal">USD</small>
                    {money(totals.total)}
                  </span>
                </div>
              </>
            )}

            {error && <p className="mb-1.5 text-center text-sm text-wine">{error}</p>}

            {signIn && !user && effectiveStep === 2 ? (
              <div className="flex flex-col items-center gap-2 rounded-[18px] border border-line bg-cream p-3 text-center">
                <p className="text-[14px]">Sign in with Google to check out.</p>
                <GoogleSignInButton width={280} onSignedIn={() => setSignIn(false)} />
                <button type="button" onClick={() => setSignIn(false)} className="text-sm text-cocoa-soft underline">
                  Not now
                </button>
              </div>
            ) : effectiveStep === 1 ? (
              <button
                type="button"
                onClick={toDelivery}
                className="btn-brown mt-1.5 flex min-h-[46px] w-full items-center justify-between rounded-full px-[26px] text-[16px] font-semibold text-white tab:min-h-[50px] tab:text-[17px]"
              >
                <span>Buy Now</span>
                <span className="flex items-center gap-2">
                  {money(totals.subtotal - totals.discount - totals.codeDiscount)}
                  <ArrowRightIcon className="h-[18px] w-[18px]" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={checkout}
                disabled={busy || loading}
                className="btn-brown flex min-h-[46px] w-full items-center justify-between rounded-full px-[26px] text-[16px] font-semibold text-white disabled:opacity-60 tab:min-h-[50px] tab:text-[17px]"
              >
                {busy ? (
                  <span className="flex w-full items-center justify-center gap-2.5 text-[15px] font-medium">
                    <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                    Opening secure checkout…
                  </span>
                ) : (
                  <>
                    <span>Check Out</span>
                    <span className="flex items-center gap-2">
                      {money(totals.total)}
                      <LockIcon className="h-[18px] w-[18px]" />
                    </span>
                  </>
                )}
              </button>
            )}
            <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-cocoa-soft tab:mt-1.5 tab:text-[13px]">
              <LockIcon className="h-[14px] w-[14px]" />
              Secure checkout by Whop · Taxes calculated at payment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
