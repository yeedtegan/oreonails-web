"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "../AuthContext";
import GoogleSignInButton from "../GoogleSignInButton";
import { Logo } from "../Header";
import { BagIcon, GiftIcon, NoteIcon } from "../icons";
import { AdminError, adminFetch } from "./api";

const NAV = [
  { href: "/admin/products", label: "Sản phẩm", icon: BagIcon },
  { href: "/admin/pricing", label: "Giá & khuyến mãi", icon: GiftIcon },
  { href: "/admin/orders", label: "Đơn hàng", icon: NoteIcon },
];

type Access = "checking" | "ok" | "forbidden" | "error";

/** /admin: Google sign-in → the account must have role "admin" (checked by oreonails-api) → menu + page. */
function Gate({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  // the answer for one account (signing in as someone else checks again)
  const [checked, setChecked] = useState<{ userId: string; access: Access; error: string } | null>(null);
  const access: Access = user && checked?.userId === user.id ? checked.access : "checking";
  const error = checked?.error ?? "";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    adminFetch<{ user: unknown }>("me")
      .then(() => !cancelled && setChecked({ userId: user.id, access: "ok", error: "" }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const forbidden = err instanceof AdminError && (err.status === 403 || err.status === 401);
        setChecked({ userId: user.id, access: forbidden ? "forbidden" : "error", error: err instanceof Error ? err.message : "Lỗi" });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const card = "mx-auto mt-[12vh] flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-line bg-ivory p-8 text-center soft-shadow";

  if (loading || (user && access === "checking")) {
    return (
      <div className={card} role="status">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-brown" />
        Đang kiểm tra quyền truy cập…
      </div>
    );
  }
  if (!user) {
    return (
      <div className={card}>
        <Logo />
        <h1 className="text-[22px] font-semibold">Quản lý shop</h1>
        <p className="text-cocoa-soft">Đăng nhập bằng tài khoản Google có quyền admin.</p>
        <GoogleSignInButton width={280} />
      </div>
    );
  }
  if (access !== "ok") {
    return (
      <div className={card}>
        <Logo />
        <h1 className="text-[20px] font-semibold">{access === "forbidden" ? "Không có quyền truy cập" : "Không kết nối được"}</h1>
        <p className="text-cocoa-soft">
          {access === "forbidden" ? (
            <>
              Tài khoản <b>{user.email}</b> chưa có quyền admin.
            </>
          ) : (
            error
          )}
        </p>
        <div className="flex gap-2">
          <Link href="/" className="rounded-full border border-line bg-white px-5 py-2.5">
            Về trang chủ
          </Link>
          <button type="button" onClick={signOut} className="btn-brown rounded-full px-5 py-2.5 text-white">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen tab:grid tab:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-ivory px-4 py-3 tab:sticky tab:top-0 tab:h-screen tab:border-r tab:border-b-0 tab:px-5 tab:py-6">
        <div className="flex items-center justify-between gap-3 tab:block">
          <Logo size="sm" />
          <p className="text-[12px] font-medium tracking-[0.2em] text-cocoa-soft uppercase tab:mt-2">Admin</p>
        </div>
        <nav className="mt-3 flex gap-1.5 overflow-x-auto tab:mt-8 tab:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => {
            const on = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[15px] whitespace-nowrap transition ${on ? "bg-brown text-white" : "hover:bg-pink-2"}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 hidden border-t border-line pt-4 text-[13px] text-cocoa-soft tab:block">
          <p className="truncate" title={user.email}>
            {user.email}
          </p>
          <div className="mt-2 flex gap-3">
            <Link href="/shop" className="underline">
              Xem shop
            </Link>
            <button type="button" onClick={signOut} className="underline">
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 tab:px-8 tab:py-7">{children}</main>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
