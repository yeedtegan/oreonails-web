"use client";

import { useEffect, useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { Button, Card, ErrorNote, Field, PageHeader, inputCls } from "@/components/admin/ui";

interface Settings {
  freeShippingThreshold: number;
  shippingFee: number;
  expressShippingFee: number;
  promoTiers: { buy: number; get: number }[];
}

export default function SettingsPage() {
  const { call, notify } = useAdmin();
  const { data, error } = useAdminData<{ settings: Settings }>("/settings");
  const [threshold, setThreshold] = useState("");
  const [fee, setFee] = useState("");
  const [express, setExpress] = useState("");
  const [tiers, setTiers] = useState<{ buy: string; get: string }[]>([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setThreshold(String(data.settings.freeShippingThreshold));
    setFee(String(data.settings.shippingFee));
    setExpress(String(data.settings.expressShippingFee));
    setTiers(data.settings.promoTiers.map((t) => ({ buy: String(t.buy), get: String(t.get) })));
  }, [data]);

  const save = async () => {
    const parsed = tiers.map((t) => ({ buy: Number(t.buy), get: Number(t.get) }));
    if (parsed.some((t) => !(t.buy >= 1) || !(t.get >= 1))) return setErr("Each tier needs buy ≥ 1 and get ≥ 1.");
    if (!(Number(threshold) >= 0) || !(Number(fee) >= 0) || !(Number(express) >= 0)) return setErr("Shipping values must be numbers ≥ 0.");
    setErr("");
    setSaving(true);
    try {
      await call("/settings", { method: "PUT", body: { freeShippingThreshold: Number(threshold), shippingFee: Number(fee), expressShippingFee: Number(express), promoTiers: parsed } });
      notify("Settings saved — prices in carts update immediately");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const num = (v: string) => v.replace(/[^\d.]/g, "");

  return (
    <>
      <PageHeader title="Settings" subtitle="Shipping and the mix & match promotion. Totals are recalculated on the server for every cart." actions={<Button kind="primary" onClick={save} disabled={saving || !data}>{saving ? "Saving…" : "Save"}</Button>} />
      <ErrorNote>{error || err}</ErrorNote>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <Card title="Shipping">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Free shipping from ($)" hint="Order total after discounts"><input className={inputCls} value={threshold} onChange={(e) => setThreshold(num(e.target.value))} /></Field>
            <Field label="Standard shipping fee ($)"><input className={inputCls} value={fee} onChange={(e) => setFee(num(e.target.value))} /></Field>
            <Field label="Express shipping fee ($)" hint="Always charged, even above the free-shipping threshold"><input className={inputCls} value={express} onChange={(e) => setExpress(num(e.target.value))} /></Field>
          </div>
        </Card>
        <Card title="Mix & match promotion" actions={<Button small onClick={() => setTiers([...tiers, { buy: "", get: "" }])} disabled={tiers.length >= 6}>+ Tier</Button>}>
          <p className="mb-3 text-[13px] text-muted">When a cart has buy + get nail sets, the cheapest “get” sets are free. The highest reached tier applies.</p>
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[14px]">
                Buy <input className={`${inputCls} w-16`} value={t.buy} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, buy: e.target.value.replace(/\D/g, "") } : x)))} />
                get <input className={`${inputCls} w-16`} value={t.get} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, get: e.target.value.replace(/\D/g, "") } : x)))} />
                free
                <span className="text-[12.5px] text-muted">({(Number(t.buy) || 0) + (Number(t.get) || 0)} sets)</span>
                <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="ml-auto text-[13px] text-[#b0263c] underline">Remove</button>
              </div>
            ))}
            {tiers.length === 0 && <p className="text-[13px] text-muted">No tiers — the promotion is off.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
