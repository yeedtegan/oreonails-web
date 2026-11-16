"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { money } from "@/lib/pricing";
import { PageHero } from "@/components/ui";

export default function AccountPage() {
  const { user, token, authenticate, logout, orders, hydrated } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // A stored session token is being resolved via /api/me.
  if (!hydrated || (token && !user)) return <div className="h-96" />;

  if (user) {
    const mine = orders; // /api/me returns this account's orders
    return (
      <>
        <PageHero title={`Hi, ${user.name}`} intro={user.email} />
        <div className="container-x grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
          <section>
            <h2 className="h-display mb-4 text-2xl">Order history</h2>
            {mine.length === 0 ? (
              <p className="text-muted">You haven&apos;t placed any orders yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <tr><th className="py-2">Order</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr>
                </thead>
                <tbody>
                  {mine.map((o) => (
                    <tr key={o.number} className="border-b border-line">
                      <td className="py-3"><Link className="underline" href={`/pages/track-order?order=${o.number}&email=${encodeURIComponent(o.email)}`}>#{o.number}</Link></td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>{o.status}</td>
                      <td className="text-right">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <aside className="h-fit rounded-2xl bg-ink p-6 text-cream">
            <p className="text-xs uppercase tracking-widest text-cream/60">The Oreo Club</p>
            <p className="h-display mt-2 text-4xl">{user.points} pts</p>
            <p className="mt-2 text-sm text-cream/70">Earn 5 points for every $1. 500 pts = $5 off.</p>
            <Link href="/pages/rewards" className="btn-light mt-4 w-full">View rewards</Link>
            <button onClick={logout} className="mt-3 w-full text-xs underline">Sign out</button>
          </aside>
        </div>
      </>
    );
  }

  const box = "h-12 w-full rounded-lg border border-[#d6d6d6] bg-white px-3 text-[15px] text-black outline-none placeholder:text-[#707070] focus:border-plum focus:ring-2 focus:ring-plum/20";
  return (
    <div className="grid min-h-[620px] place-items-center px-4 py-16">
      <form
        noValidate
        className="w-full max-w-[380px] text-black"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Enter a valid email.");
          if (password.length < 6) return setErr("Password must be at least 6 characters.");
          if (mode === "register" && !name.trim()) return setErr("Enter your name.");
          setBusy(true);
          setErr("");
          try {
            await authenticate(mode, mode === "register" ? { name: name.trim(), email, password } : { email, password });
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1 className="text-[22px] font-bold">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-[14px] text-[#707070]">{mode === "login" ? "Sign in or create an account" : "Join free and get 100 Oreo Club points"}</p>
        <div className="mt-6 space-y-3">
          {mode === "register" && <input className={box} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />}
          <input type="email" className={box} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <input type="password" className={box} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
        </div>
        <label className="mt-4 flex items-start gap-2.5 text-[14px]">
          <input type="checkbox" defaultChecked className="mt-0.5 h-[18px] w-[18px] accent-plum" />
          Keep me updated with news, exclusive offers, and early access to sales
        </label>
        {err && <p className="mt-3 text-[13.5px] text-[#b0263c]">{err}</p>}
        <button disabled={busy} className="mt-5 h-12 w-full rounded-lg bg-plum text-[16px] font-semibold text-white transition hover:bg-plum-light disabled:opacity-60">
          {busy ? "Please wait…" : mode === "login" ? "Continue" : "Create account"}
        </button>
        <div className="my-5 flex items-center gap-3 text-[13px] text-[#707070]"><span className="h-px flex-1 bg-[#e3e3e3]" />or<span className="h-px flex-1 bg-[#e3e3e3]" /></div>
        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }} className="h-12 w-full rounded-lg border border-[#d6d6d6] text-[15px] font-medium">
          {mode === "login" ? "Create an account" : "I already have an account"}
        </button>
        <p className="mt-5 text-center text-[12px] text-[#707070]">
          By continuing, you agree to our <Link href="/pages/terms-of-service" className="underline">Terms of service</Link>
        </p>
      </form>
    </div>
  );
}
