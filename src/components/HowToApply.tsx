"use client";

import { useState } from "react";
import NailArt from "./NailArt";
import { GiftIcon } from "./Icons";

const TABS: Record<string, [string, string][]> = {
  Prep: [
    ["Size", "pick a nail for each finger that covers your nail edge to edge, just above the cuticle."],
    ["Prep", "push back cuticles, lightly buff, then wipe each nail with the alcohol pad."],
  ],
  Glue: [
    ["Apply", "add a thin layer of glue to your nail and the press-on."],
    ["Press", "angle it from the cuticle down and hold firmly for 30 seconds."],
  ],
  Tabs: [
    ["Stick", "peel a tab, press it onto your nail and remove the top film."],
    ["Press", "place the press-on and hold for 30 seconds. Great for 1–3 day wear."],
  ],
  Remove: [
    ["Soak", "soak fingertips in warm soapy water with a little oil for 10–15 minutes."],
    ["Lift", "gently lift from the side with the cuticle stick — never force them off."],
  ],
};

/** Bordered "How to Apply" card: dark kit image left, tabbed steps right. */
export default function HowToApply({ embedded }: { embedded?: boolean }) {
  const [tab, setTab] = useState("Prep");
  if (embedded) return <Inner tab={tab} setTab={setTab} embedded />;
  return (
    <section className="mx-auto max-w-[1160px] px-3 md:px-10 xl:px-0">
      <Inner tab={tab} setTab={setTab} />
    </section>
  );
}

function Inner({ tab, setTab, embedded }: { tab: string; setTab: (t: string) => void; embedded?: boolean }) {
  return (
    <div className={embedded ? "grid gap-6 lg:grid-cols-[412px_1fr] lg:gap-7" : "grid gap-6 rounded-[20px] border border-line bg-[#fbf8f9] p-5 md:p-10 lg:grid-cols-[minmax(0,604px)_1fr] lg:gap-12"}>
        <div className="relative aspect-[604/336] overflow-hidden rounded-2xl bg-black">
          <NailArt bare palette={["#000000", "#d9a58f", "#f4c2d0", "#ffffff"]} pattern="solid" shape="Almond" className="absolute inset-0 h-full w-full opacity-80" />
          <span className="absolute right-9 top-7 font-display text-[22px] text-white">{embedded ? "Correct size: no gap, no overlap" : "Kit Includes"}</span>
        </div>
        <div className={embedded ? "self-center" : "lg:self-center"}>
          {!embedded && <h2 className="font-display text-[30px] font-medium md:text-[32px]">How to Apply</h2>}
          <div className={`${embedded ? "" : "mt-5"} flex h-[44px] rounded-full bg-[#f1eaee] p-[3px]`}>
            {Object.keys(TABS).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-full text-[14px] transition ${tab === t ? "bg-white font-bold shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "font-medium text-muted"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <ol className="mt-5 space-y-4">
            {TABS[tab].map(([b, text], i) => (
              <li key={b} className="flex gap-3 text-[15px] leading-[1.6]">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-pink text-[12px] font-bold">{i + 1}</span>
                <span><b>{b}:</b> {text}</span>
              </li>
            ))}
          </ol>
          {!embedded && (
            <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[12.5px] text-muted">
              <GiftIcon width={14} height={14} className="text-[#b5577c]" /> Glue, adhesive tabs, file, cuticle stick and alcohol pad are all in the box.
            </p>
          )}
        </div>
      </div>
  );
}
