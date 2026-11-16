"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api-client";
import type { Product } from "./data";

/** Debounced product search against GET /api/products?q=. */
export function useProductSearch(q: string, limit = 24, delay = 200) {
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setTotal(0);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      apiFetch<{ total: number; products: Product[] }>(`/products?q=${encodeURIComponent(term)}&limit=${limit}`, { signal: ctrl.signal })
        .then((r) => {
          setResults(r.products);
          setTotal(r.total);
        })
        .catch(() => {})
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    }, delay);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, limit, delay]);

  return { results, total, loading };
}

/** Fetch specific products by handle (e.g. favorites), preserving the given order. */
export function useProductsByHandle(handles: string[]) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const key = handles.join(",");

  useEffect(() => {
    if (!key) {
      setProducts([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    apiFetch<{ products: Product[] }>(`/products?handles=${encodeURIComponent(key)}&limit=200`, { signal: ctrl.signal })
      .then((r) => {
        const byHandle = new Map(r.products.map((p) => [p.handle, p]));
        setProducts(key.split(",").map((h) => byHandle.get(h)).filter((p): p is Product => !!p));
      })
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [key]);

  return { products, loading };
}
