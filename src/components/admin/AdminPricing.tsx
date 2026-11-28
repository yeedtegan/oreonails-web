"use client";

import { useEffect, useState, type FormEvent } from "react";
import { TrashIcon } from "../icons";
import {
  adminFetch,
  json,
  saveDiscount,
  usd,
  type AdminDiscount,
  type AdminPricing,
} from "./api";

type Draft = {
  pricePerDesign: string;
  shippingFee: string;
  freeShippingMin: string;
  expressShippingFee: string;
  tiers: { sets: string; free: string }[];
};

const toDraft = (p: AdminPricing): Draft => ({
  pricePerDesign: String(p.pricePerDesign),
  shippingFee: String(p.shippingFee),
  freeShippingMin: String(p.freeShippingMin),
  expressShippingFee: String(p.expressShippingFee ?? 0),
  tiers: p.tiers.map((t) => ({ sets: String(t.sets), free: String(t.free) })),
});

const field =
  "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-brown";
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
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Lỗi"),
      );
  }, []);

  if (!d)
    return error ? (
      <p className="rounded-xl bg-wine/10 px-4 py-3 text-wine">{error}</p>
    ) : (
      <p className="mt-10 text-center text-cocoa-soft">Đang tải…</p>
    );

  const set = (patch: Partial<Draft>) => {
    setD({ ...d, ...patch });
    setDone(false);
  };
  const setTier = (k: number, key: "sets" | "free", v: string) =>
    set({ tiers: d.tiers.map((t, i) => (i === k ? { ...t, [key]: v } : t)) });
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
          expressShippingFee: Number(d.expressShippingFee || 0),
          tiers: d.tiers
            .filter((t) => t.sets !== "" || t.free !== "")
            .map((t) => ({ sets: Number(t.sets), free: Number(t.free) })),
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
    <div className="max-w-2xl">
      <form onSubmit={submit}>
        <h1 className="text-[26px] font-semibold">Giá & khuyến mãi</h1>
        <p className="mt-1 text-cocoa-soft">
          Lưu xong là áp dụng ngay cho giỏ hàng và đơn mới, không cần deploy
          lại.
        </p>

        <section className="mt-6 rounded-2xl border border-line bg-ivory p-5">
          <h2 className="text-[17px] font-semibold">Bộ móng custom</h2>
          <label className="mt-3 block max-w-xs">
            <span className={label}>Giá 1 bộ custom (USD)</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={d.pricePerDesign}
              onChange={(e) => set({ pricePerDesign: e.target.value })}
              className={field}
            />
          </label>
        </section>

        <section className="mt-4 rounded-2xl border border-line bg-ivory p-5">
          <h2 className="text-[17px] font-semibold">Mua nhiều tặng bộ</h2>
          <p className="mt-1 text-[14px] text-cocoa-soft">
            Tính trên tổng số bộ trong giỏ (custom + bộ móng shop, không tính
            dụng cụ). Bộ rẻ nhất được tặng.
          </p>
          <div className="mt-3 space-y-2">
            {d.tiers.length === 0 && (
              <p className="text-[14px] text-cocoa-soft">
                Đang tắt khuyến mãi.
              </p>
            )}
            {d.tiers.map((t, k) => (
              <div
                key={k}
                className="flex flex-wrap items-center gap-2 text-[15px]"
              >
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
                <button
                  type="button"
                  onClick={() =>
                    set({ tiers: d.tiers.filter((_, i) => i !== k) })
                  }
                  aria-label="Xoá bậc này"
                  className="ml-1 grid h-9 w-9 place-items-center rounded-full hover:bg-pink-2 hover:text-wine"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              set({ tiers: [...d.tiers, { sets: "", free: "1" }] })
            }
            className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-[14px] hover:border-brown"
          >
            + Thêm bậc
          </button>
        </section>

        <section className="mt-4 rounded-2xl border border-line bg-ivory p-5">
          <h2 className="text-[17px] font-semibold">Phí vận chuyển</h2>
          <div className="mt-3 grid gap-3 tab:grid-cols-2">
            <label className="block">
              <span className={label}>Phí ship (USD, 0 = luôn miễn phí)</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={d.shippingFee}
                onChange={(e) => set({ shippingFee: e.target.value })}
                className={field}
              />
            </label>
            <label className="block">
              <span className={label}>
                Miễn phí ship khi tiền hàng từ (USD)
              </span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={d.freeShippingMin}
                onChange={(e) => set({ freeShippingMin: e.target.value })}
                className={field}
              />
            </label>
          </div>
          <p className="mt-2 text-[14px] text-cocoa-soft">
            {ship > 0
              ? `Ship thường: đơn dưới ${usd(min || 0)} (sau khuyến mãi) tính ${usd(ship)}; từ ${usd(min || 0)} trở lên miễn phí.`
              : "Ship thường luôn miễn phí."}
          </p>
          <label className="mt-3 block max-w-xs">
            <span className={label}>
              Phí ship Express (USD, 0 = không có Express)
            </span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={d.expressShippingFee}
              onChange={(e) => set({ expressShippingFee: e.target.value })}
              className={field}
            />
          </label>
          <p className="mt-1 text-[14px] text-cocoa-soft">
            {Number(d.expressShippingFee) > 0
              ? `Khách chọn được Express (2–3 ngày làm việc) với phí ${usd(Number(d.expressShippingFee))}, không miễn phí.`
              : "Đang ẩn lựa chọn Express."}
          </p>
        </section>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-wine/10 px-4 py-3 text-wine"
          >
            {error}
          </p>
        )}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !changed}
            className="btn-brown min-h-11 rounded-full px-7 font-medium text-white disabled:opacity-50"
          >
            {busy ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
          {changed && (
            <button
              type="button"
              onClick={() => saved && set(toDraft(saved))}
              className="text-[14px] underline"
            >
              Huỷ thay đổi
            </button>
          )}
          {done && !changed && (
            <span className="text-[14px] text-[#2f6b39]">✓ Đã lưu</span>
          )}
        </div>
      </form>

      <DiscountCodes />
    </div>
  );
}

/** discount codes: x% off the goods (after the free-set promo, before shipping) — create, change %, turn off */
function DiscountCodes() {
  const [list, setList] = useState<AdminDiscount[] | null>(null);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<{ discounts: AdminDiscount[] }>("discounts")
      .then((d) => setList(d.discounts))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Lỗi"),
      );
  }, []);

  async function save(c: string, p: number, active: boolean) {
    setBusy(c);
    setError("");
    try {
      const saved = await saveDiscount(c, p, active);
      setList((cur) =>
        [saved, ...(cur ?? []).filter((x) => x.code !== saved.code)].sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt),
        ),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-ivory p-5">
      <h2 className="text-[17px] font-semibold">Mã giảm giá</h2>
      <p className="mt-1 text-[14px] text-cocoa-soft">
        Giảm % tiền hàng (sau khuyến mãi mua nhiều tặng bộ, trước phí ship).
        Khách nhập mã trong giỏ hàng; mỗi đơn 1 mã. Tắt mã thì khách không dùng
        được nữa.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className={label}>Mã</span>
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
            }
            maxLength={40}
            placeholder="OREO10"
            className="mt-1 w-40 rounded-xl border border-line bg-white px-3 py-2.5 uppercase outline-none focus:border-brown"
          />
        </label>
        <label className="block">
          <span className={label}>Giảm (%)</span>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="mt-1 w-24 rounded-xl border border-line bg-white px-3 py-2.5 outline-none focus:border-brown"
          />
        </label>
        <button
          type="button"
          disabled={!code || !(Number(percent) > 0) || busy !== null}
          onClick={async () => {
            if (await save(code, Number(percent), true)) setCode("");
          }}
          className="btn-brown min-h-11 rounded-full px-5 font-medium text-white disabled:opacity-50"
        >
          {list?.some((d) => d.code === code) ? "Cập nhật mã" : "Tạo mã"}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-xl bg-wine/10 px-3.5 py-2 text-[14px] text-wine">
          {error}
        </p>
      )}
      {list && list.length === 0 && (
        <p className="mt-3 text-[14px] text-cocoa-soft">Chưa có mã nào.</p>
      )}
      {list && list.length > 0 && (
        <ul className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
          {list.map((d) => (
            <li
              key={d.code}
              className={`flex items-center gap-3 border-b border-line px-3.5 py-2.5 text-[14px] last:border-0 ${d.active ? "" : "opacity-60"}`}
            >
              <b className="font-semibold tracking-wide">{d.code}</b>
              <span>−{d.percent}%</span>
              <span className="text-cocoa-soft">· {d.uses} đơn đã dùng</span>
              <button
                type="button"
                onClick={() => save(d.code, d.percent, !d.active)}
                disabled={busy === d.code}
                className={`ml-auto min-h-9 rounded-full border px-3 text-[13px] disabled:opacity-50 ${d.active ? "border-[#bcd8bf] bg-[#eef7ef] text-[#2f6b39]" : "border-line bg-white text-cocoa-soft"}`}
                title={d.active ? "Bấm để tắt mã" : "Bấm để bật lại"}
              >
                {busy === d.code ? "…" : d.active ? "Đang bật" : "Đã tắt"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCode(d.code);
                  setPercent(String(d.percent));
                }}
                className="text-[13px] underline"
              >
                Sửa %
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
