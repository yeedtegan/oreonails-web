import type { Metadata } from "next";
import localFont from "next/font/local";
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
// Self-hosted latin variable fonts (from Google Fonts) in ./fonts, so builds never depend on fetching Google Fonts.
const nunito = localFont({ variable: "--font-nunito", src: "./fonts/nunito-sans.woff2", weight: "400 800", style: "normal" });
const work = localFont({ variable: "--font-work-sans", src: "./fonts/work-sans.woff2", weight: "400 700", style: "normal" });
const playfair = localFont({
  variable: "--font-playfair",
  src: [
    { path: "./fonts/playfair.woff2", weight: "400 600", style: "normal" },
    { path: "./fonts/playfair-italic.woff2", weight: "400 600", style: "italic" },
  ],
});
const playfairDisplay = localFont({
  variable: "--font-playfair-display",
  src: [
    { path: "./fonts/playfair-display.woff2", weight: "500 600", style: "normal" },
    { path: "./fonts/playfair-display-italic.woff2", weight: "500 600", style: "italic" },
  ],
});

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
