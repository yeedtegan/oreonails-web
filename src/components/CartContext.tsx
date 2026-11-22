"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clearCart,
  deleteCartItem,
  getCartOwner,
  listCart,
  saveCartItem,
  setCartOwner,
  type StoredCartItem,
} from "@/lib/designStore";
import { useAuth } from "./AuthContext";

export type CartItem = StoredCartItem & { url: string };

/** "show this design again" — handled by the studio, which reopens the session + chat */
export type OpenDesignRequest = { sessionId: string; versionId: string; fallback: Blob; nonce: number };

type Cart = {
  items: CartItem[];
  add: (item: Omit<StoredCartItem, "addedAt" | "synced">) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  openDesign: (item: CartItem) => void;
  openRequest: OpenDesignRequest | null;
};

const CartContext = createContext<Cart | null>(null);

type RemoteItem = { designId: string; sessionId: string; price: number; addedAt: string };

/** save one design in the signed-in customer's account cart */
async function uploadItem(item: StoredCartItem): Promise<boolean> {
  const form = new FormData();
  form.append("image", item.blob, `${item.id}.png`);
  form.append("sessionId", item.sessionId);
  form.append("addedAt", new Date(item.addedAt).toISOString());
  const res = await fetch(`/api/cart/${encodeURIComponent(item.id)}`, { method: "PUT", body: form }).catch(() => null);
  return !!res?.ok;
}

/**
 * Bring the local cart (IndexedDB) in line with the account:
 * - signed out → a guest cart; the copy of an account cart is dropped (it stays in the account)
 * - signed in → items not in the account yet (the guest cart, adds made offline) are uploaded,
 *   then the local cart mirrors the account cart (designs added on other devices are downloaded).
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
  const { items: remote = [] } = (await res.json().catch(() => ({}))) as { items?: RemoteItem[] };
  const byId = new Map(remote.map((r) => [r.designId, r]));
  const local = await listCart();
  const have = new Set(local.map((i) => i.id));

  await Promise.all([
    // removed or bought on another device
    ...local.filter((i) => i.synced && !byId.has(i.id)).map((i) => deleteCartItem(i.id)),
    // the store sets the price
    ...local
      .filter((i) => i.synced && byId.has(i.id) && byId.get(i.id)!.price !== i.price)
      .map((i) => saveCartItem({ ...i, price: byId.get(i.id)!.price })),
    // added on another device
    ...remote
      .filter((r) => !have.has(r.designId))
      .map(async (r) => {
        const img = await fetch(`/api/cart/${encodeURIComponent(r.designId)}/image`).catch(() => null);
        const blob = img?.ok ? await img.blob().catch(() => null) : null;
        if (!blob) return;
        await saveCartItem({ id: r.designId, sessionId: r.sessionId, blob, price: r.price, addedAt: Date.parse(r.addedAt), synced: true });
      }),
  ]);
}

/**
 * Cart kept in the browser (IndexedDB) so it shows instantly and survives reloads; when the customer
 * is signed in it is also saved in their account, so it follows them across devices.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  /** undefined while we don't know yet who is signed in */
  const userId = loading ? undefined : (user?.id ?? null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [openRequest, setOpenRequest] = useState<OpenDesignRequest | null>(null);
  const itemsRef = useRef(items);
  const userIdRef = useRef(userId);
  /** bumped by add/remove, so a reload that raced with them reads storage again */
  const mutations = useRef(0);
  /** syncs run one after another (sign in then out quickly…) */
  const syncChain = useRef<Promise<void>>(Promise.resolve());
  useLayoutEffect(() => {
    itemsRef.current = items;
    userIdRef.current = userId;
  });

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
      return c ? { ...s, blob: c.blob, url: c.url } : { ...s, url: URL.createObjectURL(s.blob) };
    });
    const keep = new Set(next.map((i) => i.id));
    const gone = itemsRef.current.filter((i) => !keep.has(i.id));
    itemsRef.current = next;
    setItems(next);
    if (gone.length) setTimeout(() => gone.forEach((i) => URL.revokeObjectURL(i.url))); // after the thumbnails unmount
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
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    },
    [],
  );

  const add = useCallback((item: Omit<StoredCartItem, "addedAt" | "synced">) => {
    if (itemsRef.current.some((i) => i.id === item.id)) return;
    mutations.current++;
    const stored: StoredCartItem = { ...item, addedAt: Date.now(), synced: false };
    const written = saveCartItem(stored);
    const entry: CartItem = { ...stored, url: URL.createObjectURL(stored.blob) };
    itemsRef.current = [...itemsRef.current, entry]; // blocks a double add before the next render
    setItems((cur) => [...cur, entry]);

    const owner = userIdRef.current;
    if (owner) {
      written
        .then(() => uploadItem(stored))
        .then((ok) => {
          if (!ok || userIdRef.current !== owner) return;
          // still in the cart → mark as saved in the account; removed while uploading → remove it there too
          if (itemsRef.current.some((i) => i.id === stored.id)) return saveCartItem({ ...stored, synced: true });
          return fetch(`/api/cart/${encodeURIComponent(stored.id)}`, { method: "DELETE" }).then(() => {});
        })
        .catch(() => {});
    }
  }, []);

  const remove = useCallback((id: string) => {
    mutations.current++;
    deleteCartItem(id);
    if (userIdRef.current) fetch(`/api/cart/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    const gone = itemsRef.current.find((i) => i.id === id);
    itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
    setItems((cur) => cur.filter((i) => i.id !== id));
    if (gone) setTimeout(() => URL.revokeObjectURL(gone.url)); // after the thumbnail unmounts
  }, []);

  const openDesign = useCallback((item: CartItem) => {
    setOpenRequest({ sessionId: item.sessionId, versionId: item.id, fallback: item.blob, nonce: Date.now() });
  }, []);

  const cart = useMemo<Cart>(
    () => ({ items, add, remove, has: (id) => items.some((i) => i.id === id), openDesign, openRequest }),
    [items, add, remove, openDesign, openRequest],
  );
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside <CartProvider>");
  return cart;
}
