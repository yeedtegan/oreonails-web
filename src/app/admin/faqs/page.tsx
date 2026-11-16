"use client";

import { useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { Button, Card, ErrorNote, Field, Modal, PageHeader, inputCls, textareaCls } from "@/components/admin/ui";

interface Faq {
  id: number;
  q: string;
  a: string;
  category: string;
  position: number;
}
type Draft = { id?: number; q: string; a: string; category: string; position: string };

export default function FaqsPage() {
  const { call, notify } = useAdmin();
  const { data, error, reload } = useAdminData<{ faqs: Faq[] }>("/faqs");
  const [d, setD] = useState<Draft | null>(null);
  const [err, setErr] = useState("");

  const faqs = data?.faqs ?? [];
  const categories = [...new Set(faqs.map((f) => f.category))];

  const save = async () => {
    if (!d) return;
    if (!d.q.trim() || !d.a.trim() || !d.category.trim()) return setErr("Question, answer and section are required.");
    setErr("");
    try {
      const body = { q: d.q.trim(), a: d.a.trim(), category: d.category.trim(), position: d.position ? Number(d.position) : undefined };
      await call(d.id ? `/faqs/${d.id}` : "/faqs", { method: d.id ? "PUT" : "POST", body });
      notify("FAQ saved");
      setD(null);
      reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const remove = async (f: Faq) => {
    if (!confirm(`Delete "${f.q}"?`)) return;
    try {
      await call(`/faqs/${f.id}`, { method: "DELETE" });
      notify("FAQ deleted");
      reload();
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader
        title="FAQs"
        subtitle="The first six (by order) appear on the home page; all appear on /pages/faq grouped by section."
        actions={<Button kind="primary" onClick={() => setD({ q: "", a: "", category: categories[0] ?? "General", position: "" })}>+ Add question</Button>}
      />
      <ErrorNote>{error}</ErrorNote>
      <div className="space-y-5">
        {categories.map((cat) => (
          <Card key={cat} title={cat}>
            <ul className="divide-y divide-[#f1ecef]">
              {faqs.filter((f) => f.category === cat).map((f) => (
                <li key={f.id} className="flex items-start gap-4 py-3">
                  <span className="mt-0.5 w-8 shrink-0 text-[12px] text-muted">#{f.position}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{f.q}</p>
                    <p className="mt-0.5 text-[13.5px] text-muted">{f.a}</p>
                  </div>
                  <div className="flex shrink-0 gap-3 text-[13px]">
                    <button className="underline" onClick={() => setD({ id: f.id, q: f.q, a: f.a, category: f.category, position: String(f.position) })}>Edit</button>
                    <button className="text-[#b0263c] underline" onClick={() => remove(f)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Modal open={!!d} onClose={() => setD(null)} title={d?.id ? "Edit question" : "Add question"}>
        {d && (
          <div className="space-y-4">
            <Field label="Question"><input className={inputCls} value={d.q} onChange={(e) => setD({ ...d, q: e.target.value })} /></Field>
            <Field label="Answer"><textarea className={textareaCls} value={d.a} onChange={(e) => setD({ ...d, a: e.target.value })} /></Field>
            <div className="grid grid-cols-[1fr_110px] gap-3">
              <Field label="Section" hint="Pick an existing one or type a new name">
                <input className={inputCls} list="faq-cats" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} />
                <datalist id="faq-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Order"><input className={inputCls} inputMode="numeric" value={d.position} placeholder="Last" onChange={(e) => setD({ ...d, position: e.target.value.replace(/\D/g, "") })} /></Field>
            </div>
            <ErrorNote>{err}</ErrorNote>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setD(null)}>Cancel</Button>
              <Button kind="primary" onClick={save}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
