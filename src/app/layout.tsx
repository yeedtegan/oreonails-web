import type { Metadata } from "next";
import { Pacifico, Poppins } from "next/font/google";
import "./globals.css";

/** the whole site: Poppins (light italic for display headings) */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

/** handwritten highlight word in headings */
const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Oreo Nails — Custom Nail Design",
  description:
    "Upload a photo of your hand, describe your dream nails and let Oreo Nails generate a custom nail design.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${pacifico.variable} h-full antialiased`}>
      <body className="relative min-h-full font-body text-[15px] leading-normal">{children}</body>
    </html>
  );
}
