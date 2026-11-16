"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin, useAdminData } from "@/components/admin/AdminContext";
import { Button, Card, Empty, ErrorNote, PageHeader, Table, dateTime } from "@/components/admin/ui";

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  meta: string | null;
  created_at: string;
}
interface Subscriber {
  email: string;
  created_at: string;
}

function Messages() {
  const { call, notify } = useAdmin();
  const { data, error, reload } = useAdminData<{ messages: Message[] }>("/messages");
  return (
    <>
      <ErrorNote>{error}</ErrorNote>
      {data?.messages.length === 0 && <Empty>No messages yet.</Empty>}
      <div className="space-y-3">
        {data?.messages.map((m) => {
          const meta = m.meta ? (JSON.parse(m.meta) as Record<string, string>) : null;
          return (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{m.topic}</p>
                  <p className="text-[13px] text-muted">
                    {m.name} · <a className="underline" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.topic)}`}>{m.email}</a>
                    {m.phone && <> · {m.phone}</>} · {dateTime(m.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.topic)}`}><Button small kind="primary">Reply</Button></a>
                  <Button
                    small
                    kind="danger"
                    onClick={async () => {
                      if (!confirm("Delete this message?")) return;
                      try {
                        await call(`/messages/${m.id}`, { method: "DELETE" });
                        notify("Message deleted");
                        reload();
                      } catch (e) {
                        notify((e as Error).message, "error");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px]">{m.message}</p>
              {meta && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-[#faf7f9] p-3 text-[12.5px] sm:grid-cols-4">
                  {Object.entries(meta).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}><dt className="text-muted capitalize">{k}</dt><dd className="font-semibold">{String(v)}</dd></div>
                  ))}
                </dl>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Subscribers() {
  const { data, error } = useAdminData<{ subscribers: Subscriber[] }>("/subscribers");
  const download = () => {
    if (!data) return;
    const csv = "email,subscribed_at\n" + data.subscribers.map((s) => `${s.email},${s.created_at}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <ErrorNote>{error}</ErrorNote>
      <div className="mb-3 flex justify-end"><Button onClick={download} disabled={!data?.subscribers.length}>Download CSV</Button></div>
      {data?.subscribers.length === 0 ? (
        <Empty>No subscribers yet.</Empty>
      ) : (
        <Table head={["Email", "Subscribed"]}>
          {data?.subscribers.map((s) => (
            <tr key={s.email}>
              <td className="px-4 py-3">{s.email}</td>
              <td className="px-4 py-3 text-muted">{dateTime(s.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

function InboxInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") === "subscribers" ? "subscribers" : "messages");
  return (
    <>
      <PageHeader title="Inbox" subtitle="Contact form and custom-design requests, plus newsletter sign-ups." />
      <div className="mb-5 flex gap-2">
        {[["messages", "Messages"], ["subscribers", "Subscribers"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-9 rounded-full px-4 text-[13.5px] font-semibold ${tab === k ? "bg-plum text-white" : "border border-[#ebe4e9] bg-white"}`}>{l}</button>
        ))}
      </div>
      {tab === "messages" ? <Messages /> : <Subscribers />}
    </>
  );
}

export default function InboxPage() {
  return (
    <Suspense>
      <InboxInner />
    </Suspense>
  );
}
