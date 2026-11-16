"use client";

import Link from "next/link";
import { useState } from "react";
import { SHAPES, SITE, SIZE_CHART } from "@/lib/data";
import { apiFetch } from "@/lib/api-client";
import { useStore } from "@/context/StoreContext";
import { CheckList, InfoBody, InfoCard, InfoHero, InfoTable, Pill, Steps } from "@/components/info";
import { CheckIcon, HandIcon, MailIcon, QuestionIcon, RulerIcon, SparkleIcon } from "@/components/Icons";

const FINGERS = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
const LENGTHS: (string | number)[][] = [
  ["Square", "14–17", "19–22", "24–27", "30+"],
  ["Oval", "15–18", "20–23", "25–28", "32+"],
  ["Almond", "16–19", "21–24", "26–29", "33+"],
  ["Coffin", "17–20", "22–25", "28–32", "35–45"],
  ["Stiletto", "18–21", "23–27", "30–35", "40–45"],
];

/** Smallest standard size where every nail is at least as wide as the measurement. */
function recommend(mm: number[], sizeUp: boolean) {
  const idx = SIZE_CHART.findIndex((row) => row.mm.every((w, i) => w >= mm[i]));
  if (idx === -1) return "Custom";
  const i = Math.min(SIZE_CHART.length - 1, idx + (sizeUp ? 1 : 0));
  return sizeUp && idx === SIZE_CHART.length - 1 ? "Custom" : SIZE_CHART[i].size;
}

function TapeArt() {
  return (
    <svg viewBox="0 0 320 250" className="h-full w-full">
      <rect width="320" height="250" fill="#f3ebf2" />
      <path d="M70 250V70a45 45 0 0 1 90 0v180" fill="none" stroke="#b7b2b6" strokeWidth="7" />
      <rect x="0" y="100" width="320" height="52" fill="#c8c6c8" />
      {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={20 + i * 10} y="104" width="2.5" height={i % 5 ? 14 : 24} fill="#3a3a3a" />)}
      <circle cx="225" cy="200" r="70" fill="#c8c6c8" />
      <ellipse cx="225" cy="200" rx="30" ry="16" fill="#f3ebf2" />
      <circle cx="70" cy="145" r="3.5" fill="#3a3a3a" />
    </svg>
  );
}
function StripArt({ pen }: { pen?: boolean }) {
  return (
    <svg viewBox="0 0 150 190" className="h-full w-full">
      <rect width="150" height="190" fill="#f3ebf2" />
      <path d="M38 190V60a37 37 0 0 1 74 0v130" fill="none" stroke="#b7b2b6" strokeWidth="5" />
      <rect x="0" y="70" width="150" height="38" fill="#dcdcdc" opacity=".9" />
      {pen ? (
        <>
          <rect x="45" y="72" width="5" height="34" fill="#111" />
          <rect x="100" y="72" width="5" height="34" fill="#111" />
          <path d="M120 100 150 10l10 4-30 90z" fill="#111" />
        </>
      ) : (
        <>
          <circle cx="47" cy="94" r="4" fill="#111" />
          <circle cx="104" cy="94" r="4" fill="#111" />
          <path d="M51 94q27 -8 50 0" stroke="#111" strokeDasharray="3 3" fill="none" />
        </>
      )}
    </svg>
  );
}

export default function SizingGuidePage() {
  const { subscribe, setCode } = useStore();
  const [unit, setUnit] = useState<"mm" | "in">("mm");
  const [left, setLeft] = useState(["", "", "", "", ""]);
  const [right, setRight] = useState(["", "", "", "", ""]);
  const [sizeUp, setSizeUp] = useState(false);
  const [result, setResult] = useState<{ left: string; right: string; pick: string } | null>(null);
  const [err, setErr] = useState("");
  const [shape, setShape] = useState("Almond");
  const [length, setLength] = useState("Short");
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState("");

  const toMm = (v: string) => (unit === "in" ? Number(v) * 25.4 : Number(v));
  const calc = () => {
    const hands = [left, right].filter((h) => h.some((v) => v !== ""));
    if (!hands.length || hands.some((h) => h.some((v) => !v || !(Number(v) > 0)))) return setErr("Enter all five nails for at least one hand.");
    setErr("");
    const l = left.every((v) => Number(v) > 0) ? recommend(left.map(toMm), sizeUp) : "—";
    const r = right.every((v) => Number(v) > 0) ? recommend(right.map(toMm), sizeUp) : "—";
    const order = ["XS", "S", "M", "L", "Custom"];
    const pick = [l, r].filter((x) => x !== "—").sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
    setResult({ left: l, right: r, pick });
  };

  const handInput = (vals: string[], set: (v: string[]) => void, i: number) => (
    <span className="flex items-center gap-1.5">
      <input
        inputMode="decimal"
        value={vals[i]}
        onChange={(e) => set(vals.map((v, j) => (j === i ? e.target.value.replace(/[^\d.]/g, "") : v)))}
        className="h-11 w-[74px] rounded-xl border border-[#d9d3d8] text-center text-[16px] outline-none focus:border-plum"
        aria-label={`${FINGERS[i]} ${unit}`}
      />
      <span className="font-work text-[10px] uppercase text-muted">{unit}</span>
    </span>
  );

  const chip = (v: string, cur: string, set: (s: string) => void) => (
    <button key={v} type="button" onClick={() => set(v)} className={`h-10 rounded-full px-4 text-[15px] transition ${cur === v ? "bg-plum text-white" : "bg-[#f3ebf2] hover:bg-pink"}`}>{v}</button>
  );

  return (
    <>
      <InfoHero
        eyebrow="Sizing"
        title="Sizing Guide"
        intro="Measure each nail, check the chart, then let the calculator pick your size."
        actions={
          <>
            <Pill href="#find" kind="white">Find your size</Pill>
            <Pill href="#chart" kind="ghost">Size chart</Pill>
          </>
        }
      />
      <InfoBody width={892}>
        <InfoCard>
          <p>Every {SITE.name} set is hand-painted to order, so a good fit starts with your own measurements. Measure once, write the ten numbers down, and they will serve you for every set you buy from us.</p>
        </InfoCard>

        <InfoCard id="chart" icon={<RulerIcon width={18} height={18} />} title="Size chart">
          <p className="mb-4">The width of your nail bed at its widest point, in millimetres.</p>
          <InfoTable head={["Size", ...FINGERS]} rows={SIZE_CHART.map((r) => [r.size, ...r.mm])} />
          <CheckList
            items={[
              <>Pick the size that fits <b>most</b> of your fingers. Almost nobody matches one size on all ten nails, and that is normal.</>,
              <>Between two sizes, or flatter nail beds? <b>Size up.</b> A slightly wide tip still sits flush; a narrow one lifts at the sides.</>,
              <>Short almond tips run a touch small against the other shapes — size up for those.</>,
              <>Measure your own nails, not over acrylics or gel.</>,
            ]}
          />
        </InfoCard>

        <InfoCard icon={<HandIcon width={18} height={18} />} title="How to measure">
          <p className="mb-4">Either method works. Measure every finger — the two hands are rarely identical.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <span className="inline-block rounded-full bg-[#f3ebf2] px-2.5 py-1 font-work text-[10.5px] font-semibold uppercase tracking-[1.4px]">Method 1 · Recommended</span>
              <p className="mt-2 text-[16px] font-bold">Flexible measuring tape</p>
              <div className="mt-3 overflow-hidden rounded-lg"><TapeArt /></div>
              <Steps items={[<>Lay the tape flat across your nail bed at its <b>widest</b> point, following the natural curve.</>, "Read the millimetre mark and write it down. Repeat for all ten nails."]} />
            </div>
            <div className="rounded-xl border border-line p-4">
              <span className="inline-block rounded-full bg-[#f3ebf2] px-2.5 py-1 font-work text-[10.5px] font-semibold uppercase tracking-[1.4px]">Method 2</span>
              <p className="mt-2 text-[16px] font-bold">Paper strip and ruler</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-lg"><StripArt /></div>
                <div className="overflow-hidden rounded-lg"><StripArt pen /></div>
              </div>
              <Steps items={["Lay a strip of paper or sticky tape across the widest part of your nail.", "Mark a dot at each edge of the nail bed with a pen.", "Peel the strip off and lay it flat against a ruler.", "Measure the gap between the two dots. That is your width."]} />
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={<SparkleIcon width={18} height={18} />} title="Shape & length">
          <p className="mb-4">Size is the width across your nail bed. Length is how far the tip extends past it — a separate choice.</p>
          <div className="mb-4 grid grid-cols-5 gap-2">
            {SHAPES.map((s) => (
              <div key={s} className="flex flex-col items-center rounded-xl border border-line py-2.5">
                <svg viewBox="0 0 40 60" className="h-[72px] w-[48px]">
                  <path
                    d={{ Square: "M6 6h28v42a14 14 0 0 1-28 0Z", Oval: "M6 18a14 14 0 0 1 28 0v30a14 14 0 0 1-28 0Z", Almond: "M6 24Q8 4 20 2q12 2 14 22v24a14 14 0 0 1-28 0Z", Coffin: "M10 4h20l4 44a14 14 0 0 1-28 0Z", Stiletto: "M6 30Q10 10 20 1q10 9 14 29v18a14 14 0 0 1-28 0Z" }[s]}
                    fill="#f6c9b5"
                  />
                  <path d="M11 14q-2 16 0 30" stroke="#fff" strokeWidth="3" opacity=".6" fill="none" />
                </svg>
                <span className="mt-1 font-work text-[10px] font-semibold uppercase tracking-[1.2px]">{s}</span>
              </div>
            ))}
          </div>
          <InfoTable head={["Shape", "Short", "Medium", "Long", "Extra long"]} rows={LENGTHS} note="Tip length in millimetres, measured from the base of the nail. Not every design is made in every shape or length." />
        </InfoCard>

        <InfoCard id="find" icon={<CheckIcon width={18} height={18} />} title="Find your size">
          <p>Measure the widest point of each nail bed, then enter all ten below. We size every finger separately, so the result is closer than a single guess.</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-line pb-3 md:gap-x-[90px]">
            <div className="flex gap-1">
              {(["mm", "in"] as const).map((u) => (
                <button key={u} onClick={() => setUnit(u)} className={`h-[26px] rounded-full px-3 font-work text-[11px] font-bold uppercase ${unit === u ? "bg-plum text-white" : "text-muted"}`}>{u}</button>
              ))}
            </div>
            <span className="font-work text-[11px] font-bold uppercase tracking-[1.4px]">Left hand</span>
            <span className="font-work text-[11px] font-bold uppercase tracking-[1.4px]">Right hand</span>
          </div>
          {FINGERS.map((f, i) => (
            <div key={f} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-line py-3 md:gap-x-[90px]">
              <span className="font-work text-[12px] font-bold uppercase tracking-[1.3px]">{f}</span>
              {handInput(left, setLeft, i)}
              {handInput(right, setRight, i)}
            </div>
          ))}
          <label className="mt-4 flex items-center gap-2 text-[14.5px]">
            <input type="checkbox" checked={sizeUp} onChange={(e) => setSizeUp(e.target.checked)} className="h-4 w-4 accent-plum" />
            Short almond tips or flatter nail beds
          </label>
          <button onClick={calc} className="mt-6 h-[50px] w-full rounded-full bg-plum text-[15px] font-bold text-white transition hover:bg-plum-light">Find my size</button>
          {err && <p className="mt-3 text-[14px] text-[#b0263c]">{err}</p>}
          {result && (
            <div className="animate-fadein mt-5 rounded-xl bg-[#f3ebf2] p-5 text-center">
              <p className="text-[14px] text-muted">Your recommended size</p>
              <p className="font-playfair-display text-[44px] leading-tight">{result.pick}</p>
              <p className="text-[14px]">Left hand: <b>{result.left}</b> · Right hand: <b>{result.right}</b></p>
              <p className="mt-2 text-[14px]">
                {result.pick === "Custom" ? "Your nails fall outside our standard sizes — choose Custom on any product and enter these measurements." : <>Choose <b>{result.pick}</b> on any set.</>}
              </p>
              <div className="mt-4"><Pill href="/collections/best-sellers">Shop best sellers</Pill></div>
            </div>
          )}
        </InfoCard>

        <InfoCard title="Your perfect set, picked for you">
          <p className="-mt-2">Tell us your style. We will send sets in your shape and your 10% off code.</p>
          <p className="mt-4 mb-2 font-work text-[11px] font-bold uppercase tracking-[1.4px]">Shape</p>
          <div className="flex flex-wrap gap-2">{SHAPES.map((s) => chip(s, shape, setShape))}</div>
          <p className="mt-4 mb-2 font-work text-[11px] font-bold uppercase tracking-[1.4px]">Length</p>
          <div className="flex flex-wrap gap-2">{["Short", "Medium", "Long"].map((s) => chip(s, length, setLength))}</div>
          {picked ? (
            <p className="mt-5 rounded-xl bg-[#f3ebf2] p-4 text-[15px]">Thanks! Your code <b>{picked}</b> is applied to your cart. <Link href={`/collections/shop-all`} className="font-bold underline">Shop {shape.toLowerCase()} sets</Link></p>
          ) : (
            <form
              className="mt-5 space-y-2.5"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const r = await apiFetch<{ code: string | null }>("/newsletter", { body: { email } });
                  const code = r.code ?? SITE.welcomeCode;
                  subscribe();
                  setCode(code);
                  setPicked(code);
                } catch (e) {
                  setErr((e as Error).message);
                }
              }}
            >
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="h-12 w-full rounded-xl border border-[#d9d3d8] px-4 text-[16px] outline-none focus:border-plum" />
              <button className="h-12 w-full rounded-full bg-plum text-[15px] font-bold text-white transition hover:bg-plum-light">Get my picks</button>
              <p className="text-center text-[12px] text-muted">By signing up, you agree to our <Link href="/pages/privacy-policy" className="underline">Privacy Policy</Link>.</p>
            </form>
          )}
        </InfoCard>

        <div className="mx-auto mt-12 grid w-full max-w-[828px] items-center gap-5 rounded-2xl bg-white p-8 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="font-display text-[22px] font-medium">Still not sure about your size?</h3>
            <p className="mt-1 text-[14.5px] leading-[1.6] text-plum/85">Email us a photo of your nails next to a ruler and we will read the sizes for you. One free size exchange within 30 days if the fit is wrong.</p>
            <p className="mt-3 text-[13px] text-muted">{SITE.hours}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Pill href={`mailto:${SITE.email}?subject=Sizing%20help`}><MailIcon width={16} height={16} /> Email us</Pill>
            <Pill href="/pages/faq" kind="outline"><QuestionIcon width={16} height={16} /> Help Center</Pill>
          </div>
        </div>
      </InfoBody>
    </>
  );
}
