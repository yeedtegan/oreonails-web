import { SITE } from "@/lib/data";
import NailArt from "@/components/NailArt";
import { InfoBody, InfoCard, InfoHero, NumberedRows, Pill } from "@/components/info";
import { CoinsIcon, GiftIcon, MailIcon, QuestionIcon, SparkleIcon, UsersIcon } from "@/components/Icons";

const REWARDS = [
  { pts: 500, label: "$5 off your order" },
  { pts: 1000, label: "Free shipping" },
  { pts: 1500, label: "$15 off your order" },
  { pts: 2500, label: "Free 3-in-1 Nail Glue Pro Kit" },
];

export default function RewardsPage() {
  return (
    <>
      <InfoHero
        eyebrow="Loyalty program"
        title="The Oreo Club"
        intro="Earn points on every order and turn them into discounts, free shipping and a free 3-in-1 Nail Glue Pro Kit. Free to join."
        actions={
          <>
            <Pill href="/account" kind="white">Join free</Pill>
            <Pill href="#my-rewards" kind="ghost">View my rewards</Pill>
          </>
        }
      />
      <InfoBody>
        <InfoCard icon={<SparkleIcon width={18} height={18} />} title="How it works">
          <NumberedRows
            items={[
              { title: "Join", text: "Sign up free to The Oreo Club and get 100 welcome points." },
              { title: "Earn", text: "Get 5 points for every $1 you spend, plus bonuses for signing up, your birthday and following us." },
              { title: "Redeem", text: "Turn your points into discounts, free shipping or a free Nail Glue Pro Kit." },
            ]}
          />
        </InfoCard>

        <InfoCard id="my-rewards" icon={<CoinsIcon width={18} height={18} />} title="Earn points on every order">
          <div className="relative aspect-[764/360] overflow-hidden rounded-2xl">
            <NailArt palette={["#9fc5e8", "#f7d06b", "#e35d8a", "#ffffff"]} pattern="dots" className="h-full w-full" />
            <a href="/account" className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-4 py-3 text-[15px] font-bold backdrop-blur hover:underline">
              Sign in to see your points
            </a>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {REWARDS.map((r) => (
              <div key={r.pts} className="flex items-center justify-between rounded-xl border border-line p-4">
                <span>
                  <b className="block text-[15.5px]">{r.label}</b>
                  <span className="text-[13.5px] text-muted">{r.pts.toLocaleString()} points</span>
                </span>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard icon={<UsersIcon width={18} height={18} />} title="Refer a friend">
          <p>Share your personal link. Your friend gets a welcome reward on their first order, and you earn 500 points when they buy.</p>
          <div className="mt-4"><Pill href="/account"><GiftIcon width={16} height={16} /> Refer a friend</Pill></div>
        </InfoCard>

        <InfoCard icon={<QuestionIcon width={18} height={18} />} title="Questions?">
          <p>We reply within one business day.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Pill href={`mailto:${SITE.email}`}><MailIcon width={16} height={16} /> Email us</Pill>
            <Pill href="/pages/faq" kind="outline">Help Center</Pill>
          </div>
        </InfoCard>
      </InfoBody>
    </>
  );
}
