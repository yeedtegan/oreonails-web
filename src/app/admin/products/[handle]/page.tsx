"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SHAPES, type Collection, type Pattern, type Product } from "@/lib/data";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { ArtEditor, Button, Card, ErrorNote, Field, ImageList, PageHeader, Toggle, inputCls, slugify, textareaCls } from "@/components/admin/ui";

interface Form {
  handle: string;
  title: string;
  type: "set" | "bundle" | "tool";
  price: string;
  compareAt: string;
  setsIncluded: string;
  description: string;
  collections: string[];
  images: string[];
  palette: [string, string, string, string];
  pattern: Pattern;
  shape: string;
  rank: string;
  active: boolean;
}

const EMPTY: Form = {
  handle: "",
  title: "",
  type: "set",
  price: "",
  compareAt: "",
  setsIncluded: "",
  description: "",
  collections: [],
  images: [],
  palette: ["#f8f4f6", "#f2d6cf", "#c4566c", "#ffffff"],
  pattern: "french",
  shape: "Almond",
  rank: "1000",
  active: true,
};

const fromProduct = (p: Product): Form => ({
  handle: p.handle,
  title: p.title,
  type: p.type,
  price: String(p.price),
  compareAt: p.compareAt ? String(p.compareAt) : "",
  setsIncluded: p.setsIncluded ? String(p.setsIncluded) : "",
  description: p.description,
  collections: p.collections.filter((c) => c !== "shop-all"),
  images: p.images ?? [],
  palette: p.palette,
  pattern: p.pattern,
  shape: p.shape,
  rank: String(p.rank),
  active: p.active !== false,
});

export default function ProductEditor() {
  const { handle } = useParams<{ handle: string }>();
  const isNew = handle === "new";
  const router = useRouter();
  const { call, notify } = useAdmin();
  const { data, error: loadError } = useAdminData<{ product: Product }>(isNew ? null : `/products/${handle}`);
  const { data: cols } = useAdminData<{ collections: Collection[] }>("/collections");
  const [f, setF] = useState<Form>(EMPTY);
  const [handleTouched, setHandleTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (data?.product) setF(fromProduct(data.product));
  }, [data]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const price = Number(f.price);
    const compareAt = f.compareAt ? Number(f.compareAt) : null;
    const h = isNew ? f.handle || slugify(f.title) : handle;
    if (!f.title.trim()) return setErr("Title is required.");
    if (!h) return setErr("Handle is required.");
    if (!(price > 0)) return setErr("Enter a price greater than 0.");
    if (compareAt !== null && !(compareAt > price)) return setErr("Compare-at price must be higher than the price (or leave it empty).");
    setErr("");
    setSaving(true);
    try {
      const res = await call<{ product: Product }>(`/products/${h}`, {
        method: "PUT",
        body: {
          title: f.title.trim(),
          type: f.type,
          price,
          compareAt,
          setsIncluded: f.type === "bundle" && f.setsIncluded ? Number(f.setsIncluded) : null,
          description: f.description,
          collections: f.collections,
          images: f.images,
          palette: f.palette,
          pattern: f.pattern,
          shape: f.shape,
          rank: Number(f.rank) || 1000,
          active: f.active,
        },
      });
      notify(isNew ? "Product created" : "Product saved");
      if (isNew) router.replace(`/admin/products/${res.product.handle}`);
      else setF(fromProduct(res.product));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${f.title}" permanently? Past orders keep their line items.`)) return;
    try {
      await call(`/products/${handle}`, { method: "DELETE" });
      notify("Product deleted");
      router.replace("/admin/products");
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  if (!isNew && !data && !loadError) return <p className="text-muted">Loading…</p>;

  return (
    <>
      <PageHeader
        title={isNew ? "Add product" : f.title || "Product"}
        subtitle={<Link href="/admin/products" className="underline">← All products</Link>}
        actions={
          <>
            {!isNew && f.active && <a href={`/products/${handle}`} target="_blank" rel="noreferrer"><Button>View on store ↗</Button></a>}
            <Button kind="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </>
        }
      />
      <ErrorNote>{loadError || err}</ErrorNote>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Details">
            <div className="space-y-4">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={f.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (isNew && !handleTouched) set("handle", slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Handle (URL)" hint={`/products/${isNew ? f.handle || "…" : handle}${isNew ? "" : " · can't be changed after creation"}`}>
                <input
                  className={inputCls}
                  value={isNew ? f.handle : handle}
                  disabled={!isNew}
                  onChange={(e) => {
                    setHandleTouched(true);
                    set("handle", slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Description">
                <textarea className={textareaCls} value={f.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Images">
            <ImageList value={f.images} onChange={(v) => set("images", v)} />
          </Card>

          <Card title="Generated artwork" actions={<span className="text-[12px] text-muted">Shown when there are no images</span>}>
            <ArtEditor
              palette={f.palette}
              pattern={f.pattern}
              shape={f.shape}
              variant={f.type === "bundle" ? "bundle" : f.type === "tool" ? "tool" : "set"}
              onChange={(v) => setF((s) => ({ ...s, ...v }))}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Status">
            <Toggle checked={f.active} onChange={(v) => set("active", v)} label={f.active ? "Visible on the store" : "Hidden from the store"} />
          </Card>

          <Card title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)">
                <input className={inputCls} inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} />
              </Field>
              <Field label="Compare-at ($)" hint="Shows a SAVE badge">
                <input className={inputCls} inputMode="decimal" value={f.compareAt} onChange={(e) => set("compareAt", e.target.value.replace(/[^\d.]/g, ""))} />
              </Field>
            </div>
          </Card>

          <Card title="Organisation">
            <div className="space-y-4">
              <Field label="Type">
                <select className={inputCls} value={f.type} onChange={(e) => set("type", e.target.value as Form["type"])}>
                  <option value="set">Nail set (customer picks size &amp; shape)</option>
                  <option value="bundle">Bundle</option>
                  <option value="tool">Tool / accessory</option>
                </select>
              </Field>
              {f.type === "bundle" && (
                <Field label="Sets included">
                  <input className={inputCls} inputMode="numeric" value={f.setsIncluded} onChange={(e) => set("setsIncluded", e.target.value.replace(/\D/g, ""))} />
                </Field>
              )}
              {f.type !== "tool" && (
                <Field label="Default shape">
                  <select className={inputCls} value={f.shape} onChange={(e) => set("shape", e.target.value)}>
                    {SHAPES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Best-seller rank" hint="Lower numbers sort first under “Best selling”">
                <input className={inputCls} inputMode="numeric" value={f.rank} onChange={(e) => set("rank", e.target.value.replace(/[^\d-]/g, ""))} />
              </Field>
              <div>
                <p className="mb-1.5 text-[13px] font-semibold">Collections</p>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-[#ebe4e9] p-2">
                  {cols?.collections
                    .filter((c) => c.handle !== "shop-all")
                    .map((c) => (
                      <label key={c.handle} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[13.5px] hover:bg-[#f8f4f6]">
                        <input
                          type="checkbox"
                          className="accent-plum"
                          checked={f.collections.includes(c.handle)}
                          onChange={() => set("collections", f.collections.includes(c.handle) ? f.collections.filter((x) => x !== c.handle) : [...f.collections, c.handle])}
                        />
                        {c.title}
                      </label>
                    ))}
                </div>
                {f.type !== "tool" && <p className="mt-1 text-[12px] text-muted">Always included in “All Products”.</p>}
              </div>
            </div>
          </Card>

          {!isNew && (
            <Card title="Danger zone">
              <p className="mb-3 text-[13px] text-muted">To take a product off sale temporarily, hide it instead.</p>
              <Button kind="danger" onClick={remove}>Delete product</Button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
