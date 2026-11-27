"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CloseIcon, SearchIcon } from "../icons";
import { LENGTHS, SHAPES, categoryLabel, titleCase } from "@/lib/shop";
import { adminFetch, productImageUrl, usd, type AdminCategory, type AdminProduct } from "./api";
import BulkAdd from "./BulkAdd";
import { blank, saveProduct, slug, toDraft, type Draft } from "./productDraft";

const field = "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-brown";
const label = "block text-[13px] font-medium text-cocoa-soft";

function Chips({ options, value, onChange }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`rounded-full border px-3.5 py-1.5 text-[14px] transition ${on ? "border-brown bg-brown text-white" : "border-line bg-white hover:border-brown"}`}
          >
            {titleCase(o)}
          </button>
        );
      })}
    </div>
  );
}

/** add / edit one product (side panel) */
function Editor({
  product,
  categories,
  nextPosition,
  takenIds,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  categories: AdminCategory[];
  nextPosition: number;
  takenIds: Set<string>;
  onClose: () => void;
  onSaved: (p: AdminProduct) => void;
}) {
  const isNew = !product;
  const [d, setD] = useState<Draft>(product ? toDraft(product) : blank(nextPosition));
  const [idTouched, setIdTouched] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product ? productImageUrl(product) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((cur) => ({ ...cur, [k]: v }));
  const id = isNew ? (idTouched ? d.id : slug(d.name)) : product.id;

  // the local preview of a picked file is freed when another is picked / the panel closes
  const localUrl = useRef<string | null>(null);
  useEffect(() => () => {
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
  }, []);
  function pickImage(file: File | null) {
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
    localUrl.current = file ? URL.createObjectURL(file) : null;
    setImage(file);
    setPreview(localUrl.current ?? (product ? productImageUrl(product) : null));
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (isNew && !id) return setError("Nhập tên hoặc mã sản phẩm.");
    if (isNew && takenIds.has(id)) return setError(`Mã "${id}" đã có — đổi mã khác.`);
    if (isNew && !image) return setError("Chọn ảnh sản phẩm.");
    setBusy(true);
    setError("");
    try {
      onSaved(await saveProduct(id, d, image));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-cocoa/40" onClick={() => !busy && onClose()} aria-hidden />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        className="drawer-right absolute inset-y-0 right-0 flex w-full flex-col bg-cream tab:w-[min(560px,100%)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="editor-title" className="text-[19px] font-semibold">
            {isNew ? "Thêm sản phẩm" : `Sửa: ${product.name}`}
          </h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng" className="grid h-10 w-10 place-items-center rounded-full hover:bg-pink-2">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <span className={label}>Ảnh (JPG / PNG / WEBP, tối đa 10MB)</span>
            <label className="mt-1 flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#e6cec3] bg-white p-3 hover:border-brown">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview / admin image
                <img src={preview} alt="" className="h-20 w-[200px] rounded-xl bg-[#fcf1eb] object-contain" />
              ) : (
                <span className="grid h-20 w-[200px] place-items-center rounded-xl bg-[#fcf1eb] text-[13px] text-cocoa-soft">Chưa có ảnh</span>
              )}
              <span className="text-[14px]">{preview ? "Đổi ảnh" : "Chọn ảnh"}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <label className="block">
            <span className={label}>Tên sản phẩm</span>
            <input required maxLength={120} value={d.name} onChange={(e) => set("name", e.target.value)} className={field} placeholder="Angel Glow" />
          </label>

          <label className="block">
            <span className={label}>Mã (dùng trong link /shop/…, không đổi được sau khi tạo)</span>
            <input
              value={id}
              disabled={!isNew}
              onChange={(e) => {
                setIdTouched(true);
                set("id", slug(e.target.value));
              }}
              className={`${field} disabled:bg-pink-2/40 disabled:text-cocoa-soft`}
              placeholder="angel-glow"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>Giá bán (USD)</span>
              <input required type="number" min="0.01" step="0.01" inputMode="decimal" value={d.price} onChange={(e) => set("price", e.target.value)} className={field} />
            </label>
            <label className="block">
              <span className={label}>Giá gốc (gạch ngang, để trống nếu không giảm)</span>
              <input type="number" min="0.01" step="0.01" inputMode="decimal" value={d.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} className={field} />
            </label>
          </div>

          <label className="block">
            <span className={label}>Loại</span>
            <select value={d.category} onChange={(e) => set("category", e.target.value as Draft["category"])} className={field}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          {d.category !== "tools" && (
            <>
              <div>
                <span className={label}>Dáng trong ảnh mẫu (chọn sẵn trên trang sản phẩm; khách vẫn chọn được mọi dáng)</span>
                <Chips options={SHAPES} value={d.shapes} onChange={(v) => set("shapes", v)} />
              </div>
              <div>
                <span className={label}>Độ dài trong ảnh mẫu</span>
                <Chips options={LENGTHS} value={d.lengths} onChange={(v) => set("lengths", v)} />
              </div>
            </>
          )}

          <label className="block">
            <span className={label}>Bộ sưu tập (cách nhau bằng dấu phẩy, vd: holiday)</span>
            <input value={d.collections} onChange={(e) => set("collections", e.target.value)} className={field} placeholder="holiday" />
          </label>

          <label className="block">
            <span className={label}>Thứ tự hiển thị (số nhỏ đứng trước)</span>
            <input type="number" min="0" step="1" value={d.position} onChange={(e) => set("position", e.target.value)} className={field} />
          </label>

          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-ivory p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="ck-box" checked={d.active} onChange={(e) => set("active", e.target.checked)} />
              Đang bán (bỏ chọn = ẩn khỏi shop, đơn cũ vẫn giữ)
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="ck-box" checked={d.bestSeller} onChange={(e) => set("bestSeller", e.target.checked)} />
              Best Seller
            </label>
          </div>
        </div>

        <div className="border-t border-line px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {error && (
            <p role="alert" className="mb-2.5 rounded-xl bg-wine/10 px-3.5 py-2 text-[14px] text-wine">
              {error}
            </p>
          )}
          <div className="flex gap-2.5">
            <button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-full border border-line bg-white px-5">
              Huỷ
            </button>
            <button type="submit" disabled={busy} className="btn-brown min-h-11 flex-1 rounded-full font-medium text-white disabled:opacity-60">
              {busy ? "Đang lưu…" : isNew ? "Thêm sản phẩm" : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"all" | "active" | "hidden">("all");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [bulk, setBulk] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    Promise.all([adminFetch<{ products: AdminProduct[] }>("products"), adminFetch<{ categories: AdminCategory[] }>("categories")])
      .then(([p, c]) => {
        setCategories(c.categories);
        setProducts(p.products);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Lỗi"));
    return () => clearTimeout(toastTimer.current);
  }, []);

  function notify(text: string) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }

  function upsert(p: AdminProduct) {
    setProducts((list) => {
      const rest = (list ?? []).filter((x) => x.id !== p.id);
      return [...rest, p].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
    });
  }

  async function toggleActive(p: AdminProduct) {
    setToggling(p.id);
    try {
      const saved = await saveProduct(p.id, { ...toDraft(p), active: !p.active }, null);
      upsert(saved);
      notify(saved.active ? `Đã hiện "${p.name}" trên shop` : `Đã ẩn "${p.name}"`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không lưu được.");
    } finally {
      setToggling(null);
    }
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products ?? []).filter(
      (p) => (show === "all" || (show === "active") === p.active) && (!term || p.name.toLowerCase().includes(term) || p.id.includes(term)),
    );
  }, [products, q, show]);

  const counts = { all: products?.length ?? 0, active: products?.filter((p) => p.active).length ?? 0, hidden: products?.filter((p) => !p.active).length ?? 0 };
  const labelOf = (id: string) => categoryLabel(id, categories);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-[26px] font-semibold">Sản phẩm</h1>
        <button type="button" onClick={() => setBulk(true)} className="min-h-11 rounded-full border border-brown bg-white px-5 font-medium text-brown hover:bg-pink-2">
          Thêm nhiều từ ảnh
        </button>
        <button type="button" onClick={() => setEditing("new")} className="btn-brown min-h-11 rounded-full px-5 font-medium text-white">
          + Thêm sản phẩm
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-brown tab:max-w-sm">
          <SearchIcon className="h-5 w-5 text-cocoa-soft" />
          <span className="sr-only">Tìm sản phẩm</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc mã…" className="h-full min-w-0 flex-1 bg-transparent outline-none" />
        </label>
        {(["all", "active", "hidden"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={show === k}
            onClick={() => setShow(k)}
            className={`min-h-11 rounded-full border px-4 text-[14px] ${show === k ? "border-brown bg-brown text-white" : "border-line bg-white"}`}
          >
            {{ all: "Tất cả", active: "Đang bán", hidden: "Đang ẩn" }[k]} ({counts[k]})
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-xl bg-wine/10 px-4 py-3 text-wine">{error}</p>}
      {!products && !error && <p className="mt-10 text-center text-cocoa-soft">Đang tải…</p>}
      {products && list.length === 0 && <p className="mt-10 text-center text-cocoa-soft">Không có sản phẩm nào.</p>}

      {list.length > 0 && (
        <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-ivory">
          {list.map((p) => (
            <li key={p.id} className={`flex items-center gap-3.5 border-b border-line px-3 py-2.5 last:border-0 tab:px-4 ${p.active ? "" : "opacity-60"}`}>
              <button type="button" onClick={() => setEditing(p)} className="shrink-0" aria-label={`Sửa ${p.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin product image */}
                <img src={productImageUrl(p)} alt="" loading="lazy" className="h-12 w-[100px] rounded-lg bg-[#fcf1eb] object-cover mix-blend-multiply" />
              </button>
              <button type="button" onClick={() => setEditing(p)} className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-1.5 font-medium">
                  {p.name}
                  {p.bestSeller && <span className="rounded-full bg-pink px-2 py-px text-[11px] font-semibold text-brown">Best Seller</span>}
                  {p.collections.map((c) => (
                    <span key={c} className="rounded-full bg-pink-2 px-2 py-px text-[11px]">
                      {c}
                    </span>
                  ))}
                </span>
                <span className="block truncate text-[13px] text-cocoa-soft">
                  #{p.position} · {labelOf(p.category)}
                  {p.shapes.length > 0 && ` · ${p.shapes.map(titleCase).join("/")}`}
                  {p.lengths.length > 0 && ` · ${p.lengths.map(titleCase).join("/")}`}
                </span>
              </button>
              <div className="hidden text-right tab:block">
                <b className="font-semibold">{usd(p.price)}</b>
                {p.compareAtPrice != null && <s className="block text-[12px] text-cocoa-soft">{usd(p.compareAtPrice)}</s>}
              </div>
              <button
                type="button"
                onClick={() => toggleActive(p)}
                disabled={toggling === p.id}
                className={`min-h-9 shrink-0 rounded-full border px-3 text-[13px] disabled:opacity-50 ${p.active ? "border-[#bcd8bf] bg-[#eef7ef] text-[#2f6b39]" : "border-line bg-white text-cocoa-soft"}`}
                title={p.active ? "Bấm để ẩn khỏi shop" : "Bấm để hiện trên shop"}
              >
                {toggling === p.id ? "…" : p.active ? "Đang bán" : "Đang ẩn"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Editor
          product={editing === "new" ? null : editing}
          categories={categories}
          nextPosition={(products ?? []).reduce((m, p) => Math.max(m, p.position + 1), 0)}
          takenIds={new Set((products ?? []).map((p) => p.id))}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            upsert(p);
            setEditing(null);
            notify(editing === "new" ? `Đã thêm "${p.name}"` : `Đã lưu "${p.name}"`);
          }}
        />
      )}

      {bulk && (
        <BulkAdd
          categories={categories}
          onCategoryAdded={(c) => setCategories((cur) => [...cur.filter((x) => x.id !== c.id), c].sort((a, b) => a.position - b.position))}
          takenIds={new Set((products ?? []).map((p) => p.id))}
          nextPosition={(products ?? []).reduce((m, p) => Math.max(m, p.position + 1), 0)}
          onAdded={upsert}
          onClose={() => setBulk(false)}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-cocoa px-5 py-3 text-[14px] text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
