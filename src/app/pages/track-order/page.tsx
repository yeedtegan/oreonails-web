import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@/lib/data";
import { SHOPIFY_ACCOUNT_URL } from "@/lib/shopify/config";
import { InfoHero } from "@/components/info";
import { isDb } from "@/lib/backend";
import TrackOrderView from "@/components/db/TrackOrderView";
import { BoxIcon, CardIcon, ChatIcon, MailIcon, PenIcon, SearchIcon, TruckIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Track Your Order" };

/**
 * "db": look up an order by number + email on the Oreo Nails API.
 * "shopify": order status lives in Shopify — customers sign in with the checkout email (one-time code).
 */
export default function TrackOrderPage() {
  if (isDb) return <TrackOrderView />;
  return (
    <>
      <InfoHero center width={816} title="Track Your Order" intro="Every set is hand-painted for you, then shipped with tracking. Follow it here." />
      <div className="flow-root bg-[#f6f1f5] pb-16">
        <div className="mx-auto -mt-[60px] max-w-[816px] px-3 md:px-0">
          <div className="rounded-2xl bg-white p-5 text-center shadow-[0_8px_30px_rgba(75,56,76,0.10)] md:px-[30px] md:py-[30px]">
            <p className="text-[16px] leading-[1.6]">
              Sign in with the email you used at checkout. We&apos;ll send you a one-time code, then you can see every order&apos;s status and tracking link.
            </p>
            <a
              href={SHOPIFY_ACCOUNT_URL || "/pages/contact"}
              className="mx-auto mt-5 flex h-[52px] w-[240px] items-center justify-center gap-2 rounded-full bg-plum text-[15.5px] font-bold text-white transition hover:bg-plum-light"
            >
              <BoxIcon width={16} height={16} /> Find my order
            </a>
            <p className="mt-4 text-[13px] text-muted">Your order confirmation email also has a &quot;View your order&quot; button that opens the same page.</p>
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
              { icon: <MailIcon width={16} height={16} />, t: "Where is my order number?", d: <>At the top of your &quot;Order Confirmation&quot; email, starting with #.</> },
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

