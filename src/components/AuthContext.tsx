"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type User = { id: string; email: string; name: string; picture: string | null };

type Auth = {
  user: User | null;
  /** true until the first /api/auth/me answer */
  loading: boolean;
  /** exchange the Google ID token for our session cookie */
  signInWithGoogle: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user?: User | null }) => !cancelled && setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const data = (await res.json().catch(() => ({}))) as { user?: User; error?: string };
    if (!res.ok || !data.user) throw new Error(data.error ?? "Google sign-in failed. Please try again.");
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.google?.accounts.id.disableAutoSelect();
    setUser(null);
  }, []);

  const value = useMemo<Auth>(() => ({ user, loading, signInWithGoogle, signOut }), [user, loading, signInWithGoogle, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
