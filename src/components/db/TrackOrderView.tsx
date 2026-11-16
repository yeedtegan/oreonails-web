"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SITE, type Order } from "@/lib/data";
import { apiFetch, ApiError } from "@/lib/api-client";
import { money } from "@/lib/pricing";
import { InfoHero } from "@/components/info";
import { BoxIcon, CardIcon, ChatIcon, MailIcon, PenIcon, SearchIcon, TruckIcon } from "@/components/Icons";

const STEPS = ["Processing", "In production", "Shipped", "Delivered"] as const;
/** Index of the order's status on the progress bar (status is set by the shop via the admin API). */
const statusOf = (o: Order) => Math.max(0, STEPS.indexOf(o.status as (typeof STEPS)[number]));
const field = "h-[50px] w-full rounded-xl border border-[#d9d3d8] bg-white px-[15px] text-[16px] outline-none placeholder:text-[#a59ba3] focus:border-plum";

function TrackInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"order" | "tracking">("order");
  const [num, setNum] = useState((params.get("order") ?? "").replace(/^ON/i, ""));
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [found, setFound] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (number: string, mail: string) => {
    setLoading(true);
    setError("");
    setFound(null);
    try {
      const n = number.trim().replace(/^#/, "").replace(/^ON/i, "");
      const res = await apiFetch<{ order: Order }>(`/orders/track?number=ON${encodeURIComponent(n)}&email=${encodeURIComponent(mail)}`);
      setFound(res.order);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? "We couldn't find an order with those details." : (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep link from the checkout confirmation: ?order=…&email=…
  useEffect(() => {
    const o = params.get("order");
    const m = params.get("email");
    if (o && m) lookup(o, m);
  }, [params, lookup]);

  return (
    <>
      <InfoHero center width={816} title="Track Your Order" intro="Every set is hand-painted for you, then shipped with tracking. Follow it here." />
      <div className="flow-root bg-[#f6f1f5] pb-16">
        <div className="mx-auto -mt-[60px] max-w-[816px] px-3 md:px-0">
          <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(75,56,76,0.10)] md:px-[30px] md:py-[26px]">
            <div className="flex h-[50px] rounded-xl bg-[#f1eaee] p-1">
              {(["order", "tracking"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-[9px] text-[14.5px] font-bold transition ${tab === t ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]" : "text-muted"}`}>
                  {t === "order" ? "Order number" : "Tracking number"}
                </button>
              ))}
            </div>
            {tab === "order" ? (
              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (num.trim() && email.trim()) lookup(num, email);
                  else setError("Enter your order number and email.");
                }}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-[14px] font-bold">Order number <span className="text-[#c0392b]">*</span></span>
                    <span className="relative block">
                      <span className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[16px] font-bold">#ON</span>
                      <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\dA-Za-z]/g, ""))} placeholder="123456" className={`${field} pl-[52px]`} />
                    </span>
                  </label>
                  <label>
                    <span className="mb-2 block text-[14px] font-bold">Email address <span className="text-[#c0392b]">*</span></span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
                  </label>
                </div>
                <button disabled={loading} className="mt-4 flex h-[52px] w-[220px] items-center justify-center gap-2 rounded-full bg-plum text-[15.5px] font-bold text-white transition hover:bg-plum-light disabled:opacity-60">
                  <BoxIcon width={16} height={16} /> {loading ? "Looking…" : "Find my order"}
                </button>
                <p className="mt-4 text-[13px] text-muted">Use the order number from your confirmation email and the email you checked out with.</p>
              </form>
            ) : (
              <div className="mt-6 rounded-xl bg-[#f3ebf2] p-5 text-[15px]">
                Your tracking number is emailed the day your order leaves the studio. Paste it into your carrier&apos;s site, or look up your order by number on the first tab to see its status.
              </div>
            )}
            {error && <p className="mt-4 text-[14.5px] text-[#b0263c]">{error}</p>}
            {found && (
              <div className="animate-fadein mt-6 border-t border-line pt-5">
                <div className="flex flex-wrap justify-between gap-2 text-[15px]">
                  <span>Order <b>#{found.number}</b> · {found.items.reduce((s, i) => s + i.qty, 0)} items</span>
                  <b>{money(found.total)}</b>
                </div>
                <p className="mt-1 text-[13px] text-muted">Placed {new Date(found.createdAt).toLocaleString()} · Ship to {found.address}</p>
                <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-[12.5px]">
                  {STEPS.map((s, i) => {
                    const reached = i <= statusOf(found);
                    return (
                      <li key={s}>
                        <div className={`mx-auto mb-2 h-1.5 rounded-full ${reached ? "bg-plum" : "bg-line"}`} />
                        <span className={reached ? "font-bold" : "text-muted"}>{s}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>

          <h2 className="mt-12 text-center font-playfair-display text-[26px] font-normal">What happens after you order</h2>
          <div className="relative mt-6 grid gap-6 md:grid-cols-4 md:gap-0">
            <div className="absolute left-[12.5%] right-[12.5%] top-[22px] hidden border-t-2 border-dashed border-[#d9cfd7] md:block" />
            {[
              { icon: <CardIcon width={18} height={18} />, t: "Order placed", d: "You get an Order Confirmation email with your order number." },
              { icon: <PenIcon width={18} height={18} />, t: "Hand painted for you", d: "Our artists paint your set in 2 to 3 business days." },
              { icon: <BoxIcon width={18} height={18} />, t: "Shipped", d: "We email your tracking number the day it leaves the studio." },
              { icon: <TruckIcon width={18} height={18} />, t: "On its way", d: "7 to 10 days to the US, 7 to 10 days worldwide." },
            ].map((s) => (
              <div key={s.t} className="relative px-3 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)]">{s.icon}</span>
                <p className="mt-4 text-[15.5px] font-bold">{s.t}</p>
                <p className="mt-1 text-[14px] leading-[1.5] text-muted">{s.d}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-12 text-center font-playfair-display text-[26px] font-normal">Tracking FAQ</h2>
          <div className="mt-6 grid gap-3.5 md:grid-cols-2">
            {[
              { icon: <MailIcon width={16} height={16} />, t: "Where is my order number?", d: <>At the top of your &quot;Order Confirmation&quot; email, starting with #ON.</> },
              { icon: <SearchIcon width={16} height={16} />, t: "Can't find our emails?", d: <>Check your spam or promotions folder, or search for &quot;{SITE.name}&quot; or {SITE.email}.</> },
              { icon: <TruckIcon width={16} height={16} />, t: "Tracking not moving?", d: <>Parcels often pause in customs for a few days. <Link href="/pages/shipping-policy" className="font-bold underline">Here&apos;s what that means</Link>.</> },
              { icon: <ChatIcon width={16} height={16} />, t: "Still need help?", d: <><Link href="/pages/contact" className="font-bold underline">Submit a request</Link> and our team replies within 1 business day.</> },
            ].map((q) => (
              <div key={q.t} className="flex gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_8px_rgba(75,56,76,0.05)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[#f3ebf2]">{q.icon}</span>
                <div>
                  <p className="text-[15.5px] font-medium">{q.t}</p>
                  <p className="mt-1 text-[14px] leading-[1.5] text-muted">{q.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackInner />
    </Suspense>
  );
}
