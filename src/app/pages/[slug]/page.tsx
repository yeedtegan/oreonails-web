import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE } from "@/lib/data";
import HowToApply from "@/components/HowToApply";
import { Callout, CheckList, InfoAccordion, InfoBody, InfoCard, InfoHero, Pill, StatTiles } from "@/components/info";
import { BoxIcon, ChatIcon, ClockIcon, HandIcon, InfoIcon, RepeatIcon, RulerIcon, ShieldIcon, SparkleIcon, StarIcon, TruckIcon, QuestionIcon, MailIcon } from "@/components/Icons";

// Structured content pages in the reference "info" template. `**bold**` is supported in text.
type Icon = "hand" | "box" | "ruler" | "repeat" | "clock" | "info" | "shield" | "sparkle" | "star" | "truck" | "chat" | "question";
const ICONS: Record<Icon, React.ReactNode> = {
  hand: <HandIcon width={18} height={18} />, box: <BoxIcon width={18} height={18} />, ruler: <RulerIcon width={18} height={18} />,
  repeat: <RepeatIcon width={18} height={18} />, clock: <ClockIcon width={18} height={18} />, info: <InfoIcon width={18} height={18} />,
  shield: <ShieldIcon width={18} height={18} />, sparkle: <SparkleIcon width={18} height={18} />, star: <StarIcon width={18} height={18} />,
  truck: <TruckIcon width={18} height={18} />, chat: <ChatIcon width={18} height={18} />, question: <QuestionIcon width={18} height={18} />,
};

interface Section {
  id: string;
  title: string;
  eyebrow?: string;
  icon?: Icon;
  text?: string[];
  checklist?: string[];
  checklistCols?: 1 | 2;
  callout?: { title: string; text: string };
  faq?: { q: string; a: string }[];
  howto?: boolean;
}
interface Page {
  eyebrow: string;
  title: string;
  intro: string;
  lead?: string;
  stats?: { big: string; small: string }[];
  numbered?: boolean;
  sections: Section[];
}

const CONTENT: Record<string, Page> = {
  "how-to-apply": {
    eyebrow: "Application guide",
    title: "How to Apply",
    intro: "Get a salon-finished look at home. Follow these steps for a secure, comfortable fit that lasts.",
    sections: [
      { id: "video", icon: "sparkle", eyebrow: "Prep, glue, tabs and removal", title: "Watch how it's done", howto: true },
      { id: "need", icon: "box", title: "What you need", text: ["Everything you need comes in the box, so you can start right away."], checklistCols: 2,
        checklist: ["**10 hand-painted nails**, matched to your size", "**Nail glue** for 2 to 4 weeks of wear", "**2 sheets of adhesive tabs** for 1 to 3 days of wear", "**2 alcohol pads** to remove oils before you apply", "**Cuticle pusher** to push back cuticles", "**Mini nail file** to shape and lightly buff your natural nails"] },
      { id: "fit", icon: "ruler", title: "Check your fit", text: ["Before any glue, lay the nails out and match one to each finger. The press-on should cover your nail **edge to edge** without touching the skin. If a nail is between sizes, choose the larger one and file the sides."],
        callout: { title: "No gap, no overlap", text: "A nail that is too narrow lifts at the sides; too wide and it presses on the skin. Our Size Guide has a calculator." } },
      { id: "glue", icon: "hand", title: "Apply with glue (2–4 weeks)", text: ["**1. Prep.** Push back cuticles, lightly buff the shine off, wipe each nail with the alcohol pad.", "**2. Glue.** Add a thin layer to your natural nail and a drop on the press-on.", "**3. Press.** Angle it from the cuticle down and hold firmly for 30 seconds. Avoid water for one hour."] },
      { id: "tabs", icon: "hand", title: "Apply with tabs (1–3 days)", text: ["Peel a tab, press it onto your clean nail and remove the top film. Place the press-on and hold for 30 seconds. Perfect for a weekend or an event, and the easiest way to test your fit."] },
      { id: "aftercare", icon: "repeat", title: "Aftercare", text: ["Wear gloves for wet work, keep cuticle oil on the cuticle only, and avoid long hot soaks. See the full [Care & Reuse Guide](/pages/care-guide)."] },
      { id: "questions", icon: "question", title: "Questions", faq: [
        { q: "Glue or tabs — which should I use?", a: "Tabs for 1–3 days, glue for 2–4 weeks. Start with tabs to test your fit." },
        { q: "Can I shower after applying?", a: "Yes, but wait one hour after gluing and avoid long hot baths." },
        { q: "A nail popped off. What now?", a: "Clean off the old glue, wipe with alcohol and reapply with a thin layer of fresh glue." },
      ] },
    ],
  },
  "care-guide": {
    eyebrow: "Care & reuse",
    title: "Press-On Nail Care & Reuse Guide",
    intro: "Simple habits that keep your hand-painted set looking new, wear after wear.",
    lead: `A ${SITE.name} hand-painted press-on set is built to be worn 5 to 10 times. Below is the complete care protocol — written by our studio artists, refined over years of customer feedback.`,
    sections: [
      { id: "daily", icon: "hand", title: "Daily Care While Wearing", text: ["**Wear gloves for wet work.** Dishes, household cleaning, gardening, hair-dyeing. Two pairs of gloves buy weeks of extra wear.", "**Cuticle oil daily — on the cuticle ONLY.** If oil seeps under the press-on at the seam, it creates a wedge. Let it absorb before hand-washing.", "**Avoid prolonged hot water.** Quick showers are fine. Long baths and hot tubs weaken the bond.", "**Don't use your nails as tools.** No can-tab opening, no sticker peeling."] },
      { id: "remove", icon: "info", title: "How to Remove Without Damage", text: ["Soak fingertips in warm soapy water with a little cuticle oil for **10–15 minutes**. Gently lift from the side with the cuticle pusher. If it resists, soak longer — never force it off."] },
      { id: "residue", icon: "sparkle", title: "Cleaning Glue Residue", text: ["Buff old glue off the underside of each press-on with the file, then wipe with alcohol. Clean your natural nails the same way before the next wear."] },
      { id: "storage", icon: "box", title: "Storage Between Wears", text: ["Store each set flat in its original box, sorted by finger. Keep away from heat and direct sunlight."] },
      { id: "reapply", icon: "repeat", title: "Re-Application for Second+ Wear", text: ["Prep exactly as the first time: push back cuticles, buff, alcohol. Use fresh glue or tabs."] },
      { id: "retire", icon: "star", title: "When to Retire a Set", text: ["Retire a set when the tips crack, the art chips through to the base, or the curve no longer sits flush."] },
      { id: "faq", icon: "question", title: "Frequently Asked Questions", faq: [
        { q: "How many times can I reuse a set?", a: "5 to 10 wears with good removal and storage." },
        { q: "Can I file or shorten them?", a: "Yes. File gently in one direction, then seal the edge with a clear top coat if you have one." },
      ] },
    ],
  },
  "shipping-policy": {
    eyebrow: "Policies",
    title: "Shipping Policy and Delivery",
    intro: `We deliver our handcrafted nail sets wherever you are in the world. Here is what to expect when you order from ${SITE.name}.`,
    stats: [
      { big: "2–3 days", small: "crafting before dispatch" },
      { big: "7–10 days", small: "standard delivery, US and worldwide" },
      { big: `$${SITE.freeShippingThreshold}`, small: "free shipping worldwide from here" },
    ],
    numbered: true,
    sections: [
      { id: "rates", eyebrow: `Calculated at checkout, free from $${SITE.freeShippingThreshold} USD`, title: "Shipping rates", text: [`Shipping costs and estimated delivery times are calculated and shown at checkout. Shipping is **free on all orders** with a subtotal of $${SITE.freeShippingThreshold} USD or more. It is applied automatically, so you don't need a code. Below that, standard shipping is $${SITE.shippingFee}.`] },
      { id: "crafting", eyebrow: "Made to order, so allow a little time before dispatch", title: "Crafting your nails", text: [`Every ${SITE.name} set is **made to order**, so each one is a unique piece made just for you. This also supports our commitment to sustainability by minimizing waste.`], callout: { title: "Allow 2 to 3 business days", text: "This is the time our artists need to craft your set before it ships." } },
      { id: "tracking", eyebrow: "Emailed the day your parcel leaves", title: "Tracking", text: ["Once your order ships you receive an email with your tracking number. You can also check status any time on our [Track Order](/pages/track-order) page."] },
      { id: "delivery", eyebrow: "After dispatch", title: "Delivery times", text: ["Standard delivery takes **7–10 business days** to the US and most countries. Customs can add a few days during peak season."] },
      { id: "lost", eyebrow: "We'll make it right", title: "Lost packages", text: ["If tracking hasn't moved for 10 business days, contact us and we'll open an investigation with the carrier and reship or refund."] },
    ],
  },
  "return-policy": {
    eyebrow: "Policies",
    title: "Returns & Exchanges",
    intro: "Not quite right? Most issues are fixed with a free size exchange. Here's how returns work.",
    stats: [
      { big: "30 days", small: "free size exchange" },
      { big: "30 days", small: "returns on unworn sets" },
      { big: "7 days", small: "to report damage" },
    ],
    numbered: true,
    sections: [
      { id: "exchange", eyebrow: "The fastest fix", title: "Free size exchange", text: ["If your set doesn't fit, contact us within 30 days of delivery and we'll send a new size **free of charge**."] },
      { id: "returns", eyebrow: "Unworn, in original packaging", title: "Returns", text: ["Unworn sets in original packaging can be returned within 30 days for a refund to the original payment method. Return shipping is paid by the customer."] },
      { id: "damaged", eyebrow: "Send a photo", title: "Damaged or defective items", text: ["Email us a photo within 7 days of delivery and we'll remake your set at no cost."] },
      { id: "final", eyebrow: "Not eligible", title: "Non-returnable items", checklist: ["Custom orders (remade free if defective)", "Worn sets", "Opened tools and glue"] },
    ],
  },
  "privacy-policy": {
    eyebrow: "Policies",
    title: "Privacy Policy",
    intro: "What we collect, why we collect it, and how to control it.",
    sections: [
      { id: "collect", icon: "shield", title: "What we collect", text: ["Only what we need to process your orders and improve your experience: your name, email, shipping address and order history."] },
      { id: "use", icon: "info", title: "How we use your data", checklist: ["To fulfil and ship orders", "To send marketing emails if you subscribed (unsubscribe anytime)", "To improve our website"] },
      { id: "rights", icon: "chat", title: "Your rights", text: [`You can request access to or deletion of your data at any time by emailing **${SITE.email}**.`] },
    ],
  },
  "terms-of-service": {
    eyebrow: "Policies",
    title: "Terms of Service",
    intro: "By using this website and placing an order you agree to these terms.",
    sections: [
      { id: "orders", icon: "box", title: "Orders", text: ["All orders are subject to availability and acceptance. Prices are listed in USD and may change without notice."] },
      { id: "products", icon: "sparkle", title: "Products", text: ["Because every set is hand-painted, slight variations from product photos are normal and part of the charm."] },
      { id: "liability", icon: "shield", title: "Liability", text: ["Discontinue use if irritation occurs. We are not liable for damage caused by improper application or removal."] },
    ],
  },
};

/** Renders `**bold**` and `[label](/href)` inline markup. */
function rich(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    if (p.startsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
    const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) return <Link key={i} href={m[2]} className="font-bold underline">{m[1]}</Link>;
    return p;
  });
}

export function generateStaticParams() {
  return Object.keys(CONTENT).map((slug) => ({ slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return { title: CONTENT[(await params).slug]?.title };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = CONTENT[(await params).slug];
  if (!page) notFound();
  return (
    <>
      <InfoHero eyebrow={page.eyebrow} title={page.title} intro={page.intro} anchors={page.sections.map((s) => ({ id: s.id, label: s.title.replace(/ \(.*\)$/, "") }))} />
      <InfoBody>
        {page.lead && <InfoCard><p>{page.lead}</p></InfoCard>}
        {page.stats && <InfoCard><StatTiles items={page.stats} /></InfoCard>}
        {page.sections.map((s, i) => (
          <InfoCard key={s.id} id={s.id} title={s.title} eyebrow={s.eyebrow} number={page.numbered ? i + 1 : undefined} icon={s.icon ? ICONS[s.icon] : undefined}>
            {s.howto && <HowToApply embedded />}
            {s.text?.map((t, j) => <p key={j} className={j ? "mt-3.5" : ""}>{rich(t)}</p>)}
            {s.checklist && <CheckList cols={s.checklistCols} items={s.checklist.map((c) => rich(c))} />}
            {s.callout && <Callout icon={<ClockIcon width={18} height={18} />} title={s.callout.title}>{s.callout.text}</Callout>}
            {s.faq && <InfoAccordion items={s.faq} />}
          </InfoCard>
        ))}
        <InfoCard icon={<MailIcon width={18} height={18} />} title="Still have questions?">
          <p>Our team replies within one business day.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Pill href="/pages/contact">Contact us</Pill>
            <Pill href="/pages/faq" kind="outline">Help Center</Pill>
          </div>
        </InfoCard>
      </InfoBody>
    </>
  );
}
