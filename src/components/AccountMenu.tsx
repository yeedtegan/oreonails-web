"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import GoogleSignInButton from "./GoogleSignInButton";
import { UserIcon } from "./icons";

/** Account button in the header: signed out → Google sign-in; signed in → name, email, sign out. */
export default function AccountMenu({ className = "" }: { className?: string }) {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={user ? `Account: ${user.name}` : "Sign in"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${className} overflow-hidden`}
      >
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google avatar URL
          <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <UserIcon className="h-[22px] w-[22px]" />
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Account" className="glass-card absolute top-full right-0 z-40 mt-2 rounded-[18px] w-[min(19rem,calc(100vw-2rem))] p-4">
          {loading ? (
            <p className="text-center text-sm text-cocoa-soft">Loading…</p>
          ) : user ? (
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-cocoa">{user.name}</p>
                <p className="truncate text-sm text-cocoa-soft">{user.email}</p>
              </div>
              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)} className="btn-brown btn-label rounded-full px-4 py-2 text-center text-[15px] text-white">
                  Shop admin
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  setOpen(false);
                }}
                className="btn-label rounded-full border border-gold/40 px-4 py-2 text-[15px] text-cocoa transition hover:bg-white/70"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-lg font-medium text-cocoa">Sign in to Oreo Nails</p>
              <p className="text-sm text-cocoa-soft">Save your orders and check out securely.</p>
              <GoogleSignInButton width={240} onSignedIn={() => setOpen(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
