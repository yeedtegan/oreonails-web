"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { useProductSearch, useProductsByHandle } from "@/lib/hooks";
import { ProductGrid } from "@/components/ProductCard";
import CollectionView from "@/components/CollectionView";
import { SearchIcon } from "@/components/Icons";

function Favorites() {
  const { favorites, hydrated } = useStore();
  const { products, loading } = useProductsByHandle(hydrated ? favorites : []);
  return (
    <div className="container-x pt-14 pb-16">
      <h1 className="text-center font-display text-[32px] font-medium">Your Favorites</h1>
      <p className="mt-2 text-center text-[15px] text-muted">Tap the heart on any set to save it here.</p>
      <div className="mx-auto mt-10 max-w-[1185px]">
        {!hydrated || (loading && products.length === 0) ? null : products.length === 0 ? (
          <p className="py-12 text-center text-muted">No favorites yet.</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}

/** Search: centred grey pill input, "Results for" heading, then the same filter bar + grid as collections. */
function SearchResults({ q }: { q: string }) {
  const router = useRouter();
  const [input, setInput] = useState(q);
  const { results, total, loading } = useProductSearch(q, 200, 0);
  return (
    <div className="pt-[70px] pb-16">
      <form
        className="mx-auto flex h-11 max-w-[600px] items-center gap-4 rounded-full bg-[#f4f1f3] px-6 mx-3 md:mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/search?q=${encodeURIComponent(input)}`);
        }}
      >
        <SearchIcon width={22} height={22} />
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search" aria-label="Search" className="w-full bg-transparent text-[17px] outline-none" />
      </form>
      {q && <h1 className="mt-14 text-center font-display text-[28px] font-medium">Results for &quot;{q}&quot;</h1>}
      <div className="mx-auto mt-20 max-w-[1185px] px-3 md:px-0">
        {q && !loading && total === 0 && <p className="py-12 text-center text-muted">No products found. Try another search.</p>}
        {q && results.length > 0 && <CollectionView key={q} products={results} />}
      </div>
    </div>
  );
}

function SearchInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  return params.get("view") === "favorites" ? <Favorites /> : <SearchResults key={q} q={q} />;
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
