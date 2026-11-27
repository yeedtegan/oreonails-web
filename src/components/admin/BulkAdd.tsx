"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CloseIcon } from "../icons";
import { LENGTHS, SHAPES, titleCase } from "@/lib/shop";
import { CATEGORY_ID, saveCategory, type AdminCategory, type AdminProduct } from "./api";
import { blank, saveProduct, slug } from "./productDraft";

const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Row = {
  key: string;
  file: File;
  url: string;
  id: string;
  name: string;
  category: string | null;
  /** the category isn't in the store yet: it is created (with this name) before the product */
  newCategory: string | null;
  shape: string | null;
  length: string | null;
  /** why it can't be added (bad file name, duplicate…) */
  problem: string | null;
  state: "ready" | "saving" | "done" | "error";
  error?: string;
};

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** "press-on", "press_on", "Press On Nails", "toenail" … → id of an existing category */
function categoryFrom(raw: string, categories: AdminCategory[]): string | null {
  const s = slug(raw);
  const c = categories.find((c) => s === c.id || s === slug(c.label) || s === c.id.replace(/s$/, "") || s.replace(/-/g, "") === c.id.replace(/-/g, ""));
  return c?.id ?? null;
}

/** "angel_glow" / "angel-glow" → "Angel Glow" */
const nameFrom = (raw: string) =>
  raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
    .slice(0, 120);

/**
 * file "category__ten_item.jpg" → one row to add (with a random shape + length for nail sets).
 * A category that doesn't exist yet becomes a new one: "nail_charms" → id "nail-charms", name "Nail Charms".
 */
function parseFile(file: File, takenIds: Set<string>, k: number, categories: AdminCategory[]): Row {
  const base = file.name.replace(/\.[^.]+$/, "");
  const split = base.indexOf("__");
  const rawCategory = split > 0 ? base.slice(0, split) : "";
  const existing = rawCategory ? categoryFrom(rawCategory, categories) : null;
  const newId = existing || !rawCategory ? null : slug(rawCategory).slice(0, 40).replace(/-+$/, "");
  const category = existing ?? (newId && CATEGORY_ID.test(newId) ? newId : null);
  const newCategory = !existing && category ? nameFrom(rawCategory).slice(0, 60) : null;
  const name = split > 0 ? nameFrom(base.slice(split + 2)) : "";
  const id = slug(name);
  const sized = category !== null && category !== "tools";
  let problem: string | null = null;
  if (!IMAGE_TYPES.includes(file.type)) problem = "Không phải ảnh JPG / PNG / WEBP";
  else if (file.size > MAX_BYTES) problem = "Ảnh lớn hơn 10MB";
  else if (split <= 0) problem = 'Tên file cần dạng "category__ten_item"';
  else if (!category) problem = `Loại "${rawCategory}" không đọc được (chỉ dùng chữ, số, "-" hoặc "_")`;
  else if (!id) problem = "Thiếu tên sản phẩm sau dấu __";
  else if (takenIds.has(id)) problem = `Mã "${id}" đã có`;
  return {
    key: `${file.name}-${file.size}-${file.lastModified}-${k}`,
    file,
    url: URL.createObjectURL(file),
    id,
    name,
    category,
    newCategory,
    shape: sized ? pick(SHAPES) : null,
    length: sized ? pick(LENGTHS) : null,
    problem,
    state: "ready",
  };
}

/** marks rows whose id repeats an earlier row (two files that make the same product) */
function markDuplicates(rows: Row[]): Row[] {
  const seen = new Set<string>();
  return rows.map((r) => {
    if (r.problem || !r.id) return r;
    if (seen.has(r.id)) return { ...r, problem: `Trùng tên với ảnh khác (mã "${r.id}")` };
    seen.add(r.id);
    return r;
  });
}

const field = "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-brown";
const label = "block text-[13px] font-medium text-cocoa-soft";

/**
 * Add many products at once from images named "category__ten_item.jpg": the category and name come from the file
 * name, one shape and one length are picked at random; price (and sale price) are set once for the whole batch.
 */
export default function BulkAdd({
  categories,
  onCategoryAdded,
  takenIds,
  nextPosition,
  onAdded,
  onClose,
}: {
  categories: AdminCategory[];
  onCategoryAdded: (c: AdminCategory) => void;
  takenIds: Set<string>;
  nextPosition: number;
  onAdded: (p: AdminProduct) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const urls = useRef<string[]>([]);

  // free the previews when the panel closes
  useEffect(
    () => () => {
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const taken = new Set([...takenIds, ...rows.filter((r) => r.state === "done").map((r) => r.id)]);
    const added = [...files].map((f, k) => parseFile(f, taken, rows.length + k, categories));
    urls.current.push(...added.map((r) => r.url));
    setRows((cur) => markDuplicates([...cur.filter((r) => r.state !== "done"), ...added]));
    setError("");
  }

  function remove(key: string) {
    setRows((cur) => markDuplicates(cur.filter((r) => r.key !== key).map((r) => (r.problem?.startsWith("Trùng") ? { ...r, problem: null } : r))));
  }

  /** another random shape / length for one row */
  function reroll(key: string) {
    setRows((cur) => cur.map((r) => (r.key === key && r.shape ? { ...r, shape: pick(SHAPES), length: pick(LENGTHS) } : r)));
  }

  const ready = rows.filter((r) => !r.problem && r.state !== "done");
  const done = rows.filter((r) => r.state === "done").length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready.length) return setError("Chưa có ảnh nào hợp lệ để thêm.");
    const p = Number(price);
    if (!(p > 0)) return setError("Nhập giá bán (> 0).");
    if (compareAt && !(Number(compareAt) > p)) return setError("Giá gốc phải lớn hơn giá bán (hoặc để trống).");
    setBusy(true);
    setError("");

    // new categories first (once each); if one can't be made, its products are skipped
    const failedCategories = new Map<string, string>();
    const toCreate = new Map(ready.filter((r) => r.newCategory && r.category).map((r) => [r.category!, r.newCategory!]));
    for (const [id, name] of toCreate) {
      try {
        onCategoryAdded(await saveCategory(id, name));
        setRows((cur) => cur.map((r) => (r.category === id ? { ...r, newCategory: null } : r)));
      } catch (err) {
        failedCategories.set(id, err instanceof Error ? err.message : "Lỗi");
      }
    }

    let position = nextPosition;
    // one at a time: each upload is a full image; the list fills in as they finish
    for (const row of ready) {
      const categoryError = failedCategories.get(row.category!);
      if (categoryError) {
        setRows((cur) => cur.map((r) => (r.key === row.key ? { ...r, state: "error", error: `Không tạo được loại: ${categoryError}` } : r)));
        continue;
      }
      setRows((cur) => cur.map((r) => (r.key === row.key ? { ...r, state: "saving", error: undefined } : r)));
      try {
        const saved = await saveProduct(
          row.id,
          {
            ...blank(position),
            id: row.id,
            name: row.name,
            price,
            compareAtPrice: compareAt,
            category: row.category!,
            shapes: row.shape ? [row.shape] : [],
            lengths: row.length ? [row.length] : [],
            active,
          },
          row.file,
        );
        position++;
        onAdded(saved);
        setRows((cur) => cur.map((r) => (r.key === row.key ? { ...r, state: "done" } : r)));
      } catch (err) {
        setRows((cur) => cur.map((r) => (r.key === row.key ? { ...r, state: "error", error: err instanceof Error ? err.message : "Lỗi" } : r)));
      }
    }
    setBusy(false);
  }

  const categoryLabel = (r: Row) => r.newCategory ?? categories.find((c) => c.id === r.category)?.label ?? r.category ?? "—";
  const newCategories = [...new Set(ready.filter((r) => r.newCategory).map((r) => r.newCategory!))];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-cocoa/40" onClick={() => !busy && onClose()} aria-hidden />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-title"
        className="drawer-right absolute inset-y-0 right-0 flex w-full flex-col bg-cream tab:w-[min(720px,100%)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="bulk-title" className="text-[19px] font-semibold">
            Thêm nhiều sản phẩm từ ảnh
          </h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng" className="grid h-10 w-10 place-items-center rounded-full hover:bg-pink-2">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-2xl border border-line bg-ivory p-4 text-[14px]">
            <p>
              Đặt tên file theo dạng <code className="rounded bg-pink-2 px-1.5 py-0.5">category__ten_item.jpg</code> — 2 dấu gạch dưới giữa loại và tên.
            </p>
            <p className="mt-1 text-cocoa-soft">
              Ví dụ: <code>press-on__angel_glow.jpg</code> → Press On Nails · “Angel Glow”. Loại đang có: {categories.map((c) => c.id).join(", ")}. Loại chưa
              có sẽ được tạo mới (vd <code>nail_charms__gold_star.jpg</code> → loại “Nail Charms”). Bộ móng được chọn ngẫu nhiên 1 dáng + 1 độ dài (bấm 🎲 để đổi).
            </p>
          </div>

          <label className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-[#e6cec3] bg-white px-4 py-6 text-center hover:border-brown">
            <span className="font-medium text-brown">Chọn ảnh (chọn được nhiều ảnh cùng lúc)</span>
            <span className="text-[13px] text-cocoa-soft">JPG / PNG / WEBP, mỗi ảnh tối đa 10MB</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {rows.length > 0 && (
            <ul className="mt-3 overflow-hidden rounded-2xl border border-line bg-ivory">
              {rows.map((r) => (
                <li key={r.key} className={`flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 ${r.problem ? "bg-wine/5" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                  <img src={r.url} alt="" className="h-12 w-[96px] shrink-0 rounded-lg bg-[#fcf1eb] object-cover" />
                  <div className="min-w-0 flex-1 text-[14px]">
                    <p className="truncate font-medium">{r.name || <span className="text-cocoa-soft">(không đọc được tên)</span>}</p>
                    <p className="truncate text-[12.5px] text-cocoa-soft" title={r.file.name}>
                      {r.file.name}
                    </p>
                    {r.problem ? (
                      <p className="text-[12.5px] text-wine">{r.problem}</p>
                    ) : (
                      <p className="flex flex-wrap items-center gap-1 text-[12.5px]">
                        <span className={`rounded-full px-2 py-px ${r.newCategory ? "border border-brown bg-white font-medium text-brown" : "bg-pink-2"}`}>
                          {r.newCategory ? `Loại mới: ${r.newCategory}` : categoryLabel(r)}
                        </span>
                        {r.shape && <span className="rounded-full bg-pink-2 px-2 py-px">{titleCase(r.shape)}</span>}
                        {r.length && <span className="rounded-full bg-pink-2 px-2 py-px">{titleCase(r.length)}</span>}
                        <span className="text-cocoa-soft">/shop/{r.id}</span>
                      </p>
                    )}
                    {r.state === "error" && <p className="text-[12.5px] text-wine">Lỗi: {r.error}</p>}
                  </div>
                  {r.state === "done" ? (
                    <span className="shrink-0 text-[13px] font-medium text-[#2f6b39]">✓ Đã thêm</span>
                  ) : r.state === "saving" ? (
                    <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-line border-t-brown" aria-label="Đang thêm" />
                  ) : (
                    <div className="flex shrink-0 gap-1">
                      {r.shape && !r.problem && (
                        <button type="button" onClick={() => reroll(r.key)} disabled={busy} title="Đổi dáng / độ dài ngẫu nhiên" className="grid h-9 w-9 place-items-center rounded-full hover:bg-pink-2">
                          🎲
                        </button>
                      )}
                      <button type="button" onClick={() => remove(r.key)} disabled={busy} aria-label={`Bỏ ${r.file.name}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-pink-2">
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid gap-3 rounded-2xl border border-line bg-ivory p-4 tab:grid-cols-2">
            <label className="block">
              <span className={label}>Giá bán cho tất cả (USD)</span>
              <input required type="number" min="0.01" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
            </label>
            <label className="block">
              <span className={label}>Giá gốc (gạch ngang, để trống nếu không giảm)</span>
              <input type="number" min="0.01" step="0.01" inputMode="decimal" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className={field} />
            </label>
            <label className="flex cursor-pointer items-center gap-3 tab:col-span-2">
              <input type="checkbox" className="ck-box" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Hiện ngay trên shop (bỏ chọn = thêm ở trạng thái ẩn để xem lại trước)
            </label>
          </div>
          {newCategories.length > 0 && (
            <p className="mt-3 rounded-xl border border-brown/30 bg-white px-3.5 py-2.5 text-[14px]">
              Sẽ tạo {newCategories.length} loại mới: <b>{newCategories.join(", ")}</b> — hiện trong bộ lọc “Category” của shop (không tự thêm vào menu trên cùng).
            </p>
          )}
          <p className="mt-2 text-[13px] text-cocoa-soft">Giá, Best Seller, bộ sưu tập… của từng sản phẩm sửa riêng sau trong danh sách.</p>
        </div>

        <div className="border-t border-line px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {error && (
            <p role="alert" className="mb-2.5 rounded-xl bg-wine/10 px-3.5 py-2 text-[14px] text-wine">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-full border border-line bg-white px-5">
              {done && !ready.length ? "Xong" : "Đóng"}
            </button>
            <button type="submit" disabled={busy || !ready.length} className="btn-brown min-h-11 flex-1 rounded-full font-medium text-white disabled:opacity-50">
              {busy ? `Đang thêm… (${done}/${done + ready.length})` : ready.length ? `Thêm ${ready.length} sản phẩm` : done ? `Đã thêm ${done} sản phẩm` : "Thêm sản phẩm"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
