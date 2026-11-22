import type { CSSProperties } from "react";

export type NailStyleId =
  | "french"
  | "minimal"
  | "floral"
  | "glitter"
  | "ombre"
  | "3d-art"
  | "holiday"
  | "halloween"
  | "christmas"
  | "chrome"
  | "marble"
  | "cat-eye"
  | "matte";

type Look = {
  scene: string; // card background
  nail: string; // nail paint
  deco?: string[]; // per nail decoration (emoji / glyph)
  decoColor?: string;
};

const glitter =
  "radial-gradient(circle at 20% 30%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, #e8e8f0 0 1.2px, transparent 1.7px), radial-gradient(circle at 80% 20%, #fff 0 0.8px, transparent 1.3px), linear-gradient(160deg, #e9e6ee, #b9b4c2 50%, #efeef3)";

export const LOOKS: Record<NailStyleId, Look> = {
  french: {
    scene: "linear-gradient(160deg,#f7dcd8,#e9b9b0)",
    nail: "linear-gradient(to bottom,#fffdfb 0 30%,#f4cfc9 32% 100%)",
  },
  minimal: {
    scene: "linear-gradient(160deg,#efd2c2,#d8aa92)",
    nail: "linear-gradient(170deg,#f1d3c3,#e2b39c)",
    deco: ["", "•", ""],
    decoColor: "#c49a5c",
  },
  floral: {
    scene: "linear-gradient(160deg,#f6e1dd,#e7c3bd)",
    nail: "linear-gradient(170deg,#fbeeee,#f1d4d2)",
    deco: ["🌸", "✿", "🌸"],
  },
  glitter: {
    scene: "linear-gradient(160deg,#ece7ee,#cbc3cf)",
    nail: glitter,
    deco: ["✦", "", "✧"],
    decoColor: "#ffffff",
  },
  ombre: {
    scene: "linear-gradient(160deg,#f7e0dc,#ecc2bd)",
    nail: "linear-gradient(to bottom,#fffafa 0%,#f6cfd0 55%,#ec9fa8 100%)",
  },
  "3d-art": {
    scene: "linear-gradient(160deg,#fbe9ea,#f0cfd2)",
    nail: "linear-gradient(170deg,#fff3f4,#f6d6da)",
    deco: ["◦", "🎀", "◦"],
    decoColor: "#fff",
  },
  holiday: {
    scene: "linear-gradient(160deg,#7d1626,#4c0b16)",
    nail: "linear-gradient(170deg,#b3233a,#6e0f1f)",
    deco: ["✦", "❄", "✦"],
    decoColor: "#e8c98f",
  },
  halloween: {
    scene: "linear-gradient(160deg,#3a3233,#1a1617)",
    nail: "linear-gradient(170deg,#2a2627,#0e0c0c)",
    deco: ["🕸", "🎃", "🕸"],
    decoColor: "#ddd",
  },
  christmas: {
    scene: "linear-gradient(160deg,#a51d2d,#6b0f1b)",
    nail: "linear-gradient(170deg,#d0283d,#8e1527)",
    deco: ["❄", "❅", "❄"],
    decoColor: "#fff",
  },
  chrome: {
    scene: "linear-gradient(160deg,#e9e4e6,#c7bfc4)",
    nail: "linear-gradient(120deg,#cfc9d2 0%,#fff 35%,#b9b2bd 55%,#f6f3f7 80%)",
  },
  marble: {
    scene: "linear-gradient(160deg,#f1ece9,#d9d0cb)",
    nail: "linear-gradient(35deg,transparent 45%,#b7a8a0 47%,transparent 50%),linear-gradient(-25deg,transparent 60%,#c7b49a 62%,transparent 64%),#f8f5f3",
  },
  "cat-eye": {
    scene: "linear-gradient(160deg,#3e2a4c,#1f1428)",
    nail: "linear-gradient(100deg,#2b1b38 0%,#8f6ab3 45%,#e2d0f5 50%,#8f6ab3 55%,#2b1b38 100%)",
  },
  matte: {
    scene: "linear-gradient(160deg,#cbb6ad,#9e857a)",
    nail: "linear-gradient(170deg,#7c5b51,#5e433b)",
  },
};

/** Stylised illustration of three fingertips wearing the given nail style. */
export default function NailThumb({ id, className = "" }: { id: NailStyleId; className?: string }) {
  const look = LOOKS[id];
  const fingers = [
    { rot: -10, h: 86, x: "18%" },
    { rot: -2, h: 100, x: "50%" },
    { rot: 8, h: 90, x: "82%" },
  ];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: look.scene }}
      aria-hidden
    >
      {/* soft light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.45),transparent_55%)]" />
      {fingers.map((f, i) => (
        <div
          key={i}
          className="absolute bottom-[-30%] w-[27%] -translate-x-1/2 rounded-t-[999px]"
          style={
            {
              left: f.x,
              height: `${f.h}%`,
              transform: `translateX(-50%) rotate(${f.rot}deg)`,
              background: "linear-gradient(90deg,#e7b8a0,#f6d4c2 45%,#e3ae96)",
              boxShadow: "0 6px 14px -6px rgba(80,40,30,0.45)",
            } as CSSProperties
          }
        >
          <div
            className="absolute left-1/2 top-[5%] grid h-[52%] w-[74%] -translate-x-1/2 place-items-center overflow-hidden rounded-t-[999px] rounded-b-[38%]"
            style={{
              background: look.nail,
              boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.12), inset 2px 3px 4px rgba(255,255,255,0.55)",
            }}
          >
            <span className="absolute left-[18%] top-[10%] h-[45%] w-[16%] rounded-full bg-white/50 blur-[1px]" />
            {look.deco?.[i] && (
              <span
                className="relative text-[13px] leading-none drop-shadow-sm"
                style={{ color: look.decoColor }}
              >
                {look.deco[i]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
