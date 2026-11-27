/**
 * Cart price preview — the SAME rules as oreonails-api/src/account/pricing.ts (the store charges with its own copy;
 * change both together). Rules come from the store (GET /api/pricing).
 */

export type PromoTier = { sets: number; free: number };

export type ShippingMethod = "standard" | "express";

export type PricingRules = {
  tiers: PromoTier[];
  shippingFee: number;
  freeShippingMin: number;
  pricePerDesign: number;
  /** Express shipping fee; 0 = no Express option */
  expressShippingFee?: number;
  currency: string;
  sizes: string[];
  lengths: string[];
  maxQuantity: number;
};

export type PriceLine = { price: number; quantity: number; isSet: boolean };

/** discount = the "x sets, y free" promo · codeDiscount = the discount code */
export type CartTotals = { sets: number; subtotal: number; freeSets: number; discount: number; codeDiscount: number; shipping: number; total: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export const freeSetsFor = (sets: number, tiers: PromoTier[]) => tiers.reduce((free, t) => (sets >= t.sets ? Math.max(free, t.free) : free), 0);

/**
 * Same as oreonails-api: the code takes x% off the goods after the free-set promo, before shipping; free shipping is
 * judged on the goods before the code. Express has its own fee (never free).
 */
export function priceCart(
  lines: PriceLine[],
  rules: Pick<PricingRules, "tiers" | "shippingFee" | "freeShippingMin" | "expressShippingFee">,
  opts: { method?: ShippingMethod; codePercent?: number } = {},
): CartTotals {
  const setUnits = lines.flatMap((l) => (l.isSet ? Array<number>(l.quantity).fill(l.price) : [])).sort((a, b) => a - b);
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.quantity, 0));
  const freeSets = Math.min(freeSetsFor(setUnits.length, rules.tiers), setUnits.length);
  const discount = round2(setUnits.slice(0, freeSets).reduce((s, p) => s + p, 0));
  const goods = round2(subtotal - discount);
  const codeDiscount = round2((goods * Math.min(100, Math.max(0, opts.codePercent ?? 0))) / 100);
  const express = opts.method === "express" && (rules.expressShippingFee ?? 0) > 0;
  const shipping = !lines.length
    ? 0
    : express
      ? round2(rules.expressShippingFee!)
      : rules.shippingFee > 0 && goods < rules.freeShippingMin
        ? round2(rules.shippingFee)
        : 0;
  return { sets: setUnits.length, subtotal, freeSets, discount, codeDiscount, shipping, total: round2(goods - codeDiscount + shipping) };
}

/** next promo step not reached yet: "Add 1 more and it's FREE" */
export function nextTier(sets: number, tiers: PromoTier[]): PromoTier | null {
  return tiers.find((t) => t.sets > sets && t.free > freeSetsFor(sets, tiers)) ?? null;
}

export const money = (n: number) => `$${n.toFixed(2)}`;
