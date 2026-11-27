"use client";

/** Calls /api/admin/* (→ oreonails-api /admin/*). Errors come back as Error with the API's message. */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/admin/${path}`, { cache: "no-store", ...init });
  } catch {
    throw new AdminError("Mất kết nối. Kiểm tra mạng rồi thử lại.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new AdminError(data.error ?? `Lỗi ${res.status}`, res.status);
  return data;
}

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

export const usd = (n: number, currency = "usd") => new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(n);

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  /** id of a category (AdminCategory) */
  category: string;
  shapes: string[];
  lengths: string[];
  collections: string[];
  bestSeller: boolean;
  position: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = { id: string; label: string; position: number };

/** category id rule of oreonails-api */
export const CATEGORY_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** create a category (or rename one) */
export const saveCategory = (id: string, label: string) =>
  adminFetch<{ category: AdminCategory }>(`categories/${encodeURIComponent(id)}`, json("PUT", { label })).then((d) => d.category);

export type PromoTier = { sets: number; free: number };
export type AdminPricing = { tiers: PromoTier[]; shippingFee: number; freeShippingMin: number; pricePerDesign: number };

export type OrderStatus = "pending" | "paid" | "failed";
export type AdminOrderItem = {
  designId: string | null;
  productId: string | null;
  name: string | null;
  price: number;
  quantity: number;
  size: string | null;
  length: string | null;
  shape: string | null;
  image: string | null;
};
export type AdminOrder = {
  id: string;
  userId: string;
  email: string;
  status: OrderStatus;
  items: AdminOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  whopPaymentId: string | null;
  failureReason: string | null;
};
export type OrderStats = { status: OrderStatus; count: number; total: number }[];

export const productImageUrl = (p: Pick<AdminProduct, "id" | "updatedAt">) => `/api/admin/products/${encodeURIComponent(p.id)}/image?v=${encodeURIComponent(p.updatedAt)}`;
