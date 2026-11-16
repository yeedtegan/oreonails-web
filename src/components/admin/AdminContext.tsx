"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";

const KEY = "oreonails-admin-token";

type Status = "loading" | "signed-out" | "ok";
interface Toast {
  id: number;
  text: string;
  kind: "ok" | "error";
}

function useAdminValue() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  /** Checks a token against the API. Throws with a readable message when it is rejected. */
  const verify = useCallback(async (t: string) => {
    try {
      await apiFetch("/admin/stats", { token: t });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw new Error("Admin is disabled. Set ADMIN_TOKEN in server/.env and restart the API.");
      if (e instanceof ApiError && e.status === 401) throw new Error("That admin token is not correct.");
      throw e;
    }
  }, []);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (!saved) return setStatus("signed-out");
    verify(saved)
      .then(() => {
        setToken(saved);
        setStatus("ok");
      })
      .catch(() => setStatus("signed-out"));
  }, [verify]);

  const login = useCallback(
    async (t: string) => {
      await verify(t);
      try {
        localStorage.setItem(KEY, t);
      } catch {}
      setToken(t);
      setStatus("ok");
    },
    [verify],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setToken(null);
    setStatus("signed-out");
  }, []);

  /** Calls /api/admin/*; signs out automatically when the token stops working. */
  const call = useCallback(
    async <T,>(path: string, opts: { method?: string; body?: unknown } = {}) => {
      try {
        return await apiFetch<T>(`/admin${path}`, { ...opts, token });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) logout();
        throw e;
      }
    },
    [token, logout],
  );

  const upload = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Upload failed (${res.status})`);
      return data.url as string;
    },
    [token],
  );

  return { token, status, login, logout, call, upload, notify, toasts };
}

type Admin = ReturnType<typeof useAdminValue>;
const Ctx = createContext<Admin | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={useAdminValue()}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin must be used inside AdminProvider");
  return c;
}

/** Loads data from the admin API, with a `reload` to refresh after edits. */
export function useAdminData<T>(path: string | null) {
  const { call, status } = useAdmin();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!path || status !== "ok") return;
    setLoading(true);
    try {
      setData(await call<T>(path));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path, call, status]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}
