"use client";

import { useEffect } from "react";

/** Shown when a page fails to render — most often because the API server is unreachable. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x py-24 text-center">
      <h1 className="h-display text-4xl">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">We couldn&apos;t load this page right now. Please try again in a moment.</p>
      <button onClick={reset} className="btn-dark mt-8">Try again</button>
    </div>
  );
}
