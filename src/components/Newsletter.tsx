"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/data";
import { useStore } from "@/context/StoreContext";
import { apiFetch } from "@/lib/api-client";
import NailArt from "./NailArt";
import { CloseIcon, GiftIcon, SwapIcon, TagIcon, TruckIcon } from "./Icons";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** Shared subscribe flow: POST /api/newsletter, then apply the returned welcome code to the cart. */
function useSubscribe() {
  const { subscribe, setCode } = useStore();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [code, setCodeShown] = useState(SITE.welcomeCode);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) return setError("Please enter a valid email address.");
    setError("");
    setStatus("sending");
    try {
      const res = await apiFetch<{ ok: boolean; code: string | null }>("/newsletter", { body: { email } });
      const welcome = res.code ?? SITE.welcomeCode;
      setCodeShown(welcome);
      subscribe();
      setCode(welcome);
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  };
  return { email, setEmail, status, error, code, submit };
}

function Success({ code, dark }: { code: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="text-sm">
      <p className="font-semibold">Your {SITE.welcomePercent}% off is ready. Shop now!</p>
      <div className="mt-2 flex items-center gap-2">
        <code className={`rounded-md border border-dashed px-3 py-1.5 font-bold tracking-widest ${dark ? "border-white/40" : "border-plum/40"}`}>{code}</code>
        <button
          type="button"
          className="text-xs underline"
          onClick={() => {
            navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1.5 text-xs opacity-70">Applied to your cart automatically.</p>
    </div>
  );
}

/** Generic stacked form (used on standalone pages). */
export function NewsletterForm({ dark, cta = "Sign up" }: { dark?: boolean; cta?: string }) {
  const s = useSubscribe();
  if (s.status === "done") return <Success code={s.code} dark={dark} />;
  return (
    <form noValidate onSubmit={s.submit}>
      <div className="flex gap-2">
        <input type="email" value={s.email} onChange={(e) => s.setEmail(e.target.value)} placeholder="Your email" aria-label="Email address"
          className={`input rounded-full ${dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : ""}`} />
        <button disabled={s.status === "sending"} className={dark ? "btn-white shrink-0" : "btn-dark shrink-0"}>{cta}</button>
      </div>
      {s.error && <p className="mt-2 text-xs text-[#ff8da1]">{s.error}</p>}
    </form>
  );
}

/** Drawer variant: white pill input + plum "GET CODE" pill. */
export function NewsletterInline() {
  const s = useSubscribe();
  if (s.status === "done") return <Success code={s.code} />;
  return (
    <form noValidate onSubmit={s.submit}>
      <div className="flex gap-2">
        <input type="email" value={s.email} onChange={(e) => s.setEmail(e.target.value)} placeholder="Your email" aria-label="Email address"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-[15px] outline-none focus:border-plum" />
        <button disabled={s.status === "sending"} className="h-11 shrink-0 rounded-full bg-plum px-[18px] text-[13px] font-bold uppercase tracking-[1px] text-white">
          Get code
        </button>
      </div>
      {s.error && <p className="mt-2 text-xs text-[#b0263c]">{s.error}</p>}
    </form>
  );
}

/** Footer variant: one translucent pill with the "Sign up" button inside it. */
export function NewsletterFooter() {
  const s = useSubscribe();
  if (s.status === "done") return <Success code={s.code} dark />;
  return (
    <form noValidate onSubmit={s.submit}>
      <div className="flex h-14 items-center rounded-full border border-white/25 bg-white/10 p-1 pl-5">
        <input type="email" value={s.email} onChange={(e) => s.setEmail(e.target.value)} placeholder="Your email" aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-cream outline-none placeholder:text-cream/60" />
        <button disabled={s.status === "sending"} className="h-11 shrink-0 rounded-full bg-cream px-6 font-work text-sm font-bold tracking-[0.56px] text-plum transition hover:bg-white">
          Sign up
        </button>
      </div>
      {s.error && <p className="mt-2 text-xs text-[#ffb3c1]">{s.error}</p>}
      <p className="mt-3 text-xs text-cream/80">
        By signing up, you agree to our <Link href="/pages/privacy-policy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}

/** First-visit popup: split card (image left, dark offer panel right) like the reference. */
export function NewsletterPopup({ image }: { image?: string | null }) {
  const { subscribed, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const s = useSubscribe();

  useEffect(() => {
    if (!hydrated || subscribed) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("on-popup-dismissed") === "1";
    } catch {}
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), 6000);
    return () => clearTimeout(t);
  }, [hydrated, subscribed]);

  if (!open) return null;
  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("on-popup-dismissed", "1");
    } catch {}
  };

  const perks = [
    { icon: <GiftIcon width={16} height={16} />, text: <>Free size swap within 30 days</> },
    { icon: <SwapIcon width={16} height={16} />, text: <>Reusable 5–10 times</> },
    { icon: <TruckIcon width={16} height={16} />, text: <>Buy 2, get 1 free</> },
  ];

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={close} />
      <div className="animate-fadein relative grid w-full max-w-[760px] overflow-hidden rounded-xl shadow-2xl md:grid-cols-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- product photo from the Shopify CDN
          <img src={image} alt="" className="hidden h-full min-h-[440px] w-full object-cover md:block" />
        ) : (
          <NailArt palette={["#efe6e1", "#f1d6cf", "#a9c4e6", "#ffffff"]} pattern="french" shape="Almond" className="hidden h-full w-full md:block" />
        )}
        <div className="relative bg-[radial-gradient(ellipse_at_top_right,#4a1324_0%,#170a0e_55%,#0b0b0b_100%)] px-7 pb-5 pt-8 text-white">
          <button onClick={close} aria-label="Close" className="absolute right-4 top-3.5 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-black/30">
            <CloseIcon width={16} height={16} strokeWidth={2.2} />
          </button>
          <h2 className="font-playfair-display text-[30px] font-semibold leading-[1.15]">
            Get 10% off
            <br />
            <i className="text-[#ff6b84]">your first order</i>
          </h2>
          {s.status === "done" ? (
            <div className="mt-8"><Success code={s.code} dark /></div>
          ) : (
            <>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-[#e0283e] px-3.5 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/80"><TagIcon width={16} height={16} /></span>
                  <span>
                    <b className="block text-[15px]">{SITE.welcomePercent}% off + early access</b>
                    <span className="text-xs text-white/85">New hand-painted drops, first.</span>
                  </span>
                </div>
                {perks.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.07] px-3.5 py-3 text-[14.5px] font-semibold">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">{p.icon}</span>
                    {p.text}
                  </div>
                ))}
              </div>
              <form noValidate onSubmit={s.submit} className="mt-6 flex gap-2">
                <input type="email" value={s.email} onChange={(e) => s.setEmail(e.target.value)} placeholder="Enter your email" aria-label="Email address"
                  className="h-[50px] min-w-0 flex-1 rounded-full border border-white/40 bg-transparent px-4 text-[15px] outline-none placeholder:text-white/70" />
                <button disabled={s.status === "sending"} className="h-[50px] shrink-0 rounded-full bg-[#e0283e] px-4 text-sm font-bold uppercase tracking-[1.2px]">Get my code</button>
              </form>
              {s.error && <p className="mt-2 text-xs text-[#ffb3c1]">{s.error}</p>}
              <p className="mt-3 text-center text-[11px] text-white/70">No purchase necessary. <Link href="/pages/privacy-policy" className="underline">Privacy</Link></p>
              <button onClick={close} className="mx-auto mt-2 block text-[13px] underline">No thanks</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
