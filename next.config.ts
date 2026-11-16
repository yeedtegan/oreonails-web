import type { NextConfig } from "next";

const isDb = process.env.NEXT_PUBLIC_DATA_SOURCE !== "shopify";
const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Lets a second dev/build run use its own folder without clobbering the main .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  images: {
    // Shopify backend: product, collection and article images come from Shopify's CDN.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
  async rewrites() {
    if (!isDb) return [];
    // "db" backend: the browser calls same-origin /api/* and /uploads/*, proxied to the Oreo Nails API.
    // beforeFiles so these win over the Shopify route handlers in src/app/api.
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
        { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
