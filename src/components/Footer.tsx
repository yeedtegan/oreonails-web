import Link from "next/link";
import { NAV, SITE } from "@/lib/data";
import { NewsletterFooter } from "./Newsletter";
import { ChevronDown, FacebookIcon, InstagramIcon, Logo, PinterestIcon, Stars, TiktokIcon, YoutubeIcon } from "./Icons";

const PAYMENTS = ["VISA", "MC", "AMEX", "PayPal", "Pay", "GPay"];
const SOCIALS = [
  [SITE.socials.instagram, InstagramIcon, "Instagram"],
  [SITE.socials.tiktok, TiktokIcon, "TikTok"],
  [SITE.socials.facebook, FacebookIcon, "Facebook"],
  [SITE.socials.pinterest, PinterestIcon, "Pinterest"],
  [SITE.socials.youtube, YoutubeIcon, "YouTube"],
] as const;

function LinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="block py-[5px] text-[14.5px] font-medium hover:underline">{l.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function SupportExtra() {
  return (
    <>
      <Link href="/pages/contact" className="mt-4 inline-flex h-10 items-center rounded-full border border-cream px-[18px] text-sm font-semibold transition hover:bg-white/10">
        Submit a request
      </Link>
      <p className="mt-3 text-[13px] leading-[1.45] text-cream/80">Support time: Mon to Sat, 9 AM to 5 PM (GMT+7)</p>
    </>
  );
}

/**
 * Plum footer. Desktop (lg+): newsletter row · brand + 4 link columns · bottom bar.
 * Below lg it switches to the reference's centred stack with accordion link groups.
 */
export default function Footer() {
  return (
    <footer className="bg-plum text-cream">
      <div className="mx-auto max-w-[1160px] px-[18px] xl:px-0">
        {/* newsletter */}
        <div className="grid items-center gap-6 border-b border-white/15 pt-12 pb-9 text-center lg:grid-cols-[1fr_480px] lg:gap-16 lg:pb-[46px] lg:text-left">
          <div>
            <p className="font-playfair-display text-[26px] font-medium lg:text-[28px]">Get 10% off your first order</p>
            <p className="mt-1.5 text-[14.5px] font-medium">New hand painted drops and early sale access, straight to your inbox.</p>
          </div>
          <div className="mx-auto w-full max-w-[460px] lg:max-w-none">
            <NewsletterFooter />
          </div>
        </div>

        {/* brand + links */}
        <div className="grid py-10 lg:grid-cols-[298px_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-center text-center lg:items-start lg:pr-10 lg:text-left">
            <Logo className="w-fit scale-125 text-cream lg:origin-left" />
            <Link href="/pages/reviews" className="mt-7 flex items-center gap-2 text-[14px] font-medium">
              <Stars rating={4.8} size={17} className="text-cream/90" />
              <span>4.8 · <span className="underline underline-offset-2">1,190 reviews</span></span>
            </Link>
            <p className="mt-5 max-w-[264px] text-[13.5px] leading-[1.5] font-medium">{SITE.tagline}</p>
          </div>

          {/* desktop columns */}
          {NAV.footer.map((col) => (
            <div key={col.title} className="hidden lg:block">
              <p className="mb-2 font-work text-[17px] font-semibold">{col.title}</p>
              <LinkList links={col.links} />
              {col.title === "Help" && <SupportExtra />}
            </div>
          ))}

          {/* mobile / tablet accordions */}
          <div className="mt-8 border-t border-white/15 lg:hidden">
            {NAV.footer.map((col) => (
              <details key={col.title} className="group border-b border-white/15">
                <summary className="flex h-[58px] cursor-pointer list-none items-center justify-between px-1 font-work text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                  {col.title}
                  <ChevronDown width={18} height={18} className="transition group-open:rotate-180" />
                </summary>
                <div className="px-1 pb-4">
                  <LinkList links={col.links} />
                  {col.title === "Help" && <SupportExtra />}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* bottom bar */}
        <div className="grid items-center justify-items-center gap-6 py-6 text-center lg:grid-cols-3 lg:justify-items-stretch lg:border-t lg:border-white/15 lg:text-left">
          <span className="flex items-center gap-2 text-[15px] font-medium">
            <span className="text-lg leading-none">🇺🇸</span> United States | $(USD) <span className="text-[9px]">▼</span>
          </span>
          <div className="flex items-center gap-8 lg:justify-center">
            {SOCIALS.map(([href, Icon, label]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="opacity-90 transition hover:opacity-100">
                <Icon />
              </a>
            ))}
          </div>
          <div className="text-[13px] leading-[1.6] font-medium lg:text-right">
            <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
            <p>Studio: {SITE.address}</p>
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 lg:justify-end">
              {PAYMENTS.map((p) => (
                <span key={p} className="grid h-[13px] min-w-[19px] place-items-center rounded-[2px] bg-white px-0.5 text-[6px] font-bold text-plum">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
