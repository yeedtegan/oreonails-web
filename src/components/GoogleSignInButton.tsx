"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

/** Google Identity Services ("Sign in with Google") — only the bits we use. */
type GsiButtonOptions = { theme?: string; size?: string; shape?: string; text?: string; width?: number; logo_alignment?: string };
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string; auto_select?: boolean }) => void;
          renderButton: (el: HTMLElement, o: GsiButtonOptions) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiLoad: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  gsiLoad ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiLoad = null;
      reject(new Error("Could not load Google sign-in."));
    };
    document.head.appendChild(s);
  });
  return gsiLoad;
}

/** Renders Google's official button; on success the session cookie is set and `onSignedIn` runs. */
export default function GoogleSignInButton({ onSignedIn, width = 280 }: { onSignedIn?: () => void; width?: number }) {
  const { signInWithGoogle } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const cb = useRef({ signInWithGoogle, onSignedIn });
  useEffect(() => {
    cb.current = { signInWithGoogle, onSignedIn };
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            setBusy(true);
            setError("");
            try {
              await cb.current.signInWithGoogle(credential);
              cb.current.onSignedIn?.();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Google sign-in failed.");
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width });
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [width]);

  if (!CLIENT_ID) {
    return <p className="text-sm text-wine">Google sign-in is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID).</p>;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} aria-busy={busy} className={busy ? "pointer-events-none opacity-60" : undefined} />
      {busy && <p className="text-sm text-cocoa-soft">Signing you in…</p>}
      {error && <p className="text-sm text-wine">{error}</p>}
    </div>
  );
}
