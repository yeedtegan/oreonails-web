"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clearCart,
  deleteCartItem,
  getCartNotes,
  getCartOwner,
  listCart,
  saveCartItem,
  setCartNotes,
  setCartOwner,
  setOpenSessionId,
  type StoredCartItem,
} from "@/lib/designStore";
import { priceCart, type CartTotals, type PricingRules } from "@/lib/pricing";
import { hasSize, productImage, type Product, type ProductCategory } from "@/lib/shop";
import { useAuth } from "./AuthContext";

export type CartItem = StoredCartItem & { url: string };

/** quantity / size / length / shape of a cart line */
export type LineOptions = { quantity: number; size: string | null; length: string | null; shape: string | null };

/** "show this design again" — handled by the studio, which reopens the session + chat */
export type OpenDesignRequest = { sessionId: string; versionId: string; fallback: Blob; nonce: number };

type Cart = {
  items: CartItem[];
  /** number of sets / pieces (quantities added up) */
  count: number;
  /** custom design — priced by the store (pricing.pricePerDesign) */
  add: (item: { id: string; sessionId: string; blob: Blob }) => void;
  addProduct: (product: Product, options?: Partial<LineOptions>) => void;
  update: (id: string, options: Partial<LineOptions>) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  openDesign: (item: CartItem) => void;
  openRequest: OpenDesignRequest | null;
  notes: string;
  setNotes: (notes: string) => void;
  /** promo + shipping rules from the store (null while loading / unreachable) */
  pricing: PricingRules | null;
  totals: CartTotals;
};

const CartContext = createContext<Cart | null>(null);

/** window event that opens the cart panel (the header listens) */
export const OPEN_CART_EVENT = "oreo:open-cart";
export const openCart = () => window.dispatchEvent(new Event(OPEN_CART_EVENT));

const MAX_QUANTITY = 10;
export const productLineId = (productId: string) => `product-${productId}`;
export const isProduct = (i: StoredCartItem) => i.kind === "product";
export const lineOptions = (i: { quantity?: number; size?: string | null; length?: string | null; shape?: string | null }): LineOptions => ({
  quantity: i.quantity ?? 1,
  size: i.size ?? null,
  length: i.length ?? null,
  shape: i.shape ?? null,
});
/** counts toward "x sets get y free" (tools don't) */
export const isSet = (i: StoredCartItem) => !isProduct(i) || hasSize(i.category as ProductCategory);

type RemoteItem = { designId: string; sessionId: string; price: number; addedAt: string } & LineOptions;
type RemoteProduct = { productId: string; name: string; price: number; category: string; lengths?: string[]; addedAt: string } & LineOptions;

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

/** save one line in the signed-in customer's account cart (a design with its image, or a product) */
async function uploadItem(item: StoredCartItem): Promise<boolean> {
  const o = lineOptions(item);
  let res: Response | null;
  if (isProduct(item)) {
    res = await fetch(`/api/cart/products/${encodeURIComponent(item.productId!)}`, {
      method: "PUT",
      ...json({ ...o, addedAt: new Date(item.addedAt).toISOString() }),
    }).catch(() => null);
  } else {
    if (!item.blob) return false;
    const form = new FormData();
    form.append("image", item.blob, `${item.id}.png`);
    form.append("sessionId", item.sessionId);
    form.append("addedAt", new Date(item.addedAt).toISOString());
    form.append("quantity", String(o.quantity));
    if (o.size) form.append("size", o.size);
    if (o.length) form.append("length", o.length);
    if (o.shape) form.append("shape", o.shape);
    res = await fetch(`/api/cart/${encodeURIComponent(item.id)}`, { method: "PUT", body: form }).catch(() => null);
  }
  return !!res?.ok;
}

/** change quantity / size of a line already in the account cart */
async function patchItem(item: StoredCartItem): Promise<boolean> {
  if (isProduct(item)) return uploadItem(item);
  const res = await fetch(`/api/cart/${encodeURIComponent(item.id)}`, { method: "PATCH", ...json(lineOptions(item)) }).catch(() => null);
  return !!res?.ok;
}

const deleteRemote = (item: StoredCartItem) =>
  fetch(isProduct(item) ? `/api/cart/products/${encodeURIComponent(item.productId!)}` : `/api/cart/${encodeURIComponent(item.id)}`, {
    method: "DELETE",
  }).catch(() => {});

const sameOptions = (a: LineOptions, b: LineOptions) => a.quantity === b.quantity && a.size === b.size && a.length === b.length && a.shape === b.shape;

/**
 * Bring the local cart (IndexedDB) in line with the account:
 * - signed out → a guest cart; the copy of an account cart is dropped (it stays in the account)
 * - signed in → lines not in the account yet (the guest cart, changes made offline) are uploaded,
 *   then the local cart mirrors the account cart (lines added / changed on other devices are taken over).
 */
async function syncCart(userId: string | null): Promise<void> {
  const owner = await getCartOwner();
  if (!userId) {
    if (owner) {
      await clearCart();
      await setCartOwner(undefined);
    }
    return;
  }
  if (owner && owner !== userId) await clearCart(); // another account's cart
  await setCartOwner(userId);

  for (const item of await listCart()) {
    if (!item.synced && (await uploadItem(item))) await saveCartItem({ ...item, synced: true });
  }

  const res = await fetch("/api/cart", { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return; // offline / store down: keep the local copy, sync again next time
  const data = (await res.json().catch(() => ({}))) as { items?: RemoteItem[]; products?: RemoteProduct[] };
  const remote = new Map<string, Omit<StoredCartItem, "addedAt" | "blob" | "synced"> & { addedAt: string }>();
  for (const r of data.items ?? []) remote.set(r.designId, { id: r.designId, kind: "design", sessionId: r.sessionId, price: r.price, ...lineOptions(r), addedAt: r.addedAt });
  for (const p of data.products ?? []) {
    remote.set(productLineId(p.productId), {
      id: productLineId(p.productId),
      kind: "product",
      sessionId: "",
      productId: p.productId,
      name: p.name,
      category: p.category,
      lengthOptions: p.lengths ?? [],
      imageUrl: productImage({ id: p.productId, updatedAt: "" }),
      price: p.price,
      ...lineOptions(p),
      addedAt: p.addedAt,
    });
  }
  const local = await listCart();
  const have = new Set(local.map((i) => i.id));

  await Promise.all([
    // removed or bought on another device
    ...local.filter((i) => i.synced && !remote.has(i.id)).map((i) => deleteCartItem(i.id)),
    // the store sets the price; changes made on another device
    ...local
      .filter((i) => i.synced && remote.has(i.id))
      .map((i) => {
        const r = remote.get(i.id)!;
        if (r.price === i.price && r.name === i.name && !r.lengthOptions && sameOptions(lineOptions(r), lineOptions(i))) return;
        return saveCartItem({ ...i, price: r.price, name: r.name ?? i.name, lengthOptions: r.lengthOptions ?? i.lengthOptions, ...lineOptions(r) });
      }),
    // added on another device
    ...[...remote.values()]
      .filter((r) => !have.has(r.id))
      .map(async (r) => {
        const addedAt = Date.parse(r.addedAt);
        if (r.kind === "product") return saveCartItem({ ...r, addedAt, synced: true });
        const img = await fetch(`/api/cart/${encodeURIComponent(r.id)}/image`).catch(() => null);
        const blob = img?.ok ? await img.blob().catch(() => null) : null;
        if (!blob) return;
        await saveCartItem({ ...r, blob, addedAt, synced: true });
      }),
  ]);
}

const urlOf = (s: StoredCartItem) => (s.blob ? URL.createObjectURL(s.blob) : (s.imageUrl ?? ""));
const revoke = (i: CartItem) => i.blob && URL.revokeObjectURL(i.url);

/**
 * Cart kept in the browser (IndexedDB) so it shows instantly and survives reloads; when the customer
 * is signed in it is also saved in their account, so it follows them across devices.
 * Holds custom designs and Shop products, each with quantity / size / length.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  /** undefined while we don't know yet who is signed in */
  const userId = loading ? undefined : (user?.id ?? null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [openRequest, setOpenRequest] = useState<OpenDesignRequest | null>(null);
  const [notes, setNotesState] = useState("");
  const [pricing, setPricing] = useState<PricingRules | null>(null);
  const pricingRef = useRef(pricing);
  const itemsRef = useRef(items);
  const userIdRef = useRef(userId);
  /** bumped by add/update/remove, so a reload that raced with them reads storage again */
  const mutations = useRef(0);
  /** syncs run one after another (sign in then out quickly…) */
  const syncChain = useRef<Promise<void>>(Promise.resolve());
  useLayoutEffect(() => {
    itemsRef.current = items;
    userIdRef.current = userId;
    pricingRef.current = pricing;
  });

  useEffect(() => {
    getCartNotes().then((n) => n && setNotesState(n));
    fetch("/api/pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((p: PricingRules | null) => p && setPricing(p))
      .catch(() => {});
  }, []);

  /** show what is in storage, keeping the object URLs of designs already on screen */
  const reload = useCallback(async () => {
    let stored: StoredCartItem[];
    let before: number;
    do {
      before = mutations.current;
      stored = await listCart();
    } while (before !== mutations.current);

    const current = new Map(itemsRef.current.map((i) => [i.id, i]));
    const next = stored.map((s): CartItem => {
      const c = current.get(s.id);
      return c?.blob ? { ...s, blob: c.blob, url: c.url } : { ...s, url: urlOf(s) };
    });
    const keep = new Set(next.map((i) => i.id));
    const gone = itemsRef.current.filter((i) => !keep.has(i.id));
    itemsRef.current = next;
    setItems(next);
    if (gone.length) setTimeout(() => gone.forEach(revoke)); // after the thumbnails unmount
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    (async () => {
      // the local cart is this customer's (or a guest cart about to be merged): show it right away
      const owner = await getCartOwner();
      if (cancelled) return;
      if (!owner || owner === userId) await reload();
      const run = syncChain.current.then(() => syncCart(userId));
      syncChain.current = run.catch((err) => console.warn("[cart] sync failed", err));
      await syncChain.current;
      if (!cancelled) await reload();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, reload]);

  useEffect(
    () => () => {
      itemsRef.current.forEach(revoke);
    },
    [],
  );

  /** write a line locally, then (signed in) to the account; marks it synced when the account has it */
  const persist = useCallback((stored: StoredCartItem, push: (i: StoredCartItem) => Promise<boolean>) => {
    const written = saveCartItem(stored);
    const owner = userIdRef.current;
    if (!owner) return;
    written
      .then(() => push(stored))
      .then((ok) => {
        if (!ok || userIdRef.current !== owner) return;
        const now = itemsRef.current.find((i) => i.id === stored.id);
        // removed while uploading → remove it there too; changed again meanwhile → that change is pushed itself
        if (!now) return deleteRemote(stored);
        if (sameOptions(lineOptions(now), lineOptions(stored))) return saveCartItem({ ...stored, synced: true });
      })
      .catch(() => {});
  }, []);

  const put = useCallback((entry: CartItem) => {
    mutations.current++;
    const exists = itemsRef.current.some((i) => i.id === entry.id);
    itemsRef.current = exists ? itemsRef.current.map((i) => (i.id === entry.id ? entry : i)) : [...itemsRef.current, entry];
    setItems(itemsRef.current);
  }, []);

  const add = useCallback(
    (item: { id: string; sessionId: string; blob: Blob }) => {
      if (itemsRef.current.some((i) => i.id === item.id)) return;
      // the store prices it again on sync / at checkout; the cart always shows the store's price (see `shown`)
      const price = pricingRef.current?.pricePerDesign ?? 0;
      const stored: StoredCartItem = { ...item, price, kind: "design", quantity: 1, size: null, length: null, addedAt: Date.now(), synced: false };
      put({ ...stored, url: URL.createObjectURL(item.blob) });
      persist(stored, uploadItem);
    },
    [put, persist],
  );

  const update = useCallback(
    (id: string, options: Partial<LineOptions>) => {
      const cur = itemsRef.current.find((i) => i.id === id);
      if (!cur) return;
      const o = { ...lineOptions(cur), ...options };
      o.quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.round(o.quantity)));
      if (sameOptions(o, lineOptions(cur))) return;
      const wasSynced = !!cur.synced;
      const { url, ...rest } = cur;
      const stored: StoredCartItem = { ...rest, ...o, synced: false };
      put({ ...stored, url });
      persist(stored, wasSynced ? patchItem : uploadItem);
    },
    [put, persist],
  );

  const addProduct = useCallback(
    (product: Product, options: Partial<LineOptions> = {}) => {
      const id = productLineId(product.id);
      const cur = itemsRef.current.find((i) => i.id === id);
      if (cur) return update(id, { ...options, quantity: lineOptions(cur).quantity + (options.quantity ?? 1) });
      const sized = hasSize(product.category);
      const stored: StoredCartItem = {
        id,
        kind: "product",
        sessionId: "",
        productId: product.id,
        name: product.name,
        category: product.category,
        lengthOptions: product.lengths,
        imageUrl: productImage(product),
        price: product.price,
        quantity: Math.min(MAX_QUANTITY, options.quantity ?? 1),
        size: sized ? (options.size ?? null) : null,
        length: sized ? (options.length ?? product.lengths[0] ?? null) : null,
        shape: sized ? (options.shape ?? product.shapes[0] ?? null) : null,
        addedAt: Date.now(),
        synced: false,
      };
      put({ ...stored, url: stored.imageUrl! });
      persist(stored, uploadItem);
    },
    [put, persist, update],
  );

  const remove = useCallback((id: string) => {
    const gone = itemsRef.current.find((i) => i.id === id);
    if (!gone) return;
    mutations.current++;
    deleteCartItem(id);
    if (userIdRef.current) deleteRemote(gone);
    itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
    setItems(itemsRef.current);
    setTimeout(() => revoke(gone)); // after the thumbnail unmounts
  }, []);

  const openDesign = useCallback((item: CartItem) => {
    if (!item.blob) return;
    // the studio lives on the home page: elsewhere (Shop) go there and let it reopen this design
    if (window.location.pathname !== "/") {
      setOpenSessionId(item.sessionId).then(() => router.push("/"));
      return;
    }
    setOpenRequest({ sessionId: item.sessionId, versionId: item.id, fallback: item.blob, nonce: Date.now() });
  }, [router]);

  const setNotes = useCallback((n: string) => {
    setNotesState(n);
    setCartNotes(n);
  }, []);

  const cart = useMemo<Cart>(() => {
    // custom designs always cost the store's current price (also ones saved in the cart before a price change)
    const designPrice = pricing?.pricePerDesign;
    const shown =
      designPrice === undefined ? items : items.map((i) => (i.kind !== "product" && i.price !== designPrice ? { ...i, price: designPrice } : i));
    const lines = shown.map((i) => ({ price: i.price, quantity: lineOptions(i).quantity, isSet: isSet(i) }));
    const totals = priceCart(lines, pricing ?? { tiers: [], shippingFee: 0, freeShippingMin: 0 });
    return {
      items: shown,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      add,
      addProduct,
      update,
      remove,
      has: (id) => items.some((i) => i.id === id),
      openDesign,
      openRequest,
      notes,
      setNotes,
      pricing,
      totals,
    };
  }, [items, add, addProduct, update, remove, openDesign, openRequest, notes, setNotes, pricing]);
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside <CartProvider>");
  return cart;
}
