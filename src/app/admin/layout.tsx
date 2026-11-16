import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { isDb } from "@/lib/backend";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // With the Shopify backend the store is managed in Shopify admin.
  if (!isDb) notFound();
  return <AdminShell>{children}</AdminShell>;
}
