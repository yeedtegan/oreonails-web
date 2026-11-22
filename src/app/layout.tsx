import type { Metadata } from "next";
import { Cormorant_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Oreo Nails — Custom Nail Design",
  description:
    "Upload a photo of your hand, describe your dream nails and let Oreo Nails generate a custom nail design.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="relative min-h-full font-body text-[1.0625rem]">{children}</body>
    </html>
  );
}
