"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_QUOTE, type CartItem, type Quote } from "@/lib/pricing";
import type { ProductVariant } from "@/lib/data";
import type { AddOptions, StoreValue } from "./StoreContext";
import { cartApi, cartToQuote, CUSTOM_SIZES_ATTR, getProducts, type CartLineInput, type ShopifyCart } from "@/lib/shopify/storefront";

/**
 * The cart is a Shopify cart (Storefront Cart API); only its id, favorites and the pending discount code live in
 * localStorage. Prices, promotions and discount codes are computed by Shopify; checkout happens on Shopify.
 */
interface Persisted {
  cartId: string | null;
  favorites: string[];
  code: string;
  subscribed: boolean;
}

const initial: Persisted = { cartId: null, favorites: [], code: "", subscribed: false };
const STORAGE_KEY = "oreonails-store-v3";

/** Picks the Shopify variant for the chosen size/shape (single-variant products just use their only variant). */
function pickVariant(variants: ProductVariant[], opts: AddOptions) {
  if (variants.length <= 1) return variants[0];
  if (!opts.size && !opts.shape) return variants.find((v) => v.available) ?? variants[0];
  const eq = (a?: string, b?: string) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
  return variants.find((v) => (!v.size || eq(v.size, opts.size)) && (!v.shape || eq(v.shape, opts.shape)));
}

export function useShopifyStoreValue(): StoreValue {
  const [state, setState] = useState<Persisted>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quote, setQuote] = useState<Quote>(EMPTY_QUOTE);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  // ---- cart: every Shopify call runs through one queue so concurrent adds can't create two carts ----
  const cartIdRef = useRef<string | null>(null);
  const codeRef = useRef("");
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  const applyCart = useCallback((cart: ShopifyCart | null) => {
    cartIdRef.current = cart?.id ?? null;
    setState((s) => (s.cartId === (cart?.id ?? null) ? s : { ...s, cartId: cart?.id ?? null }));
    setQuote(cartToQuote(cart));
  }, []);

  const run = useCallback(
    <T,>(task: () => Promise<T>): Promise<T | undefined> => {
      pending.current++;
      setQuoting(true);
      const next = queue.current.then(task).then(
        (r) => {
          setQuoteError("");
          return r;
        },
        (e: Error) => {
          setQuoteError(e.message);
          return undefined;
        },
      );
      queue.current = next.finally(() => {
        if (--pending.current === 0) setQuoting(false);
      });
      return next;
    },
    [],
  );

  // Load the saved cart once. A completed (checked-out) or expired cart comes back null and is dropped.
  useEffect(() => {
    if (!hydrated) return;
    codeRef.current = state.code;
    if (!state.cartId) return;
    const id = state.cartId;
    run(async () => applyCart(await cartApi.get(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const variantCache = useRef(new Map<string, ProductVariant[]>());
  const variantsFor = useCallback(async (handle: string) => {
    const hit = variantCache.current.get(handle);
    if (hit) return hit;
    const [p] = await getProducts({ handles: [handle], variants: true });
    if (!p?.variants?.length) throw new Error("This product is no longer available.");
    variantCache.current.set(handle, p.variants);
    return p.variants;
  }, []);

  const addToCart = useCallback(
    (handle: string, opts: AddOptions = {}) => {
      setCartOpen(true);
      return run(async () => {
        const variant = pickVariant(await variantsFor(handle), opts);
        if (!variant) throw new Error(`Size ${opts.size ?? "?"} / ${opts.shape ?? "?"} isn't available for this set.`);
        if (!variant.available) throw new Error("Sorry, that option is sold out.");
        const line: CartLineInput = {
          merchandiseId: variant.id,
          quantity: opts.qty ?? 1,
          ...(opts.customSizes && { attributes: [{ key: CUSTOM_SIZES_ATTR, value: opts.customSizes }] }),
        };
        const id = cartIdRef.current;
        if (id) {
          try {
            return applyCart(await cartApi.add(id, [line]));
          } catch {
            // Cart expired or already checked out: start a fresh one below.
          }
        }
        applyCart(await cartApi.create([line], codeRef.current ? [codeRef.current] : []));
      });
    },
    [run, variantsFor, applyCart],
  );

  const setQty = useCallback(
    (key: string, qty: number) =>
      run(async () => {
        const id = cartIdRef.current;
        if (!id) return;
        applyCart(qty <= 0 ? await cartApi.remove(id, [key]) : await cartApi.update(id, [{ id: key, quantity: qty }]));
      }),
    [run, applyCart],
  );

  /** Saves a discount code (e.g. the newsletter welcome code) and applies it to the Shopify cart. */
  const setCode = useCallback(
    (raw: string) => {
      const code = raw.trim().toUpperCase();
      codeRef.current = code;
      setState((s) => ({ ...s, code }));
      run(async () => {
        const id = cartIdRef.current;
        if (id) applyCart(await cartApi.setCodes(id, code ? [code] : []));
      });
    },
    [run, applyCart],
  );

  const toggleFavorite = useCallback((handle: string) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(handle) ? s.favorites.filter((h) => h !== handle) : [...s.favorites, handle],
    }));
  }, []);

  const subscribe = useCallback(() => setState((s) => ({ ...s, subscribed: true })), []);

  /** Sends the shopper to Shopify checkout once queued cart updates have finished. */
  const checkout = useCallback(async () => {
    await queue.current;
    const id = cartIdRef.current;
    if (!id) return false;
    const cart = await cartApi.get(id).catch(() => null);
    if (!cart?.checkoutUrl || cart.lines.nodes.length === 0) {
      applyCart(cart);
      return false;
    }
    window.location.href = cart.checkoutUrl;
    return true;
  }, [applyCart]);

  const cart: CartItem[] = useMemo(
    () => quote.lines.map(({ key, handle, variantId, qty, size, shape, customSizes }) => ({ key, handle, variantId, qty, size, shape, customSizes })),
    [quote.lines],
  );

  return {
    cart,
    favorites: state.favorites,
    code: state.code,
    subscribed: state.subscribed,
    hydrated,
    totals: quote,
    quoting,
    quoteError,
    cartOpen,
    setCartOpen,
    searchOpen,
    setSearchOpen,
    addToCart,
    setQty,
    toggleFavorite,
    setCode,
    checkout,
    subscribe,
    // Accounts, order history and shipping rates live in Shopify for this backend.
    user: null,
    token: null,
    orders: [],
    authenticate: async () => {},
    logout: () => {},
    refreshMe: async () => {},
    checkCode: async () => false,
    clearCart: () => {},
    shippingRate: "standard",
    setShippingRate: () => {},
  };
}
