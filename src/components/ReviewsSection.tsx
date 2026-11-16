"use client";

import { useCallback, useState } from "react";
import type { Pattern, Review, ReviewSummary } from "@/lib/data";
import { apiFetch } from "@/lib/api-client";
import { isDb } from "@/lib/backend";
import NailArt from "./NailArt";
import { Stars } from "./Icons";

interface ReviewsData {
  summary: ReviewSummary;
  reviews: Review[];
}

type Art = { palette: [string, string, string, string]; pattern: Pattern };

/**
 * Reviews header + masonry of review cards (photo, name + Verified, stars, text) + write form,
 * laid out like the reference widget. `initial` is rendered on the server; new submissions refetch.
 * `art` maps product handle → artwork used as the card photo (stand-in for customer photos).
 */
export default function ReviewsSection({
  productHandle,
  initial,
  productOptions,
  title = "Customer Reviews",
  art = {},
}: {
  productHandle?: string;
  initial: ReviewsData;
  productOptions?: { handle: string; title: string }[];
  title?: string;
  art?: Record<string, Art>;
}) {
  const [data, setData] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(12);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (productHandle) q.set("product", productHandle);
    try {
      setData(await apiFetch<ReviewsData>(`/reviews?${q}`));
    } finally {
      setLoading(false);
    }
  }, [productHandle]);

  const { summary, reviews } = data;
  const shapes = ["Almond", "Coffin", "Oval", "Stiletto", "Square"];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h2 className="font-display text-[20px] font-medium tracking-[0.5px]">{title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-black">
            <Stars rating={summary.average} size={15} className="text-black" />
            <span>{summary.count ? summary.average.toFixed(1) : "—"}</span>
            <span>({summary.count.toLocaleString()} reviews)</span>
            <span className="flex items-center gap-1 rounded-full bg-[#8ee6dc] px-2 py-[3px] text-[12.5px] text-plum">
              <span className="grid h-3.5 w-3.5 place-items-center rounded-[3px] bg-plum text-[9px] leading-none text-white">✓</span>Verified
            </span>
          </div>
        </div>
        <button className="h-10 w-full rounded-full bg-plum px-[18px] md:ml-auto md:w-auto text-[14.5px] font-medium text-white" onClick={() => setFormOpen((o) => !o)}>
          {formOpen ? "Cancel" : "Write a review"}
        </button>
      </div>

      {formOpen && (
        <ReviewForm
          productHandle={productHandle}
          productOptions={productOptions}
          onSubmitted={() => {
            setFormOpen(false);
            setThanks(true);
            load();
          }}
        />
      )}
      {thanks && !formOpen && (
        <p className="mt-6 rounded-2xl bg-card px-5 py-4 text-[14.5px]">{isDb ? "Thank you! Your review has been posted." : "Thank you! Your review will appear here once our team has approved it."}</p>
      )}

      {reviews.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-muted">No reviews yet — be the first!</p>
      ) : (
        <div className={`mt-6 columns-2 gap-4 transition-opacity md:columns-3 xl:columns-4 ${loading ? "opacity-50" : ""}`}>
          {reviews.slice(0, shown).map((r, i) => {
            const a = r.product ? art[r.product] : undefined;
            return (
              <article key={r.id} className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-[#e6e6e6] bg-white text-black">
                {a && i % 3 !== 2 && <NailArt palette={a.palette} pattern={a.pattern} shape={shapes[i % shapes.length]} className="aspect-square w-full" />}
                <div className="px-3.5 pt-3 pb-4">
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[13px]">
                    {r.name}
                    <span className="flex items-center gap-1 text-[12px] text-[#5b6b62]">
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#1f9d6b] text-[8px] leading-none text-white">✓</span>Verified
                    </span>
                  </p>
                  <Stars rating={r.rating} size={17} className="mt-1.5 text-black" />
                  {r.title && r.title !== "Review" && <p className="mt-1.5 text-[13px] font-bold">{r.title}</p>}
                  <p className="mt-1 text-[13px] leading-[1.5]">{r.body}</p>
                  {(r.variant || (!productHandle && r.productTitle)) && (
                    <p className="mt-2 text-[11.5px] text-[#777]">
                      {!productHandle && r.productTitle && <>{r.productTitle} · </>}
                      {r.variant}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {reviews.length > shown && (
        <div className="mt-4 text-center">
          <button onClick={() => setShown((n) => n + 12)} className="h-10 rounded-full border border-plum px-5 text-[14px] font-medium">Load more reviews</button>
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  productHandle,
  productOptions = [],
  onSubmitted,
}: {
  productHandle?: string;
  productOptions?: { handle: string; title: string }[];
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [product, setProduct] = useState(productHandle ?? "");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <form
      className="mt-6 grid gap-4 rounded-3xl border border-line bg-white p-6 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || !body.trim()) return setErr("Name and review are required.");
        setSending(true);
        try {
          await apiFetch("/reviews", { body: { name: name.trim(), rating, title: title.trim() || undefined, body: body.trim(), product: product || undefined } });
          onSubmitted();
        } catch (e) {
          setErr((e as Error).message);
        } finally {
          setSending(false);
        }
      }}
    >
      <div className="sm:col-span-2">
        <p className="label">Rating</p>
        <div className="flex gap-1 text-3xl text-amber-500">
          {[1, 2, 3, 4, 5].map((i) => (
            <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`}>
              {i <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>
      <label>
        <span className="label">Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {productHandle ? (
        <label>
          <span className="label">Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      ) : (
        <>
          <label>
            <span className="label">Which set?</span>
            <select className="input" value={product} onChange={(e) => setProduct(e.target.value)}>
              <option value="">Oreo Nails overall</option>
              {productOptions.map((p) => (
                <option key={p.handle} value={p.handle}>{p.title}</option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="label">Title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </>
      )}
      <label className="sm:col-span-2">
        <span className="label">Review</span>
        <textarea className="input min-h-28" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell us about fit, wear time, packaging…" />
      </label>
      {err && <p className="text-sm text-rose sm:col-span-2">{err}</p>}
      <button disabled={sending} className="btn-dark sm:col-span-2 sm:justify-self-start">{sending ? "Submitting…" : "Submit review"}</button>
    </form>
  );
}
