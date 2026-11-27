"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { META_PIXEL_IDS, track } from "@/lib/metaPixel";

/**
 * Meta Pixel base code (loaded once for the whole site). The base code sends the first PageView;
 * moving to another page inside the app (client navigation) sends one more PageView per page.
 * Several pixel ids → each is initialised; every event then goes to all of them.
 * Renders nothing when NEXT_PUBLIC_META_PIXEL_ID is not set.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false; // the base code already counted the landing page
      return;
    }
    track("PageView");
  }, [pathname]);

  if (!META_PIXEL_IDS.length) return null;
  const init = META_PIXEL_IDS.map((id) => `fbq('init',${JSON.stringify(id)});`).join("");

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');${init}fbq('track','PageView');`}
      </Script>
      <noscript>
        {META_PIXEL_IDS.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element -- Meta's no-JavaScript fallback pixel
          <img key={id} height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`} />
        ))}
      </noscript>
    </>
  );
}
