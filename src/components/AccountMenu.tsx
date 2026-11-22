"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import GoogleSignInButton from "./GoogleSignInButton";
import { UserIcon } from "./icons";

/** Account button in the header: signed out → Google sign-in; signed in → name, email, sign out. */
export default function AccountMenu() {
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
        className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/80 text-cocoa shadow-md ring-1 ring-gold/20 transition hover:bg-white lg:h-12 lg:w-12"
      >
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google avatar URL
          <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <UserIcon className="h-6 w-6" />
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Account" className="glass-card absolute top-full right-0 z-40 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-2xl p-4">
          {loading ? (
            <p className="text-center text-sm text-cocoa-soft">Loading…</p>
          ) : user ? (
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-cocoa">{user.name}</p>
                <p className="truncate text-sm text-cocoa-soft">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  setOpen(false);
                }}
                className="rounded-full border border-gold/40 px-4 py-2 font-serif text-cocoa transition hover:bg-white/70"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="font-serif text-lg text-cocoa">Sign in to Oreo Nails</p>
              <p className="text-sm text-cocoa-soft">Save your orders and check out securely.</p>
              <GoogleSignInButton width={240} onSignedIn={() => setOpen(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
