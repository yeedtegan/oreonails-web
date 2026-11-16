"use client";

import { useState } from "react";
import { SHAPES, SITE } from "@/lib/data";
import { apiFetch } from "@/lib/api-client";
import { Callout, IconTile, InfoAccordion, InfoBody, InfoCard, InfoHero, Pill } from "@/components/info";
import { BrushIcon, ChatIcon, InfoIcon, LayersIcon, MailIcon, RulerIcon, ScissorsIcon, SparkleIcon } from "@/components/Icons";

const field = "h-[50px] w-full rounded-xl border border-[#d9d3d8] bg-white px-[15px] text-[16px] text-plum outline-none placeholder:text-[#9a9098] focus:border-plum";

export default function CustomServicePage() {
  const [f, setF] = useState({ name: "", email: "", occasion: "", shape: "Almond", length: "Medium", idea: "", date: "" });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  return (
    <>
      <InfoHero
        eyebrow="Made for you"
        title="Custom Nail Service"
        intro="Want a set made just for you? Personalize one of our designs or create a completely bespoke set from scratch."
      />
      <InfoBody>
        <InfoCard icon={<ScissorsIcon width={18} height={18} />} title="Customize one of our designs">
          <p>It&apos;s easy to make an existing set your own. Tailor the size, shape and design to match your style.</p>
          <div className="mt-4 grid gap-3.5 md:grid-cols-3">
            <IconTile icon={<RulerIcon width={18} height={18} />} title="Size">Choose your ideal nail size, from 6mm to 20mm.</IconTile>
            <IconTile icon={<LayersIcon width={18} height={18} />} title="Shape">Pick any of our existing nail shapes.</IconTile>
            <IconTile icon={<BrushIcon width={18} height={18} />} title="Design">Adjust colors, swap embellishments or modify the design to suit your taste.</IconTile>
          </div>
          <Callout icon={<ChatIcon width={18} height={18} />} title="Talk to us before you order">
            For any custom order, please contact our team first. This lets us confirm your request with our nail technicians and make sure we can bring your design to life.
          </Callout>
        </InfoCard>

        <InfoCard icon={<SparkleIcon width={18} height={18} />} title="Create a bespoke set">
          <p>
            Have a specific idea, or want something completely new? Email your ideas, inspiration or reference photos to <b>{SITE.email}</b>, or use the form below, and we&apos;ll work with you to create the perfect custom set.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Pill href={`mailto:${SITE.email}?subject=Custom%20nail%20set`}>Email your idea</Pill>
            <Pill href="/collections/shop-all" kind="outline">Browse designs</Pill>
          </div>
        </InfoCard>

        <InfoCard id="request" icon={<MailIcon width={18} height={18} />} title="Request a custom set">
          {sent ? (
            <div className="rounded-xl bg-[#f3ebf2] p-5">
              <p className="font-bold">Request received ✨</p>
              <p className="mt-1">An artist will email {f.email} within 1–2 business days with a sketch.</p>
            </div>
          ) : (
            <form
              noValidate
              className="grid gap-4 md:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || !f.idea) return setErr("Name, a valid email and your idea are required.");
                try {
                  await apiFetch("/contact", { body: { ...f, topic: "Custom design request", message: f.idea } });
                  setSent(true);
                } catch (e) {
                  setErr((e as Error).message);
                }
              }}
            >
              <label><span className="mb-2 block text-[14px] font-bold">Name</span><input className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label><span className="mb-2 block text-[14px] font-bold">Email</span><input type="email" className={field} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label><span className="mb-2 block text-[14px] font-bold">Occasion</span><input className={field} placeholder="Wedding, birthday…" value={f.occasion} onChange={(e) => setF({ ...f, occasion: e.target.value })} /></label>
              <label><span className="mb-2 block text-[14px] font-bold">Needed by</span><input type="date" className={field} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
              <label><span className="mb-2 block text-[14px] font-bold">Shape</span>
                <select className={field} value={f.shape} onChange={(e) => setF({ ...f, shape: e.target.value })}>{SHAPES.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label><span className="mb-2 block text-[14px] font-bold">Length</span>
                <select className={field} value={f.length} onChange={(e) => setF({ ...f, length: e.target.value })}>{["Short", "Medium", "Long", "Extra long"].map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="md:col-span-2"><span className="mb-2 block text-[14px] font-bold">Describe your idea</span><textarea className={`${field} h-36 py-3`} placeholder="Colours, motifs, links to inspiration…" value={f.idea} onChange={(e) => setF({ ...f, idea: e.target.value })} /></label>
              {err && <p className="text-[14px] text-[#b0263c] md:col-span-2">{err}</p>}
              <div className="md:col-span-2"><Pill type="submit">Send request</Pill></div>
            </form>
          )}
        </InfoCard>

        <InfoCard icon={<InfoIcon width={18} height={18} />} title="Good to know">
          <InfoAccordion
            items={[
              { q: "Is there a custom fee?", a: "No. Custom commissions are free and include up to 3 rounds of design approval." },
              { q: "How long does a custom set take?", a: "Standard turnaround is 2 to 3 weeks from design approval, plus shipping." },
              { q: "Can I return a custom order?", a: "Custom orders can't be returned, but if a set arrives defective we'll remake it at no charge." },
            ]}
          />
        </InfoCard>
      </InfoBody>
    </>
  );
}
