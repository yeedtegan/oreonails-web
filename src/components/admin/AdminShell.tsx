"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import { Button, inputCls } from "./ui";
import { BagIcon, BoxIcon, ChatIcon, CloseIcon, LayersIcon, Logo, MenuIcon, PenIcon, QuestionIcon, StarIcon, TagIcon, InfoIcon, SparkleIcon } from "../Icons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: SparkleIcon },
  { href: "/admin/orders", label: "Orders", icon: BagIcon },
  { href: "/admin/products", label: "Products", icon: BoxIcon },
  { href: "/admin/collections", label: "Collections", icon: LayersIcon },
  { href: "/admin/articles", label: "Nail Guide", icon: PenIcon },
  { href: "/admin/faqs", label: "FAQs", icon: QuestionIcon },
  { href: "/admin/reviews", label: "Reviews", icon: StarIcon },
  { href: "/admin/discounts", label: "Discount codes", icon: TagIcon },
  { href: "/admin/inbox", label: "Inbox", icon: ChatIcon },
  { href: "/admin/settings", label: "Settings", icon: InfoIcon },
];

function Login() {
  const { login } = useAdmin();
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center bg-[#f6f1f5] px-4">
      <form
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(75,56,76,0.10)]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          try {
            await login(token.trim());
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Logo className="mx-auto w-fit text-plum" />
        <h1 className="mt-6 text-center text-[20px] font-bold">Store admin</h1>
        <p className="mt-1 text-center text-[13.5px] text-muted">Enter the ADMIN_TOKEN from server/.env</p>
        <input type="password" autoFocus value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" className={`${inputCls} mt-6 h-11`} />
        {err && <p className="mt-3 text-[13px] text-[#b0263c]">{err}</p>}
        <Button kind="primary" type="submit" disabled={busy || !token.trim()} className="mt-4 h-11 w-full">
          {busy ? "Checking…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const { status, logout, toasts } = useAdmin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  if (status === "loading") return <div className="min-h-screen bg-[#f6f1f5]" />;
  if (status === "signed-out") return <Login />;

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-semibold transition ${active(href) ? "bg-plum text-white" : "text-plum hover:bg-[#f1eaee]"}`}>
          <Icon width={17} height={17} /> {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f6f1f5] text-plum">
      {/* mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#ebe4e9] bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu"><MenuIcon /></button>
        <span className="font-bold">Admin</span>
        <Link href="/" className="text-[13px] underline">Store</Link>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close menu"><CloseIcon /></button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-[#ebe4e9] bg-white lg:flex">
        <Link href="/admin" className="flex h-16 items-center gap-2 px-6">
          <Logo className="text-plum" />
          <span className="ml-1 rounded bg-[#f1eaee] px-1.5 py-0.5 text-[11px] font-bold">ADMIN</span>
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="space-y-1 border-t border-[#ebe4e9] p-3 text-[13.5px]">
          <a href="/" target="_blank" className="flex h-9 items-center rounded-lg px-3 hover:bg-[#f1eaee]">View store ↗</a>
          <button onClick={logout} className="flex h-9 w-full items-center rounded-lg px-3 text-left hover:bg-[#f1eaee]">Sign out</button>
        </div>
      </aside>

      <main className="px-4 py-6 lg:ml-60 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <div className="fixed bottom-4 right-4 z-[70] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`animate-fadein rounded-lg px-4 py-3 text-[14px] font-medium text-white shadow-lg ${t.kind === "error" ? "bg-[#b0263c]" : "bg-plum"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <Frame>{children}</Frame>
    </AdminProvider>
  );
}
