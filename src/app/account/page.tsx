import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SHOPIFY_ACCOUNT_URL } from "@/lib/shopify/config";
import { PageHero } from "@/components/ui";
import { isDb } from "@/lib/backend";
import AccountView from "@/components/db/AccountView";

export const metadata: Metadata = { title: "Account" };

/**
 * "db": email + password accounts on the Oreo Nails API, with order history.
 * "shopify": Shopify customer accounts (sign in with a one-time email code).
 */
export default function AccountPage() {
  if (isDb) return <AccountView />;
  if (SHOPIFY_ACCOUNT_URL) redirect(SHOPIFY_ACCOUNT_URL);
  return <PageHero title="Account" intro="Customer accounts are not available right now. Please try again later." />;
}
