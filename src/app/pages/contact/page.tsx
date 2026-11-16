"use client";

import { useState } from "react";
import { SITE } from "@/lib/data";
import { apiFetch } from "@/lib/api-client";
import { InfoBody, InfoCard, InfoHero, IconTile, Pill } from "@/components/info";
import { ChatIcon, ChevronDown, ClockIcon, MailIcon, PhoneIcon, PinIcon, QuestionIcon, StoreIcon } from "@/components/Icons";

const TOPICS = ["Technical Issue", "Our Service (Attitude, Support, Partnership..)", "Our Products (Quality, Image, Informations)", "About My Order", "Payment Issue", "Delivery Issue"];

const field = "h-[50px] w-full rounded-xl border border-[#d9d3d8] bg-white px-[15px] text-[16px] text-plum outline-none placeholder:text-[#9a9098] focus:border-plum";
const label = "mb-2 block text-[14px] font-bold";

export default function ContactPage() {
  const [f, setF] = useState({ name: "", email: "", phone: "", topic: TOPICS[0], message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");

  return (
    <>
      <InfoHero
        eyebrow="We are here to help"
        title="Contact Us"
        intro="Let's talk nails! Reach out with any questions, ideas or feedback. Fill in the form below and we will be in touch soon."
        actions={
          <>
            <Pill href="#contact-form" kind="white">Send a message</Pill>
            <Pill href={`mailto:${SITE.email}`} kind="ghost">Email us</Pill>
          </>
        }
      />
      <InfoBody>
        <InfoCard icon={<QuestionIcon width={18} height={18} />} title="Find a quick answer">
          <p>Many questions about orders, sizing, wear and returns are answered in our Help Center.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Pill href="/pages/faq">Visit the Help Center</Pill>
            <Pill href="/pages/track-order" kind="outline">Track your order</Pill>
          </div>
        </InfoCard>

        <InfoCard icon={<ChatIcon width={18} height={18} />} title="Contact information">
          <div className="grid gap-3.5 md:grid-cols-2">
            <IconTile icon={<MailIcon width={18} height={18} />} title="Email"><a href={`mailto:${SITE.email}`} className="font-bold text-plum underline">{SITE.email}</a></IconTile>
            <IconTile icon={<PhoneIcon width={18} height={18} />} title="WhatsApp (SMS only)"><span className="font-bold text-plum underline">{SITE.whatsapp}</span></IconTile>
            <IconTile icon={<ClockIcon width={18} height={18} />} title="Support hours">{SITE.hours}</IconTile>
            <IconTile icon={<PinIcon width={18} height={18} />} title="Address">{SITE.address}</IconTile>
            <IconTile icon={<StoreIcon width={18} height={18} />} title="Studio">Hand-painting studio · visits by appointment</IconTile>
          </div>
        </InfoCard>

        <div className="h-8" />

        <section id="contact-form" className="scroll-mt-28 rounded-2xl bg-white p-5 shadow-[0_2px_14px_rgba(75,56,76,0.06)] md:p-8">
          <h2 className="font-playfair-display text-[30px] font-normal">Contact us</h2>
          {state === "sent" ? (
            <div className="mt-6 rounded-xl bg-[#f3ebf2] p-6">
              <p className="text-[17px] font-bold">Message sent 💌</p>
              <p className="mt-1 text-[15px]">Thanks {f.name}, we&apos;ll reply to {f.email} within one business day.</p>
            </div>
          ) : (
            <form
              noValidate
              className="mt-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!f.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || !f.message.trim()) {
                  return setErr("Please fill in your name, a valid email and a message.");
                }
                setErr("");
                setState("sending");
                try {
                  await apiFetch("/contact", { body: f });
                  setState("sent");
                } catch (e) {
                  setErr((e as Error).message);
                  setState("idle");
                }
              }}
            >
              <label className="block"><span className={label}>Name</span><input className={field} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label className="block"><span className={label}>Email</span><input type="email" className={field} placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label className="block"><span className={label}>Phone Number</span><input type="tel" className={field} placeholder="Phone Number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
              <label className="block">
                <span className={label}>I need help with*</span>
                <span className="relative block">
                  <select className={`${field} appearance-none pr-10`} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
                    {TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown width={14} height={14} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2" />
                </span>
              </label>
              <label className="block"><span className={label}>Message</span><textarea className={`${field} h-[250px] py-3`} placeholder="Message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
              {err && <p className="text-[14px] text-[#b0263c]">{err}</p>}
              <button disabled={state === "sending"} className="mt-2 h-[52px] w-[220px] rounded-full bg-plum font-work text-[15px] font-bold text-white transition hover:bg-plum-light disabled:opacity-60">
                {state === "sending" ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </section>
      </InfoBody>
    </>
  );
}
