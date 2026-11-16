import Link from "next/link";
import type { Pattern } from "@/lib/data";
import NailArt from "./NailArt";

/** Single-column accordion: hairline rows, plum question, "+" in a pink circle. */
export function Accordion({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="border-t border-[#dedade]">
      {items.map((f) => (
        <details key={f.q} className="group border-b border-[#dedade]">
          <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-4 px-[22px] text-base font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-soft text-lg leading-none transition group-open:rotate-45">+</span>
          </summary>
          <div className="px-[22px] pb-5 text-[15px] leading-relaxed text-muted">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

/** FAQ in two columns (3 + 3) with a 48px gutter, as on the reference homepage. */
export function FaqColumns({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  const half = Math.ceil(items.length / 2);
  return (
    <div className="grid gap-0 md:grid-cols-2 md:gap-12">
      <Accordion items={items.slice(0, half)} />
      <div className="-mt-px md:mt-0">
        <Accordion items={items.slice(half)} />
      </div>
    </div>
  );
}

/** Collection block header: Times title + subtitle on the left, plum pill CTA on the right. */
export function CollectionHeader({ title, subtitle, href, cta = "Shop this collection" }: { title: string; subtitle?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-5 flex flex-col items-center gap-4 text-center md:mb-6 md:flex-row md:items-center md:justify-between md:text-left">
      <div>
        <h2 className="h-section">{title}</h2>
        {subtitle && <p className="mt-1.5 text-[16.8px] font-medium leading-[1.56]">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="btn-plum hidden shrink-0 md:inline-flex">
          {cta}
        </Link>
      )}
    </div>
  );
}

/** Centred CTA shown under a collection grid on phones (the header CTA is desktop-only). */
export function MobileCta({ href, cta = "Shop this collection" }: { href: string; cta?: string }) {
  return (
    <div className="mt-5 text-center md:hidden">
      <Link href={href} className="btn-plum h-11">{cta}</Link>
    </div>
  );
}

/** Kept for secondary pages. */
export function SectionHeading(props: { title: string; subtitle?: string; href?: string; cta?: string }) {
  return <CollectionHeader {...props} />;
}

/** Simple page header for content pages. */
export function PageHero({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="bg-card">
      <div className="container-x py-12 text-center md:py-14">
        {eyebrow && <p className="eyebrow mb-2 text-muted">{eyebrow}</p>}
        <h1 className="font-display text-[34px] leading-[1.15] font-medium md:text-[44px]">{title}</h1>
        {intro && <p className="mx-auto mt-3 max-w-2xl text-[16px] font-medium text-muted">{intro}</p>}
      </div>
    </div>
  );
}

/** Large promo banner with nail art on one side. */
export function Banner({
  eyebrow,
  title,
  text,
  cta,
  href,
  palette,
  pattern,
  shape,
  reverse,
  dark,
}: {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  palette: [string, string, string, string];
  pattern: Pattern;
  shape?: string;
  reverse?: boolean;
  dark?: boolean;
}) {
  return (
    <section className={`overflow-hidden ${dark ? "bg-plum text-white" : "bg-card"}`}>
      <div className={`grid items-center lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <NailArt palette={palette} pattern={pattern} shape={shape} className="aspect-[4/3] w-full lg:aspect-square lg:max-h-[620px]" />
        <div className="px-6 py-14 sm:px-12 lg:px-16">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight font-medium sm:text-6xl">{title}</h2>
          <p className={`mt-4 text-lg ${dark ? "text-white/75" : "text-muted"}`}>{text}</p>
          <Link href={href} className={`mt-8 ${dark ? "btn-white" : "btn-dark"}`}>
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
