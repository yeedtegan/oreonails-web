"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Collection, Product } from "@/lib/data";
import { useAdminData } from "@/components/admin/AdminContext";
import { Badge, Button, Empty, ErrorNote, PageHeader, Table, inputCls, money } from "@/components/admin/ui";
import { ProductArt } from "@/components/Art";

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [col, setCol] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, error, loading } = useAdminData<{ total: number; products: Product[] }>(
    `/products?${new URLSearchParams({ ...(query && { q: query }), ...(type && { type }), ...(col && { collection: col }) })}`,
  );
  const { data: cols } = useAdminData<{ collections: Collection[] }>("/collections");
  const titleOf = (h: string) => cols?.collections.find((c) => c.handle === h)?.title ?? h;

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.total} products` : " "}
        actions={<Link href="/admin/products/new"><Button kind="primary">+ Add product</Button></Link>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className={`${inputCls} max-w-xs`} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All types</option>
          <option value="set">Nail sets</option>
          <option value="bundle">Bundles</option>
          <option value="tool">Tools</option>
        </select>
        <select value={col} onChange={(e) => setCol(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All collections</option>
          {cols?.collections.map((c) => <option key={c.handle} value={c.handle}>{c.title}</option>)}
        </select>
      </div>
      <ErrorNote>{error}</ErrorNote>
      {data && data.products.length === 0 ? (
        <Empty>{loading ? "Loading…" : "No products found."}</Empty>
      ) : (
        <Table head={["", "Product", "Type", "Price", "Collections", "Status"]}>
          {data?.products.map((p) => (
            <tr key={p.handle} className="hover:bg-[#fcfafb]">
              <td className="w-16 px-4 py-2.5">
                <Link href={`/admin/products/${p.handle}`} className="block h-12 w-12 overflow-hidden rounded-lg bg-card">
                  <ProductArt product={p} className="h-full w-full" />
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/products/${p.handle}`} className="font-semibold hover:underline">{p.title}</Link>
                <span className="block text-[12px] text-muted">{p.handle}</span>
              </td>
              <td className="px-4 py-2.5 capitalize">{p.type}</td>
              <td className="px-4 py-2.5">
                {money(p.price)}
                {p.compareAt && <s className="ml-1.5 text-[12.5px] text-muted">{money(p.compareAt)}</s>}
              </td>
              <td className="max-w-[260px] px-4 py-2.5 text-[12.5px] text-muted">{p.collections.filter((c) => c !== "shop-all").map(titleOf).join(", ") || "—"}</td>
              <td className="px-4 py-2.5"><Badge>{p.active === false ? "Hidden" : "Active"}</Badge></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
