"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useCart, type CartItem } from "./CartContext";
import GoogleSignInButton from "./GoogleSignInButton";
import { CloseIcon } from "./icons";

const money = (n: number) => `$${n.toFixed(2)}`;

/** Sends the cart designs to our store → Whop checkout URL (prices are set by the store, not the browser). */
async function startCheckout(items: CartItem[]): Promise<string> {
  const form = new FormData();
  for (const item of items) {
    form.append("images", item.blob, `${item.id}.png`);
    form.append("designIds", item.id);
  }
  const res = await fetch("/api/checkout", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { purchaseUrl?: string; error?: string };
  if (!res.ok || !data.purchaseUrl) throw new Error(data.error ?? "Could not start checkout. Please try again.");
  return data.purchaseUrl;
}

/** Dropdown under the cart button: click a design to reopen it with its edit chat; Checkout pays with Whop. */
export default function CartPanel({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const { user, loading } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"cart" | "signin">("cart");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    if (!user) return setStep("signin");
    setBusy(true);
    setError("");
    try {
      window.location.assign(await startCheckout(cart.items));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  // close on outside click / Escape
  useEffect(() => {
    function onDown(e: PointerEvent) {
      const target = e.target as Element;
      if (!ref.current?.contains(target) && !target.closest("[data-cart-toggle]")) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const total = cart.items.reduce((sum, i) => sum + i.price, 0);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Your cart"
      className="glass-card absolute top-full right-4 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-3 sm:right-8 lg:right-12"
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <h2 className="font-serif text-lg text-cocoa">Your Cart</h2>
        <span className="text-sm text-cocoa-soft">
          {cart.items.length} {cart.items.length === 1 ? "design" : "designs"}
        </span>
      </div>

      {cart.items.length === 0 ? (
        <p className="px-1 py-6 text-center text-[15px] text-cocoa-soft">Your cart is empty. Create a design and tap “Add to Cart”.</p>
      ) : (
        <>
          <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {cart.items.map((item, i) => (
              <li key={item.id} className="flex items-center gap-2 rounded-xl bg-white/70 p-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    cart.openDesign(item);
                    onClose();
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition hover:opacity-85"
                  title="Open this design and its edit history"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob */}
                  <img src={item.url} alt="" className="h-14 w-[4.5rem] shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-cocoa">Custom design #{i + 1}</span>
                    <span className="block text-sm text-cocoa-soft">Tap to view &amp; edit</span>
                  </span>
                </button>
                <span className="font-semibold text-cocoa">{money(item.price)}</span>
                <button
                  type="button"
                  onClick={() => cart.remove(item.id)}
                  aria-label={`Remove custom design #${i + 1} from cart`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-cocoa-soft transition hover:bg-wine/10 hover:text-wine"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-gold/20 px-1 pt-3">
            <span className="font-semibold text-cocoa">Total</span>
            <span className="font-serif text-lg font-semibold text-gold-dark">{money(total)}</span>
          </div>
          {step === "signin" && !user ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-white/70 p-3 text-center">
              <p className="text-[15px] text-cocoa">Sign in with Google to check out.</p>
              <GoogleSignInButton width={260} onSignedIn={() => setStep("cart")} />
              <button type="button" onClick={() => setStep("cart")} className="text-sm text-cocoa-soft underline">
                Back to cart
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={checkout}
              disabled={busy || loading}
              className="btn-gold mt-3 w-full rounded-full px-6 py-3 font-serif text-lg text-white disabled:opacity-60"
            >
              {busy ? "Opening secure checkout…" : "Checkout"}
            </button>
          )}
          {error && <p className="mt-2 text-center text-sm text-wine">{error}</p>}
          <p className="mt-2 text-center text-xs text-cocoa-soft">Secure payment by Whop.</p>
        </>
      )}
    </div>
  );
}
