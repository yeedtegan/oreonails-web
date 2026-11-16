"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useProductSearch } from "@/lib/hooks";
import { money } from "@/lib/pricing";
import { useStore } from "@/context/StoreContext";
import { CloseIcon, SearchIcon } from "./Icons";
import { ProductArt } from "@/components/Art";

const SUGGESTIONS = ["french", "holiday", "leopard", "star", "bundle", "glue"];

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useStore();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { results, loading } = useProductSearch(q, 6);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;
  const close = () => setSearchOpen(false);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-cream shadow-xl animate-fadein">
        <div className="container-x py-6">
          <form
            className="flex items-center gap-3 border-b-2 border-ink pb-3"
            onSubmit={(e) => {
              e.preventDefault();
              close();
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <SearchIcon />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search press-on nails…" className="flex-1 bg-transparent text-lg outline-none" />
            <button type="button" onClick={close} aria-label="Close search">
              <CloseIcon />
            </button>
          </form>
          {!q && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Popular:</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="rounded-full border border-line px-3 py-1 hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          )}
          {q && (
            <div className="mt-5">
              {results.length === 0 ? (loading ? <p className="text-sm text-muted">Searching…</p> :
                <p className="text-sm text-muted">No results for “{q}”.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {results.map((p) => (
                    <Link key={p.handle} href={`/products/${p.handle}`} onClick={close} className="text-sm">
                      <ProductArt product={p} shape={p.shape} className="mb-2 aspect-square w-full rounded-xl" />
                      <p className="font-semibold">{p.title}</p>
                      <p className="text-muted">{money(p.price)}</p>
                    </Link>
                  ))}
                </div>
              )}
              <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={close} className="mt-4 inline-block text-sm font-semibold underline">
                See all results
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
