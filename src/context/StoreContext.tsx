"use client";

import { createContext, useContext } from "react";
import type { CartItem, Quote, ShippingRateId } from "@/lib/pricing";
import type { Order, User } from "@/lib/data";
import { isDb } from "@/lib/backend";
import { useDbStoreValue } from "./DbStore";
import { useShopifyStoreValue } from "./ShopifyStore";

export interface AddOptions {
  size?: string;
  shape?: string;
  customSizes?: string;
  qty?: number;
}

/** Client-side store. Same shape for both backends (see lib/backend.ts); the account/checkout fields are "db" only. */
export interface StoreValue {
  cart: CartItem[];
  favorites: string[];
  code: string;
  subscribed: boolean;
  hydrated: boolean;
  totals: Quote;
  quoting: boolean;
  quoteError: string;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  addToCart: (handle: string, opts?: AddOptions) => Promise<unknown>;
  setQty: (key: string, qty: number) => Promise<unknown>;
  toggleFavorite: (handle: string) => void;
  setCode: (code: string) => void;
  /** Starts checkout; false when the cart is empty. */
  checkout: () => Promise<boolean>;
  subscribe: () => void;

  // ---- "db" backend only (no-ops on Shopify, where these live on Shopify) ----
  user: User | null;
  token: string | null;
  orders: Order[];
  authenticate: (mode: "login" | "register", body: { name?: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  checkCode: (code: string) => Promise<boolean>;
  clearCart: () => void;
  shippingRate: ShippingRateId;
  setShippingRate: (rate: ShippingRateId) => void;
}

// Fixed at build time, so the same hook always runs.
const useStoreValue = isDb ? useDbStoreValue : useShopifyStoreValue;

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
