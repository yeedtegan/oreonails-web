import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // let phones on the LAN load dev assets (otherwise the page never hydrates)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  // Cache Components / partial prefetching are off: the app doesn't use them (every page is client-driven)
  // and they hang on the Cloudflare Workers runtime (OpenNext) — Next warns about Workers' setTimeout().
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// `next dev` gets the Cloudflare bindings from wrangler.jsonc (production runs on Workers via OpenNext)
initOpenNextCloudflareForDev();
