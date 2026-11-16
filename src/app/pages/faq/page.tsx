import type { Metadata } from "next";
import { SITE } from "@/lib/data";
import { api } from "@/lib/api-server";
import { InfoAccordion, InfoBody, InfoCard, InfoHero } from "@/components/info";
import { BrushIcon, GiftIcon, HandIcon, RepeatIcon, RulerIcon, SparkleIcon, TruckIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "FAQ" };

const ICONS: Record<string, React.ReactNode> = {
  "About Oreo Nails & Our Craft": <BrushIcon width={18} height={18} />,
  "Application & Wear": <HandIcon width={18} height={18} />,
  "Sizing & Fit": <RulerIcon width={18} height={18} />,
  "Care & Reuse": <RepeatIcon width={18} height={18} />,
  "Custom & Bespoke": <SparkleIcon width={18} height={18} />,
  "Shipping, Returns & Wholesale": <TruckIcon width={18} height={18} />,
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function FaqPage() {
  const faqs = await api.faqs();
  const groups: { title: string; items: typeof faqs }[] = [];
  for (const f of faqs) {
    const title = f.category ?? "General";
    const g = groups.find((x) => x.title === title) ?? groups[groups.push({ title, items: [] }) - 1];
    g.items.push(f);
  }
  const order = Object.keys(ICONS);
  groups.sort((a, b) => (order.indexOf(a.title) + 99) % 99 - (order.indexOf(b.title) + 99) % 99);

  return (
    <>
      <InfoHero
        eyebrow="Help"
        title="Frequently Asked Questions"
        intro="Quick answers about our hand-painted press-ons, from wear and sizing to shipping and returns."
        anchors={groups.map((g) => ({ id: slug(g.title), label: g.title }))}
      />
      <InfoBody>
        <InfoCard>
          <p>
            Everything you need to know about {SITE.name} hand-painted press-on nails — organized into {groups.length} sections. If you don&apos;t see your question here, email{" "}
            <a href={`mailto:${SITE.email}`} className="font-bold underline">{SITE.email}</a> for a same-day reply.
          </p>
        </InfoCard>
        {groups.map((g) => (
          <InfoCard key={g.title} id={slug(g.title)} icon={ICONS[g.title] ?? <GiftIcon width={18} height={18} />} title={g.title}>
            <InfoAccordion items={g.items} />
          </InfoCard>
        ))}
      </InfoBody>
    </>
  );
}
