import type { Metadata } from "next";
import { api } from "@/lib/api-server";
import BundleBuilder from "@/components/BundleBuilder";

export const metadata: Metadata = { title: "Build a Bundle" };

export default async function BuildBundlePage() {
  const [sets, tools, site, collections] = await Promise.all([
    api.products({ type: "set", sort: "featured", limit: 200 }),
    api.products({ type: "tool", limit: 50 }),
    api.site(),
    api.collections(),
  ]);
  return <BundleBuilder sets={[...sets, ...tools]} site={site} collections={collections} />;
}
