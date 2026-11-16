"use client";

import { usePathname } from "next/navigation";

/** Renders storefront-only UI (header, footer, drawers, popups) everywhere except checkout and /admin, which have their own frame. */
export default function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (/^\/(admin|checkout)(\/|$)/.test(pathname)) return null;
  return <>{children}</>;
}
