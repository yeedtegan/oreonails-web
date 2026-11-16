"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_QUOTE, lineKey, type CartItem, type Quote, type ShippingRateId } from "@/lib/pricing";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Order, User } from "@/lib/data";
import type { AddOptions, StoreValue } from "./StoreContext";

/**
 * "db" backend: the cart lives in localStorage (handles + options only); every price, promotion and discount is
 * computed by the Oreo Nails API (POST /api/cart/quote). Checkout, accounts and orders are on the same API.
 */
interface Persisted {
  cart: CartItem[];
  favorites: string[];
  code: string;
  token: string | null;
  subscribed: boolean;
}

const initial: Persisted = { cart: [], favorites: [], code: "", token: null, subscribed: false };
const STORAGE_KEY = "oreonails-store-v2";

const itemsFor = (cart: CartItem[]) => cart.map(({ handle, qty, size, shape, customSizes }) => ({ handle, qty, size, shape, customSizes }));

export function useDbStoreValue(): StoreValue {
  const [state, setState] = useState<Persisted>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quote, setQuote] = useState<Quote>(EMPTY_QUOTE);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  // Chosen at checkout; not persisted.
  const [shippingRate, setShippingRate] = useState<ShippingRateId>("standard");

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

  // ---- server-side pricing: re-quote whenever the cart, code or shipping rate changes ----
  const quoteSeq = useRef(0);
  useEffect(() => {
    if (!hydrated) return;
    if (state.cart.length === 0) {
      setQuote(EMPTY_QUOTE);
      setQuoteError("");
      return;
    }
    const seq = ++quoteSeq.current;
    const ctrl = new AbortController();
    setQuoting(true);
    const t = setTimeout(() => {
      apiFetch<Quote>("/cart/quote", { body: { items: itemsFor(state.cart), code: state.code || undefined, shippingRate }, signal: ctrl.signal })
        .then((q) => {
          if (seq !== quoteSeq.current) return;
          setQuote(q);
          setQuoteError("");
          // Drop lines the server rejected (deleted product, invalid options).
          if (q.problems.length) {
            const bad = new Set(q.problems.map((p) => p.key));
            setState((s) => ({ ...s, cart: s.cart.filter((i) => !bad.has(i.key)) }));
          }
        })
        .catch((e) => {
          if ((e as Error).name === "AbortError" || seq !== quoteSeq.current) return;
          setQuoteError((e as Error).message);
        })
        .finally(() => seq === quoteSeq.current && setQuoting(false));
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [state.cart, state.code, shippingRate, hydrated]);

  // ---- account ----
  const refreshMe = useCallback(
    async (token = state.token) => {
      if (!token) {
        setUser(null);
        setOrders([]);
        return;
      }
      try {
        const me = await apiFetch<{ user: User; orders: Order[] }>("/me", { token });
        setUser(me.user);
        setOrders(me.orders);
      } catch (e) {
        // Expired or revoked session: sign out locally.
        if (e instanceof ApiError && e.status === 401) {
          setState((s) => ({ ...s, token: null }));
          setUser(null);
          setOrders([]);
        }
      }
    },
    [state.token],
  );

  useEffect(() => {
    if (hydrated) refreshMe();
    // Only on load / sign-in; refreshMe changes with the token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.token]);

  const authenticate = useCallback(async (mode: "login" | "register", body: { name?: string; email: string; password: string }) => {
    const res = await apiFetch<{ token: string; user: User }>(`/auth/${mode}`, { body });
    setState((s) => ({ ...s, token: res.token }));
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    const token = state.token;
    if (token) apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
    setState((s) => ({ ...s, token: null }));
    setUser(null);
    setOrders([]);
  }, [state.token]);

  // ---- cart ----
  const addToCart = useCallback(async (handle: string, opts: AddOptions = {}) => {
    const key = lineKey(handle, opts.size, opts.shape, opts.customSizes);
    const qty = opts.qty ?? 1;
    setState((s) => {
      const existing = s.cart.find((i) => i.key === key);
      return {
        ...s,
        cart: existing
          ? s.cart.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
          : [...s.cart, { key, handle, qty, size: opts.size, shape: opts.shape, customSizes: opts.customSizes }],
      };
    });
    setCartOpen(true);
  }, []);

  const setQty = useCallback(async (key: string, qty: number) => {
    setState((s) => ({ ...s, cart: qty <= 0 ? s.cart.filter((i) => i.key !== key) : s.cart.map((i) => (i.key === key ? { ...i, qty } : i)) }));
  }, []);

  const toggleFavorite = useCallback((handle: string) => {
    setState((s) => ({ ...s, favorites: s.favorites.includes(handle) ? s.favorites.filter((h) => h !== handle) : [...s.favorites, handle] }));
  }, []);

  const setCode = useCallback((code: string) => setState((s) => ({ ...s, code: code.trim().toUpperCase() })), []);
  const subscribe = useCallback(() => setState((s) => ({ ...s, subscribed: true })), []);

  /** Validates a discount code against the server without changing the cart. */
  const checkCode = useCallback(
    async (code: string) => (await apiFetch<Quote>("/cart/quote", { body: { items: itemsFor(state.cart), code } })).codeValid,
    [state.cart],
  );

  /** Called once an order is paid: the cart becomes the order. */
  const clearCart = useCallback(() => {
    setState((s) => ({ ...s, cart: [], code: "" }));
    setShippingRate("standard");
    refreshMe();
  }, [refreshMe]);

  /** The checkout page is part of this site for the "db" backend. */
  const checkout = useCallback(async () => {
    if (state.cart.length === 0) return false;
    window.location.assign("/checkout");
    return true;
  }, [state.cart.length]);

  // Item count is known locally, so badges update instantly without waiting for the quote.
  const count = useMemo(() => state.cart.reduce((s, i) => s + i.qty, 0), [state.cart]);
  const totals = useMemo(() => ({ ...quote, count }), [quote, count]);

  return {
    cart: state.cart,
    favorites: state.favorites,
    code: state.code,
    subscribed: state.subscribed,
    hydrated,
    totals,
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
    user,
    token: state.token,
    orders,
    authenticate,
    logout,
    refreshMe: () => refreshMe(),
    checkCode,
    clearCart,
    shippingRate,
    setShippingRate,
  };
}
