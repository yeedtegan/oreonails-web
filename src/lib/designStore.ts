"use client";

/**
 * Browser-side persistence (IndexedDB) for generated design sessions and the cart.
 * Images are kept as Blobs, so a session can be reopened after a reload — including
 * every version and the edit chat. Every call fails soft: if IndexedDB is unavailable
 * (private mode, blocked storage) the app keeps working in memory only.
 */

export type StoredVersion = {
  id: string;
  blob: Blob;
  /** what was asked for this version (first prompt, or the chat edit) */
  instruction: string;
  favorite: boolean;
  /** when it was generated (epoch ms); older saved designs don't have it */
  createdAt?: number;
};

export type StoredMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  /** epoch ms */
  time: number;
  status?: "pending" | "error";
  /** the edit to resend (failed edits, and edits still running) */
  retry?: { text: string; baseId: string };
  /** server job of a pending edit, to pick it up again after leaving the page */
  jobId?: string;
};

export type StoredSession = {
  id: string;
  createdAt: number;
  updatedAt: number;
  versions: StoredVersion[];
  messages: StoredMessage[];
};

export type StoredCartItem = {
  /** the design version in the cart, or "product-<productId>" for a Shop product */
  id: string;
  /** absent = a custom design (carts saved before the Shop existed) */
  kind?: "design" | "product";
  /** design session (custom designs; "" for products) */
  sessionId: string;
  /** the design image (custom designs) */
  blob?: Blob;
  /** Shop product */
  productId?: string;
  name?: string;
  category?: string;
  imageUrl?: string;
  /** lengths the product is sold in (empty / absent = any) */
  lengthOptions?: string[];
  /** unit price */
  price: number;
  /** absent = 1 */
  quantity?: number;
  size?: string | null;
  length?: string | null;
  addedAt: number;
  /** already saved in the signed-in customer's account cart (false/absent = not uploaded yet, e.g. a guest item) */
  synced?: boolean;
};

const DB_NAME = "oreo-nails";
const DB_VERSION = 2;
const SESSIONS = "sessions";
const CART = "cart";
const META = "meta";
type StoreName = typeof SESSIONS | typeof CART | typeof META;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SESSIONS)) db.createObjectStore(SESSIONS, { keyPath: "id" });
        if (!db.objectStoreNames.contains(CART)) db.createObjectStore(CART, { keyPath: "id" });
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      };
      req.onsuccess = () => {
        const db = req.result;
        // another tab needs a newer schema: let it upgrade (we reopen on next use)
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => (dbPromise = null)); // allow a later retry
  }
  return dbPromise;
}

async function run<T>(store: StoreName, mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = op(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function soft<T>(p: Promise<T>, fallback: T): Promise<T> {
  return p.catch((err) => {
    console.warn("[designStore]", err);
    return fallback;
  });
}

export const getSession = (id: string) =>
  soft(run<StoredSession | undefined>(SESSIONS, "readonly", (s) => s.get(id)), undefined);

export const saveSession = (session: StoredSession) =>
  soft(run(SESSIONS, "readwrite", (s) => s.put(session)).then(() => {}), undefined);

export const listCart = () =>
  soft(
    run<StoredCartItem[]>(CART, "readonly", (s) => s.getAll()).then((items) => items.sort((a, b) => a.addedAt - b.addedAt)),
    [],
  );

export const saveCartItem = (item: StoredCartItem) =>
  soft(run(CART, "readwrite", (s) => s.put(item)).then(() => {}), undefined);

export const deleteCartItem = (id: string) =>
  soft(run(CART, "readwrite", (s) => s.delete(id)).then(() => {}), undefined);

export const clearCart = () => soft(run(CART, "readwrite", (s) => s.clear()).then(() => {}), undefined);

/** a first design still being generated (so the studio can pick it up after leaving the page) */
export type PendingCreate = {
  jobId: string;
  photo: Blob;
  photoName: string;
  prompt: string;
  styles: string[];
  startedAt: number;
};

const getMeta = <T>(key: string) => soft(run<T | undefined>(META, "readonly", (s) => s.get(key)), undefined);
const setMeta = (key: string, value: unknown) =>
  soft(
    run<unknown>(META, "readwrite", (s) => (value === undefined ? s.delete(key) : s.put(value, key)) as IDBRequest<unknown>).then(() => {}),
    undefined,
  );

export const getPendingCreate = () => getMeta<PendingCreate>("pendingCreate");
export const setPendingCreate = (p: PendingCreate | undefined) => setMeta("pendingCreate", p);

/** the design on screen, reopened when the customer comes back to the page */
export const getOpenSessionId = () => getMeta<string>("openSessionId");
export const setOpenSessionId = (id: string | undefined) => setMeta("openSessionId", id);

/** whose account cart the local cart mirrors (undefined = a guest cart) */
export const getCartOwner = () => getMeta<string>("cartOwner");
export const setCartOwner = (userId: string | undefined) => setMeta("cartOwner", userId);

/** order notes typed in the cart (sent with the next checkout) */
export const getCartNotes = () => getMeta<string>("cartNotes");
export const setCartNotes = (notes: string) => setMeta("cartNotes", notes || undefined);
