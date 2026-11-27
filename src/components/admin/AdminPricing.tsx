"use client";

import { useEffect, useState, type FormEvent } from "react";
import { TrashIcon } from "../icons";
import { adminFetch, json, usd, type AdminPricing } from "./api";

type Draft = { pricePerDesign: string; shippingFee: string; freeShippingMin: string; tiers: { sets: string; free: string }[] };

const toDraft = (p: AdminPricing): Draft => ({
  pricePerDesign: String(p.pricePerDesign),
  shippingFee: String(p.shippingFee),
  freeShippingMin: String(p.freeShippingMin),
  tiers: p.tiers.map((t) => ({ sets: String(t.sets), free: String(t.free) })),
});

const field = "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-brown";
const label = "block text-[13px] font-medium text-cocoa-soft";

/** Custom design price, "buy X get Y free" tiers, shipping — takes effect right away (no deploy). */
export default function AdminPricingView() {
  const [saved, setSaved] = useState<AdminPricing | null>(null);
  const [d, setD] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    adminFetch<{ pricing: AdminPricing }>("pricing")
      .then(({ pricing }) => {
        setSaved(pricing);
        setD(toDraft(pricing));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Lỗi"));
  }, []);

  if (!d) return error ? <p className="rounded-xl bg-wine/10 px-4 py-3 text-wine">{error}</p> : <p className="mt-10 text-center text-cocoa-soft">Đang tải…</p>;

  const set = (patch: Partial<Draft>) => {
    setD({ ...d, ...patch });
    setDone(false);
  };
  const setTier = (k: number, key: "sets" | "free", v: string) => set({ tiers: d.tiers.map((t, i) => (i === k ? { ...t, [key]: v } : t)) });
  const changed = saved && JSON.stringify(toDraft(saved)) !== JSON.stringify(d);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!d) return;
    setBusy(true);
    setError("");
    try {
      const { pricing } = await adminFetch<{ pricing: AdminPricing }>(
        "pricing",
        json("PUT", {
          pricePerDesign: Number(d.pricePerDesign),
          shippingFee: Number(d.shippingFee),
          freeShippingMin: Number(d.freeShippingMin),
          tiers: d.tiers.filter((t) => t.sets !== "" || t.free !== "").map((t) => ({ sets: Number(t.sets), free: Number(t.free) })),
        }),
      );
      setSaved(pricing);
      setD(toDraft(pricing));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.");
    } finally {
      setBusy(false);
    }
  }

  const ship = Number(d.shippingFee);
  const min = Number(d.freeShippingMin);

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <h1 className="text-[26px] font-semibold">Giá & khuyến mãi</h1>
      <p className="mt-1 text-cocoa-soft">Lưu xong là áp dụng ngay cho giỏ hàng và đơn mới, không cần deploy lại.</p>

      <section className="mt-6 rounded-2xl border border-line bg-ivory p-5">
        <h2 className="text-[17px] font-semibold">Bộ móng custom</h2>
        <label className="mt-3 block max-w-xs">
          <span className={label}>Giá 1 bộ custom (USD)</span>
          <input required type="number" min="0.01" step="0.01" inputMode="decimal" value={d.pricePerDesign} onChange={(e) => set({ pricePerDesign: e.target.value })} className={field} />
        </label>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-ivory p-5">
        <h2 className="text-[17px] font-semibold">Mua nhiều tặng bộ</h2>
        <p className="mt-1 text-[14px] text-cocoa-soft">Tính trên tổng số bộ trong giỏ (custom + bộ móng shop, không tính dụng cụ). Bộ rẻ nhất được tặng.</p>
        <div className="mt-3 space-y-2">
          {d.tiers.length === 0 && <p className="text-[14px] text-cocoa-soft">Đang tắt khuyến mãi.</p>}
          {d.tiers.map((t, k) => (
            <div key={k} className="flex flex-wrap items-center gap-2 text-[15px]">
              Mua từ
              <input
                aria-label="Số bộ"
                required
                type="number"
                min="2"
                step="1"
                value={t.sets}
                onChange={(e) => setTier(k, "sets", e.target.value)}
                className="w-20 rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brown"
              />
              bộ, tặng
              <input
                aria-label="Số bộ tặng"
                required
                type="number"
                min="1"
                step="1"
                value={t.free}
                onChange={(e) => setTier(k, "free", e.target.value)}
                className="w-20 rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brown"
              />
              bộ
              <button type="button" onClick={() => set({ tiers: d.tiers.filter((_, i) => i !== k) })} aria-label="Xoá bậc này" className="ml-1 grid h-9 w-9 place-items-center rounded-full hover:bg-pink-2 hover:text-wine">
                <TrashIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set({ tiers: [...d.tiers, { sets: "", free: "1" }] })} className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-[14px] hover:border-brown">
          + Thêm bậc
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-ivory p-5">
        <h2 className="text-[17px] font-semibold">Phí vận chuyển</h2>
        <div className="mt-3 grid gap-3 tab:grid-cols-2">
          <label className="block">
            <span className={label}>Phí ship (USD, 0 = luôn miễn phí)</span>
            <input required type="number" min="0" step="0.01" inputMode="decimal" value={d.shippingFee} onChange={(e) => set({ shippingFee: e.target.value })} className={field} />
          </label>
          <label className="block">
            <span className={label}>Miễn phí ship khi tiền hàng từ (USD)</span>
            <input required type="number" min="0" step="0.01" inputMode="decimal" value={d.freeShippingMin} onChange={(e) => set({ freeShippingMin: e.target.value })} className={field} />
          </label>
        </div>
        <p className="mt-2 text-[14px] text-cocoa-soft">
          {ship > 0 ? `Đơn dưới ${usd(min || 0)} (sau khuyến mãi) tính ship ${usd(ship)}; từ ${usd(min || 0)} trở lên miễn phí.` : "Mọi đơn đều miễn phí ship."}
        </p>
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-wine/10 px-4 py-3 text-wine">
          {error}
        </p>
      )}
      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={busy || !changed} className="btn-brown min-h-11 rounded-full px-7 font-medium text-white disabled:opacity-50">
          {busy ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
        {changed && (
          <button type="button" onClick={() => saved && set(toDraft(saved))} className="text-[14px] underline">
            Huỷ thay đổi
          </button>
        )}
        {done && !changed && <span className="text-[14px] text-[#2f6b39]">✓ Đã lưu</span>}
      </div>
    </form>
  );
}
