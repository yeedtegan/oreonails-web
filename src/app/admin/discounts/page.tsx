"use client";

import { useState } from "react";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { Badge, Button, Card, Empty, ErrorNote, Field, PageHeader, Table, Toggle, inputCls } from "@/components/admin/ui";

interface Discount {
  code: string;
  percent: number;
  active: number | boolean;
}

export default function DiscountsPage() {
  const { call, notify } = useAdmin();
  const { data, error, reload } = useAdminData<{ discounts: Discount[] }>("/discounts");
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [err, setErr] = useState("");

  const put = async (c: string, p: number, active: boolean, msg: string) => {
    try {
      await call(`/discounts/${encodeURIComponent(c)}`, { method: "PUT", body: { percent: p, active } });
      notify(msg);
      reload();
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    }
  };

  return (
    <>
      <PageHeader title="Discount codes" subtitle="Percentage off the order after mix & match. The first active code is the one newsletter sign-ups receive." />
      <ErrorNote>{error}</ErrorNote>
      <Card title="Create a code" className="mb-5">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            const p = Number(percent);
            if (!/^[A-Za-z0-9_-]{3,30}$/.test(code)) return setErr("Code must be 3–30 letters, digits, - or _.");
            if (!(p >= 1 && p <= 100)) return setErr("Percent must be between 1 and 100.");
            if (await put(code, p, true, `Code ${code.toUpperCase()} created`)) setCode("");
          }}
        >
          <Field label="Code" className="w-48"><input className={`${inputCls} uppercase`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XMAS20" /></Field>
          <Field label="Percent off" className="w-28"><input className={inputCls} inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value.replace(/\D/g, ""))} /></Field>
          <Button kind="primary" type="submit">Create</Button>
        </form>
        <div className="mt-3"><ErrorNote>{err}</ErrorNote></div>
      </Card>
      {data?.discounts.length === 0 ? (
        <Empty>No discount codes.</Empty>
      ) : (
        <Table head={["Code", "Discount", "Status", ""]}>
          {data?.discounts.map((d) => (
            <tr key={d.code}>
              <td className="px-4 py-3 font-mono font-bold">{d.code}</td>
              <td className="px-4 py-3">{d.percent}% off</td>
              <td className="px-4 py-3">
                <Toggle checked={!!d.active} onChange={(v) => put(d.code, d.percent, v, `${d.code} ${v ? "activated" : "paused"}`)} label="" />
                <span className="ml-2"><Badge>{d.active ? "Active" : "Hidden"}</Badge></span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  className="text-[13px] text-[#b0263c] underline"
                  onClick={async () => {
                    if (!confirm(`Delete code ${d.code}?`)) return;
                    try {
                      await call(`/discounts/${encodeURIComponent(d.code)}`, { method: "DELETE" });
                      notify("Code deleted");
                      reload();
                    } catch (e) {
                      notify((e as Error).message, "error");
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
