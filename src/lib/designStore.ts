"use client";

/**
 * Browser-side persistence (IndexedDB) for generated design sessions and the cart.
 * Images are kept, so a session can be reopened after a reload — including every version and the edit chat.
 * They are stored as raw bytes, not Blobs: iOS Safari loses the data of Blobs kept in IndexedDB (an image read
 * back shows as broken), so every Blob is turned into bytes on save and back into a fresh Blob on read. Every call fails soft: if IndexedDB is unavailable
 * (private mode, blocked storage) the app keeps working in memory only.
 */

export type StoredVersion = {
  id: string;
  blob: Blob;
  /** what was asked for this version (first prompt, or the chat edit) */
  instruction: string;
  /** the version this one was edited from (absent on the first design and on designs saved before it existed) */
  baseId?: string;
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
  /** nail shape the customer picked (Shop sets); absent = as pictured */
  shape?: string | null;
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

/** an image as stored: its bytes and type */
type Bytes = { __bytes: ArrayBuffer; type: string };
const isBytes = (v: unknown): v is Bytes => !!v && typeof v === "object" && "__bytes" in v;

// the same Blob is saved again on every change of a session: read it only once
const bytesCache = new WeakMap<Blob, Promise<Bytes>>();
function toBytes(b: Blob): Promise<Bytes> {
  let p = bytesCache.get(b);
  if (!p) {
    p = b.arrayBuffer().then((buf) => ({ __bytes: buf, type: b.type }));
    bytesCache.set(b, p);
  }
  return p;
}

/** a fresh Blob from stored data (bytes, or a Blob saved by an older version — copied so it is read now) */
async function fromStored(v: unknown): Promise<Blob> {
  if (isBytes(v)) {
    const blob = new Blob([v.__bytes], { type: v.type });
    bytesCache.set(blob, Promise.resolve(v));
    return blob;
  }
  const old = v as Blob;
  try {
    return new Blob([await old.arrayBuffer()], { type: old.type });
  } catch {
    return old; // its data is gone already
  }
}

/** Blob fields → bytes, for saving */
async function pack<T extends object>(obj: T, keys: (keyof T)[]): Promise<T> {
  const out = { ...obj } as Record<keyof T, unknown>;
  for (const k of keys) if (obj[k] instanceof Blob) out[k] = await toBytes(obj[k] as Blob);
  return out as T;
}
/** stored bytes → Blob fields, after reading */
async function unpack<T extends object>(obj: T, keys: (keyof T)[]): Promise<T> {
  const out = { ...obj } as Record<keyof T, unknown>;
  for (const k of keys) if (obj[k] != null) out[k] = await fromStored(obj[k]);
  return out as T;
}

const packSession = async (s: StoredSession): Promise<StoredSession> => ({
  ...s,
  versions: await Promise.all(s.versions.map((v) => pack(v, ["blob"]))),
});
const unpackSession = async (s: StoredSession): Promise<StoredSession> => ({
  ...s,
  versions: await Promise.all(s.versions.map((v) => unpack(v, ["blob"]))),
});

export const getSession = (id: string) =>
  soft(
    run<StoredSession | undefined>(SESSIONS, "readonly", (s) => s.get(id)).then((s) => (s ? unpackSession(s) : undefined)),
    undefined,
  );

export const saveSession = (session: StoredSession) =>
  soft(
    packSession(session).then((packed) => run(SESSIONS, "readwrite", (s) => s.put(packed))).then(() => {}),
    undefined,
  );

export const listCart = () =>
  soft(
    run<StoredCartItem[]>(CART, "readonly", (s) => s.getAll())
      .then((items) => Promise.all(items.map((i) => unpack(i, ["blob"]))))
      .then((items) => items.sort((a, b) => a.addedAt - b.addedAt)),
    [],
  );

export const saveCartItem = (item: StoredCartItem) =>
  soft(
    pack(item, ["blob"]).then((packed) => run(CART, "readwrite", (s) => s.put(packed))).then(() => {}),
    undefined,
  );

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

export const getPendingCreate = () =>
  getMeta<PendingCreate>("pendingCreate").then((p) => (p ? soft(unpack(p, ["photo"]), undefined) : undefined));
export const setPendingCreate = (p: PendingCreate | undefined) =>
  p ? soft(pack(p, ["photo"]), p).then((packed) => setMeta("pendingCreate", packed)) : setMeta("pendingCreate", undefined);

/** the design on screen, reopened when the customer comes back to the page */
export const getOpenSessionId = () => getMeta<string>("openSessionId");
export const setOpenSessionId = (id: string | undefined) => setMeta("openSessionId", id);

/** whose account cart the local cart mirrors (undefined = a guest cart) */
export const getCartOwner = () => getMeta<string>("cartOwner");
export const setCartOwner = (userId: string | undefined) => setMeta("cartOwner", userId);

/** order notes typed in the cart (sent with the next checkout) */
export const getCartNotes = () => getMeta<string>("cartNotes");
export const setCartNotes = (notes: string) => setMeta("cartNotes", notes || undefined);
