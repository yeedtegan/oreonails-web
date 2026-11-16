"use client";

import Link from "next/link";
import type { Order } from "@/lib/data";
import { useAdminData } from "@/components/admin/AdminContext";
import { Badge, Card, Empty, ErrorNote, PageHeader, Table, dateTime, money } from "@/components/admin/ui";

interface Stats {
  orders: number;
  orders30d: number;
  revenue: number;
  revenue30d: number;
  toFulfil: number;
  products: number;
  hiddenProducts: number;
  customers: number;
  subscribers: number;
  messages: number;
  reviews: number;
  recentOrders: Order[];
}

function Stat({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string }) {
  const inner = (
    <div className="h-full rounded-xl border border-[#ebe4e9] bg-white p-5 transition hover:border-plum/40">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="mt-2 text-[26px] leading-none font-extrabold">{value}</p>
      {sub && <p className="mt-2 text-[12.5px] text-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { data: s, error } = useAdminData<Stats>("/stats");
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your store at a glance." />
      <ErrorNote>{error}</ErrorNote>
      {s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Revenue" value={money(s.revenue)} sub={`${money(s.revenue30d)} in the last 30 days`} href="/admin/orders" />
            <Stat label="Orders" value={s.orders} sub={`${s.orders30d} in the last 30 days`} href="/admin/orders" />
            <Stat label="To fulfil" value={s.toFulfil} sub="Processing or in production" href="/admin/orders?status=Processing" />
            <Stat label="Products" value={s.products} sub={s.hiddenProducts ? `${s.hiddenProducts} hidden` : "All visible"} href="/admin/products" />
            <Stat label="Customers" value={s.customers} sub="Registered accounts" />
            <Stat label="Subscribers" value={s.subscribers} href="/admin/inbox?tab=subscribers" />
            <Stat label="Messages" value={s.messages} href="/admin/inbox" />
            <Stat label="Reviews" value={s.reviews} href="/admin/reviews" />
          </div>

          <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-[13.5px] font-semibold underline">View all</Link>} className="mt-6">
            {s.recentOrders.length === 0 ? (
              <Empty>No orders yet.</Empty>
            ) : (
              <Table head={["Order", "Customer", "Date", "Status", "Total"]}>
                {s.recentOrders.map((o) => (
                  <tr key={o.number}>
                    <td className="px-4 py-3 font-semibold"><Link href={`/admin/orders?q=${o.number}`} className="underline">#{o.number}</Link></td>
                    <td className="px-4 py-3">{o.name}<span className="block text-[12.5px] text-muted">{o.email}</span></td>
                    <td className="px-4 py-3 text-muted">{dateTime(o.createdAt)}</td>
                    <td className="px-4 py-3"><Badge>{o.status}</Badge></td>
                    <td className="px-4 py-3 font-semibold">{money(o.total)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </>
      )}
    </>
  );
}
