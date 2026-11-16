import Link from "next/link";
import type { Metadata } from "next";
import { SITE, type Pattern } from "@/lib/data";
import NailArt from "@/components/NailArt";
import Photo from "@/components/Photo";
import { CheckList, IconTile, InfoBody, InfoCard, InfoHero, Pill } from "@/components/info";
import { BrushIcon, GiftIcon, HeartOutline, LayersIcon, MailIcon, RepeatIcon, StarIcon, UsersIcon, QuestionIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "About Us" };

const STEPS: { title: string; text: string; palette: [string, string, string, string]; pattern: Pattern }[] = [
  { title: "Nail tip selection", text: "We choose high-quality tips in the shape and length that suit the design.", palette: ["#1f1b1d", "#f1d6cc", "#e9e3c4", "#ffffff"], pattern: "solid" },
  { title: "Surface prep", text: "Each nail is filed, buffed and cleaned for smooth application and long-lasting wear.", palette: ["#1f1b1d", "#e9c9c0", "#8f1d2c", "#ffffff"], pattern: "french" },
  { title: "Base application", text: "Layers of base coat are applied and cured under UV/LED light to build a strong foundation.", palette: ["#1f1b1d", "#f4e4dd", "#c0392b", "#ffffff"], pattern: "dots" },
  { title: "Hand painted art", text: "Every design is painted by hand, from fine details to special effects, charms and 3D art.", palette: ["#24201f", "#f6c9d3", "#ffffff", "#9ccc9c"], pattern: "flowers" },
  { title: "Top coat & finish", text: "A glossy or matte top coat is applied and cured for protection and shine. Every nail is then inspected.", palette: ["#1d1b33", "#232046", "#e7c76a", "#ffffff"], pattern: "stars" },
  { title: "Custom sizing & packaging", text: "Nails are matched to your size (or sent as a full set), then packed with nail glue, adhesive tabs and a prep kit.", palette: ["#24201f", "#f2ddd5", "#1c1c1c", "#ffffff"], pattern: "french" },
];

const photo = (name: string, palette: [string, string, string, string], pattern: Pattern, ratio = "aspect-[764/430]") => (
  <div className={`relative ${ratio} overflow-hidden rounded-2xl bg-[#1f1b1d]`}>
    <Photo name={name} sizes="764px" fallback={<NailArt palette={palette} pattern={pattern} className="h-full w-full" />} />
  </div>
);

export default function AboutPage() {
  return (
    <>
      <InfoHero
        eyebrow="A story about love for nails"
        title="The Oreo Nails Story"
        intro={`${SITE.name} is a creative nail studio dedicated to self-expression through beautiful, wearable art.`}
        anchors={[
          { id: "who", label: "Who we are" },
          { id: "handmade", label: "100% handmade" },
          { id: "receive", label: "What you receive" },
          { id: "process", label: "Our process" },
          { id: "why", label: "Why Oreo Nails" },
        ]}
      />
      <InfoBody>
        <InfoCard id="who" icon={<HeartOutline width={18} height={18} />} title="Who we are">
          {/* public/images/about-who.jpg */}
          {photo("about-who", ["#2a2326", "#f3e3dc", "#8f1d2c", "#ffffff"], "lights")}
          <p className="mt-5"><b>{SITE.name}</b> makes premium press-on nails for anyone who wants a salon-quality look without the time, commitment or damage of a traditional manicure.</p>
          <p className="mt-3">Born from a love of design and detail, every collection is thoughtfully curated, from everyday elegance to bold seasonal statements. Whether you are dressing up or showing off your signature style, we are here to put art at your fingertips.</p>
        </InfoCard>

        <InfoCard id="handmade" icon={<BrushIcon width={18} height={18} />} title="100% handmade">
          {/* public/images/about-handmade.jpg */}
          {photo("about-handmade", ["#2b2f36", "#e9e3c4", "#c0392b", "#ffffff"], "solid")}
          <p className="mt-5">Every set is <b>handmade</b> from start to finish. Each nail is carefully shaped, painted and decorated by real artists, not machines, using high-quality gel products and techniques.</p>
          <p className="mt-3">Our handmade process makes every set unique, durable and crafted with love and precision. It isn&apos;t just nail art. It&apos;s a personal touch you can feel.</p>
        </InfoCard>

        <InfoCard id="receive" icon={<GiftIcon width={18} height={18} />} title="What you receive">
          <p>Every order brings you more than just nails:</p>
          <CheckList
            cols={2}
            items={[
              <>A <b>complete kit</b>: nail glue, adhesive tabs, alcohol pads, a cuticle pusher and a mini file</>,
              <>Elegant <b>packaging</b>, perfect for gifting</>,
              <>The confidence of <b>reusable nails</b> made to last</>,
            ]}
          />
          <p className="mt-4">We believe beauty should be effortless, expressive and sustainable, and that is exactly what we deliver.</p>
        </InfoCard>

        <InfoCard id="process" icon={<LayersIcon width={18} height={18} />} title="Our handmade process">
          <p>From shaping and painting to final packaging, our process blends artistry with attention to detail.</p>
          <div className="mt-3 grid gap-x-[18px] gap-y-6 sm:grid-cols-2 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                {/* public/images/process-1.jpg … process-6.jpg */}
                {photo(`process-${i + 1}`, s.palette, s.pattern, "aspect-square")}
                <p className="mt-4 font-work text-[10.5px] font-semibold uppercase tracking-[1.8px] text-muted">Step {i + 1}</p>
                <p className="text-[16px] font-bold">{s.title}</p>
                <p className="mt-1 text-[14.5px] leading-[1.65]">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6"><Pill href="/pages/how-to-apply">See the full process</Pill></div>
        </InfoCard>

        <InfoCard id="why" icon={<StarIcon width={18} height={18} />} title="Why Oreo Nails">
          <div className="grid gap-3.5 md:grid-cols-2">
            <IconTile icon={<BrushIcon width={18} height={18} />} title="Hand painted by artists">Each set is individually crafted by nail artists, never printed.</IconTile>
            <IconTile icon={<RepeatIcon width={18} height={18} />} title="Custom-fit & reusable">Salon-level quality designed for long wear: 2–4 weeks per wear, 5–10 wears per set.</IconTile>
            <IconTile icon={<HeartOutline width={18} height={18} />} title="Personal styling service">Want something unique? Our <Link href="/pages/custom-nail-service" className="font-bold text-plum underline">custom service</Link> paints a set just for you.</IconTile>
            <IconTile icon={<UsersIcon width={18} height={18} />} title="Trusted by 18,000+ customers">Loved and reordered by customers around the world.</IconTile>
          </div>
        </InfoCard>

        <InfoCard icon={<MailIcon width={18} height={18} />} title="Get in touch">
          <p>Questions about an order, sizing or a custom set? We reply within one business day.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Pill href={`mailto:${SITE.email}`}><MailIcon width={16} height={16} /> Email us</Pill>
            <Pill href="/pages/faq" kind="outline"><QuestionIcon width={16} height={16} /> Help Center</Pill>
          </div>
        </InfoCard>
      </InfoBody>
    </>
  );
}
