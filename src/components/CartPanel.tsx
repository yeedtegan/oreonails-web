"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { isProduct, isSet, lineOptions, useCart, type CartItem } from "./CartContext";
import GoogleSignInButton from "./GoogleSignInButton";
import { Logo } from "./Header";
import { ArrowRightIcon, BagIcon, ChevronDownIcon, ChevronLeftIcon, CloseIcon, GiftIcon, LockIcon, NoteIcon, TrashIcon, TruckIcon } from "./icons";
import { money, nextTier } from "@/lib/pricing";
import { LENGTHS, SIZES, titleCase } from "@/lib/shop";

const MAX_NOTES = 500;

/**
 * Sends the cart to our store → Whop checkout URL. Prices, the free-set promo and shipping are worked out by the store;
 * the browser only says what is in the cart (designs with their images, products, quantity / size, notes).
 */
async function startCheckout(items: CartItem[], notes: string): Promise<string> {
  const form = new FormData();
  const designs = items.filter((i) => !isProduct(i) && i.blob);
  for (const item of designs) {
    form.append("images", item.blob!, `${item.id}.png`);
    form.append("designIds", item.id);
  }
  form.append("designs", JSON.stringify(designs.map((i) => ({ designId: i.id, ...lineOptions(i) }))));
  form.append("products", JSON.stringify(items.filter(isProduct).map((i) => ({ productId: i.productId, ...lineOptions(i) }))));
  if (notes.trim()) form.append("notes", notes.trim());
  const res = await fetch("/api/checkout", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { purchaseUrl?: string; error?: string };
  if (!res.ok || !data.purchaseUrl) throw new Error(data.error ?? "Could not start checkout. Please try again.");
  return data.purchaseUrl;
}

/** "Add 1 more and get 1 set FREE" + progress over the promo steps + free shipping */
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
    <div className="rounded-2xl bg-[linear-gradient(135deg,#7a4a33,#5a3424)] px-5 py-4 text-white">
      {tiers.length > 0 && (
        <>
          <p className="flex items-center gap-3 text-[16px] font-medium">
            <GiftIcon className="h-[22px] w-[22px] shrink-0" />
            {next ? (
              <span>
                Add {next.sets - totals.sets} more and get {extra === 1 ? "1 set" : `${extra} sets`} <b>FREE</b>
              </span>
            ) : (
              <span>
                You’ve unlocked <b>{totals.freeSets} FREE sets</b>
              </span>
            )}
          </p>
          <div className="relative mt-5 mr-[26px] mb-[38px] ml-2 h-1.5 rounded-[3px] bg-white/25">
            <i className="absolute inset-y-0 left-0 rounded-[3px] bg-[#f4c7b8]" style={{ width: `${Math.min(1, totals.sets / max) * 100}%` }} />
            {tiers.map((t) => (
              <span key={t.sets} className="absolute -top-[7px] -translate-x-1/2 text-center text-[12px] leading-[1.25] whitespace-nowrap" style={{ left: `${(t.sets / max) * 100}%` }}>
                <span className={`mx-auto mb-1 block h-4 w-4 rounded-full border-2 border-white ${totals.sets >= t.sets ? "bg-[#f4c7b8]" : "bg-[#6a3e2b]"}`} />
                {t.sets} sets
                <br />
                <small className="opacity-80">{t.free} free</small>
              </span>
            ))}
          </div>
        </>
      )}
      {showShipping && (
        <p className={`flex items-center gap-2.5 text-[14px] ${tiers.length ? "border-t border-white/20 pt-2.5" : ""}`}>
          <TruckIcon className="h-[22px] w-[22px] shrink-0" />
          {goods >= freeShippingMin ? (
            <span>
              You get <b>free shipping</b>
            </span>
          ) : (
            `Add ${money(freeShippingMin - goods)} more for free shipping`
          )}
        </p>
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

/**
 * Cart drawer: full screen on phones, a panel on the right on desktop. Custom designs + Shop products with quantity /
 * size, the free-set promo, order notes; Checkout opens Whop's secure checkout.
 */
export default function CartPanel({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<"cart" | "signin">("cart");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const missingSize = cart.items.some((i) => isSet(i) && (!i.size || !i.length));

  async function checkout() {
    if (missingSize) return setError("Choose a size for every set.");
    if (!user) return setStep("signin");
    setBusy(true);
    setError("");
    try {
      window.location.assign(await startCheckout(cart.items, cart.notes));
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

  const { count, totals, pricing } = cart;
  const items = `${count} item${count === 1 ? "" : "s"}`;
  let designNo = 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-cocoa/45" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="cart-title" className="drawer-right absolute inset-y-0 right-0 flex w-full flex-col bg-cream tab:w-[min(520px,100%)]">
        {/* phones: back + logo */}
        <div className="relative flex items-center justify-center px-[18px] pt-[max(0.75rem,env(safe-area-inset-top))] tab:hidden">
          <button type="button" onClick={onClose} aria-label="Back" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full">
            <ChevronLeftIcon className="h-7 w-7" />
          </button>
          <Logo />
        </div>

        <div className="flex items-center gap-3 px-[22px] py-[18px] text-[24px] font-medium">
          <BagIcon className="h-[26px] w-[26px]" />
          <h2 id="cart-title">Cart</h2>
          <small className="text-[15px] font-normal">({items})</small>
          <button type="button" onClick={onClose} aria-label="Close cart" autoFocus className="ml-auto hidden h-11 w-11 place-items-center rounded-full tab:grid">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[18px] pb-[max(18px,env(safe-area-inset-bottom))]">
          {count === 0 ? (
            <div className="flex flex-col items-center gap-3 px-2.5 py-[60px] text-center text-cocoa-soft">
              <BagIcon className="h-10 w-10" />
              <p>Your cart is empty.</p>
              <Link href="/shop" onClick={onClose} className="btn-brown btn-label inline-flex min-h-11 items-center rounded-full px-[22px] text-white">
                Shop nail sets
              </Link>
            </div>
          ) : (
            <>
              <PromoBar />

              <ul>
                {cart.items.map((item) =>
                  isProduct(item) ? (
                    <CartLine key={item.id} item={item} name={item.name ?? "Oreo Nails set"} />
                  ) : (
                    <CartLine
                      key={item.id}
                      item={item}
                      name={`Custom Design #${++designNo}`}
                      onOpen={() => {
                        cart.openDesign(item);
                        onClose();
                      }}
                    />
                  ),
                )}
              </ul>

              <details className="group" open={!!cart.notes || undefined}>
                <summary className="flex cursor-pointer list-none items-center gap-2.5 px-1 py-3.5 [&::-webkit-details-marker]:hidden">
                  <NoteIcon className="h-[22px] w-[22px]" />
                  Add order notes
                  <ChevronDownIcon className="ml-auto h-[18px] w-[18px] transition group-open:rotate-180" />
                </summary>
                <label htmlFor="cart-notes" className="mb-1.5 block">
                  Special instructions for seller
                </label>
                <textarea
                  id="cart-notes"
                  value={cart.notes}
                  onChange={(e) => cart.setNotes(e.target.value.slice(0, MAX_NOTES))}
                  maxLength={MAX_NOTES}
                  placeholder="e.g. Nail shape, color adjustments, or design details…"
                  className="min-h-20 w-full rounded-xl border border-line bg-white p-3 text-[15px] outline-none focus:border-brown"
                />
                <p className="text-right text-xs text-cocoa-soft">
                  {cart.notes.length}/{MAX_NOTES}
                </p>
              </details>

              <div>
                <h3 className="-mx-[18px] my-2 bg-pink-2 px-[22px] py-1.5 text-[12px] font-semibold tracking-[0.18em]">ORDER SUMMARY</h3>
                <div className="flex justify-between gap-2.5 py-1">
                  <span>Subtotal ({items})</span>
                  <b>{money(totals.subtotal)}</b>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between gap-2.5 py-1 text-[#2f7d4f]">
                    <span>
                      {totals.freeSets} free set{totals.freeSets === 1 ? "" : "s"}
                    </span>
                    <span>−{money(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2.5 py-1">
                  <span>Shipping</span>
                  <span className="text-cocoa-soft">{!pricing ? "Calculated at checkout" : totals.shipping ? money(totals.shipping) : "Free"}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2.5 pt-2.5 text-[22px] font-semibold">
                  <span>Total</span>
                  <span>
                    <small className="mr-1.5 text-[13px] font-normal">USD</small>
                    {money(totals.total)}
                  </span>
                </div>
              </div>

              {step === "signin" && !user ? (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-[18px] border border-line bg-ivory p-4 text-center">
                  <p>Sign in with Google to check out.</p>
                  <GoogleSignInButton width={280} onSignedIn={() => setStep("cart")} />
                  <button type="button" onClick={() => setStep("cart")} className="text-sm text-cocoa-soft underline">
                    Back to cart
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={checkout}
                  disabled={busy || loading}
                  className="btn-brown mt-2 flex min-h-14 w-full items-center justify-between rounded-full px-7 text-[19px] font-semibold text-white disabled:opacity-60"
                >
                  {busy ? (
                    <span className="w-full text-center text-[16px] font-medium">Opening secure checkout…</span>
                  ) : (
                    <>
                      <span>Checkout</span>
                      <span className="flex items-center gap-2">
                        {money(totals.total)}
                        <ArrowRightIcon className="h-[18px] w-[18px]" />
                      </span>
                    </>
                  )}
                </button>
              )}
              {error && <p className="mt-2 text-center text-sm text-wine">{error}</p>}
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[13px] text-cocoa-soft">
                <LockIcon className="h-[15px] w-[15px]" />
                Taxes calculated at checkout · Secure payment by Whop
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
