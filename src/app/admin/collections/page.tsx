"use client";

import { useState } from "react";
import type { Collection, Pattern } from "@/lib/data";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { ArtEditor, Button, ErrorNote, Field, Modal, PageHeader, SingleImage, Table, inputCls, slugify, textareaCls } from "@/components/admin/ui";
import { CollectionArt } from "@/components/Art";

type Row = Collection & { position: number; productCount: number };
const GROUPS = [
  { v: "shop", label: "Shop all (menu: Shop All)" },
  { v: "collection", label: "Collection (menu: Shop by Collection)" },
  { v: "season", label: "Season (menu: Shop by Season)" },
  { v: "other", label: "Other (toenails, bundles, tools…)" },
];

interface Draft {
  isNew: boolean;
  handle: string;
  title: string;
  description: string;
  group: string;
  palette: [string, string, string, string];
  pattern: Pattern;
  image: string | null;
  position: string;
}

export default function CollectionsPage() {
  const { call, notify } = useAdmin();
  const { data, error, reload } = useAdminData<{ collections: Row[] }>("/collections");
  const [d, setD] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () =>
    setD({ isNew: true, handle: "", title: "", description: "", group: "collection", palette: ["#f4ece4", "#c4566c", "#f6dbe5", "#ffffff"], pattern: "hearts", image: null, position: "" });
  const openEdit = (c: Row) =>
    setD({ isNew: false, handle: c.handle, title: c.title, description: c.description, group: c.group, palette: c.palette, pattern: c.pattern, image: c.image ?? null, position: String(c.position) });

  const save = async () => {
    if (!d) return;
    const handle = d.handle || slugify(d.title);
    if (!d.title.trim() || !handle) return setErr("Title is required.");
    setSaving(true);
    setErr("");
    try {
      await call(`/collections/${handle}`, {
        method: "PUT",
        body: { title: d.title.trim(), description: d.description, group: d.group, palette: d.palette, pattern: d.pattern, image: d.image, position: d.position ? Number(d.position) : undefined },
      });
      notify(d.isNew ? "Collection created" : "Collection saved");
      setD(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Row) => {
    if (!confirm(`Delete "${c.title}"? Products stay, they are just removed from this collection.`)) return;
    try {
      await call(`/collections/${c.handle}`, { method: "DELETE" });
      notify("Collection deleted");
      reload();
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Collections" subtitle="Collections group products and appear in the menu, home page and filters." actions={<Button kind="primary" onClick={openNew}>+ Add collection</Button>} />
      <ErrorNote>{error}</ErrorNote>
      <Table head={["", "Collection", "Menu group", "Products", "Order", ""]}>
        {data?.collections.map((c) => (
          <tr key={c.handle} className="hover:bg-[#fcfafb]">
            <td className="w-16 px-4 py-2.5"><div className="h-12 w-12 overflow-hidden rounded-lg"><CollectionArt collection={c} className="h-full w-full" /></div></td>
            <td className="px-4 py-2.5">
              <button onClick={() => openEdit(c)} className="font-semibold hover:underline">{c.title}</button>
              <span className="block text-[12px] text-muted">/collections/{c.handle}</span>
            </td>
            <td className="px-4 py-2.5 capitalize">{c.group}</td>
            <td className="px-4 py-2.5">{c.productCount}</td>
            <td className="px-4 py-2.5 text-muted">{c.position}</td>
            <td className="px-4 py-2.5 text-right">
              <a href={`/collections/${c.handle}`} target="_blank" rel="noreferrer" className="mr-3 text-[13px] underline">View</a>
              {c.handle !== "shop-all" && <button onClick={() => remove(c)} className="text-[13px] text-[#b0263c] underline">Delete</button>}
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!d} onClose={() => setD(null)} title={d?.isNew ? "Add collection" : "Edit collection"} wide>
        {d && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input className={inputCls} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value, ...(d.isNew && { handle: slugify(e.target.value) }) })} />
              </Field>
              <Field label="Handle (URL)">
                <input className={inputCls} value={d.handle} disabled={!d.isNew} onChange={(e) => setD({ ...d, handle: slugify(e.target.value) })} />
              </Field>
              <Field label="Menu group">
                <select className={inputCls} value={d.group} onChange={(e) => setD({ ...d, group: e.target.value })}>
                  {GROUPS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}
                </select>
              </Field>
              <Field label="Order" hint="Lower numbers appear first">
                <input className={inputCls} inputMode="numeric" value={d.position} onChange={(e) => setD({ ...d, position: e.target.value.replace(/\D/g, "") })} placeholder="Last" />
              </Field>
            </div>
            <Field label="Description" hint="Shown as the tagline on the collection page">
              <textarea className={textareaCls.replace("min-h-[110px]", "min-h-[70px]")} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
            </Field>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold">Banner image</p>
              <SingleImage value={d.image} onChange={(v) => setD({ ...d, image: v })} />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold">Generated artwork (used without an image)</p>
              <ArtEditor palette={d.palette} pattern={d.pattern} onChange={(v) => setD({ ...d, ...v })} />
            </div>
            <ErrorNote>{err}</ErrorNote>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setD(null)}>Cancel</Button>
              <Button kind="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
