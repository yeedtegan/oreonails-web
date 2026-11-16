import type { Metadata } from "next";
import { NewsletterForm } from "@/components/Newsletter";
import NailArt from "@/components/NailArt";

export const metadata: Metadata = { title: "Black Friday Early Access" };

export default function BlackFridayPage() {
  return (
    <section className="bg-ink text-cream">
      <div className="container-x grid items-center gap-10 py-20 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-soft">Black Friday</p>
          <h1 className="h-display mt-3 text-5xl sm:text-6xl">Get early access</h1>
          <p className="mt-4 max-w-md text-cream/70">Join the list to shop our biggest sale of the year 24 hours before everyone else — plus 10% off your first order right now.</p>
          <div className="mt-8 max-w-md">
            <NewsletterForm dark cta="Join the list" />
          </div>
        </div>
        <NailArt palette={["#111111", "#1c1c1c", "#d4af37", "#ffffff"]} pattern="stars" shape="Coffin" className="aspect-square w-full rounded-3xl" />
      </div>
    </section>
  );
}
