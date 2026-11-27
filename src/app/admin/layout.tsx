import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Quản lý shop — Oreo Nails",
  robots: { index: false, follow: false },
};

/** /admin/* — shop management for accounts with role "admin" (checked by oreonails-api on every call) */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
