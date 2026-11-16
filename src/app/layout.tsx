import type { Metadata } from "next";
import { Nunito_Sans, Playfair, Playfair_Display, Work_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import { NewsletterPopup } from "@/components/Newsletter";
import { api } from "@/lib/api-server";
import ShopChrome from "@/components/ShopChrome";

// Same type system as the reference: Nunito Sans (UI), Work Sans (eyebrows/labels), Playfair (headings).
const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const work = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const playfair = Playfair({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const playfairDisplay = Playfair_Display({ variable: "--font-playfair-display", subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Oreo Nails — Hand-Painted Press-On Nails", template: "%s | Oreo Nails" },
  description: "Salon-quality press-on nails, hand-painted to order. Wear 2–4 weeks, reuse 5–10 times.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Navigation should still render if the API is down; pages show their own error state.
  const [collections, recommendations] = await Promise.all([
    api.collections().catch(() => []),
    api.products({ collection: "new-arrivals", type: "set", limit: 12 }).catch(() => []),
  ]);
  return (
    <html lang="en" className={`${nunito.variable} ${work.variable} ${playfair.variable} ${playfairDisplay.variable}`}>
      <body className="overflow-x-hidden font-sans antialiased">
        <StoreProvider>
          <ShopChrome>
            <Header collections={collections} />
          </ShopChrome>
          <main className="min-h-[60vh]">{children}</main>
          <ShopChrome>
            <Footer />
            <CartDrawer recommendations={recommendations} collections={collections} />
            <SearchOverlay />
            <NewsletterPopup />
          </ShopChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
