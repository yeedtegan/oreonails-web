"use client";

import { useState } from "react";
import type { Review } from "@/lib/data";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { Button, Empty, ErrorNote, PageHeader, Table, dateTime } from "@/components/admin/ui";
import { Stars } from "@/components/Icons";

const PAGE = 50;

export default function ReviewsAdmin() {
  const { call, notify } = useAdmin();
  const [offset, setOffset] = useState(0);
  const { data, error, reload } = useAdminData<{ total: number; reviews: Review[] }>(`/reviews?limit=${PAGE}&offset=${offset}`);

  const remove = async (r: Review) => {
    if (!confirm(`Delete the review by ${r.name}? This also updates the product's rating.`)) return;
    try {
      await call(`/reviews/${r.id}`, { method: "DELETE" });
      notify("Review deleted");
      reload();
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Reviews" subtitle={data ? `${data.total} reviews written on the store` : " "} />
      <ErrorNote>{error}</ErrorNote>
      {data?.reviews.length === 0 ? (
        <Empty>No reviews yet.</Empty>
      ) : (
        <Table head={["Rating", "Review", "Product", "Customer", "Date", ""]}>
          {data?.reviews.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="px-4 py-3"><Stars rating={r.rating} size={13} /></td>
              <td className="max-w-[380px] px-4 py-3">
                {r.title && r.title !== "Review" && <p className="font-semibold">{r.title}</p>}
                <p className="text-[13.5px] text-muted">{r.body}</p>
              </td>
              <td className="px-4 py-3 text-[13px]">{r.productTitle ?? "Store review"}{r.variant && <span className="block text-muted">{r.variant}</span>}</td>
              <td className="px-4 py-3 text-[13px]">{r.name}</td>
              <td className="px-4 py-3 text-[13px] whitespace-nowrap text-muted">{dateTime(r.date)}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => remove(r)} className="text-[13px] text-[#b0263c] underline">Delete</button></td>
            </tr>
          ))}
        </Table>
      )}
      {data && data.total > PAGE && (
        <div className="mt-4 flex items-center justify-end gap-2 text-[13px]">
          <Button small disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>← Newer</Button>
          <span className="text-muted">{offset + 1}–{Math.min(offset + PAGE, data.total)} of {data.total}</span>
          <Button small disabled={offset + PAGE >= data.total} onClick={() => setOffset(offset + PAGE)}>Older →</Button>
        </div>
      )}
    </>
  );
}
