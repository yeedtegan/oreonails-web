"use client";

import { adminFetch, type AdminProduct } from "./api";
import { shrinkImage } from "@/lib/shrinkImage";

/** Form state of one product (strings while typing) + saving it (PUT /admin/products/<id>). */
export type Draft = {
  id: string;
  name: string;
  price: string;
  compareAtPrice: string;
  category: AdminProduct["category"];
  shapes: string[];
  lengths: string[];
  collections: string;
  bestSeller: boolean;
  position: string;
  active: boolean;
};

export const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const toDraft = (p: AdminProduct): Draft => ({
  id: p.id,
  name: p.name,
  price: String(p.price),
  compareAtPrice: p.compareAtPrice == null ? "" : String(p.compareAtPrice),
  category: p.category,
  shapes: p.shapes,
  lengths: p.lengths,
  collections: p.collections.join(", "),
  bestSeller: p.bestSeller,
  position: String(p.position),
  active: p.active,
});

export const blank = (position: number): Draft => ({
  id: "",
  name: "",
  price: "",
  compareAtPrice: "",
  category: "press-on",
  shapes: [],
  lengths: [],
  collections: "",
  bestSeller: false,
  position: String(position),
  active: true,
});

/** draft → what PUT /admin/products/<id> takes */
const toPayload = (d: Draft) => ({
  name: d.name.trim(),
  price: d.price === "" ? null : Number(d.price),
  compareAtPrice: d.compareAtPrice.trim() === "" ? null : Number(d.compareAtPrice),
  category: d.category,
  shapes: d.shapes,
  lengths: d.lengths,
  collections: d.collections
    .split(",")
    .map((c) => slug(c))
    .filter(Boolean),
  bestSeller: d.bestSeller,
  position: d.position === "" ? undefined : Number(d.position),
  active: d.active,
});

export async function saveProduct(id: string, d: Draft, image: File | null): Promise<AdminProduct> {
  const form = new FormData();
  form.append("product", JSON.stringify(toPayload(d)));
  if (image) form.append("image", await shrinkImage(image)); // web-sized: the shop grid loads many of these
  const { product } = await adminFetch<{ product: AdminProduct }>(`products/${encodeURIComponent(id)}`, { method: "PUT", body: form });
  return product;
}
