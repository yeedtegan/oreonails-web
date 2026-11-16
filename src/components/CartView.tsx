"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { money } from "@/lib/pricing";
import type { Collection, Product } from "@/lib/data";
import { CartLineRow, KeepShopping, PromoProgress, Row } from "@/components/CartDrawer";
import { CollectionArt } from "@/components/Art";

const NEXT_SET = ["holiday-glam", "cozy-fall", "best-sellers"];

/** /cart — centred title; empty state with "Find your next set" tiles, or lines + summary; then "Keep shopping". */
export default function CartView({ collections, recommendations }: { collections: Collection[]; recommendations: Product[] }) {
  const { totals, cart, hydrated } = useStore();
  if (!hydrated) return <div className="h-96" />;
  const tiles = NEXT_SET.map((h) => collections.find((c) => c.handle === h)).filter((c): c is Collection => !!c);

  return (
    <div className="container-x pt-2 pb-16">
      <h1 className="text-center font-display text-[34px] font-medium md:text-[36px]">Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center">
          <p className="mt-6 text-[16.5px]">Your cart is currently empty.</p>
          <h2 className="mt-6 font-display text-[24px] font-medium">Find your next set</h2>
          <div className="mx-auto mt-9 grid w-fit grid-cols-2 gap-x-2.5 gap-y-6 text-left">
            {tiles.map((c) => (
              <Link key={c.handle} href={`/collections/${c.handle}`} className="group block w-[150px] md:w-[195px]">
                <div className="overflow-hidden rounded-2xl">
                  <CollectionArt collection={c} className="aspect-square w-full transition duration-500 group-hover:scale-105" />
                </div>
                <p className="mt-3 font-display text-[15px] tracking-[0.3px]">{c.title}</p>
              </Link>
            ))}
          </div>
          <Link href="/collections/shop-all" className="btn-dark mt-14 px-[34px]">Shop all</Link>
        </div>
      ) : (
        <div className="mx-auto mt-8 grid max-w-[1100px] gap-10 lg:grid-cols-[1fr_380px]">
          <div className="overflow-hidden rounded-2xl border border-line">
            <PromoProgress />
            <div className="divide-y divide-line">
              {totals.lines.map((l) => (
                <div key={l.key} className="p-5">
                  <CartLineRow line={l} />
                </div>
              ))}
            </div>
          </div>
          <aside className="h-fit space-y-3 rounded-2xl border border-line p-6 text-[14.5px]">
            <h2 className="font-display text-[22px] font-medium">Order summary</h2>
            <Row label="Subtotal" value={money(totals.subtotal)} />
            {totals.promoDiscount > 0 && <Row accent label={`Mix & match (${totals.freeCount} free)`} value={`−${money(totals.promoDiscount)}`} />}
            <Row label="Shipping" value={totals.shipping === 0 ? "Free" : money(totals.shipping)} />
            <div className="border-t border-line pt-3">
              <Row bold label="Estimated total" value={money(totals.total + totals.codeDiscount)} />
            </div>
            <p className="text-[12.5px] text-muted">Discount codes are applied at checkout.</p>
            <Link href="/checkout" className="btn-dark w-full">Checkout</Link>
            <Link href="/collections/shop-all" className="block text-center text-[13px] underline">Continue shopping</Link>
          </aside>
        </div>
      )}

      <div className="mt-6">
        <KeepShopping initial={recommendations} collections={collections} cols={4} />
      </div>
    </div>
  );
}
