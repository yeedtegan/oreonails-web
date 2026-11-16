"use client";

import { useId } from "react";
import type { Pattern } from "@/lib/data";

const SHAPE_PATHS: Record<string, string> = {
  Square: "M0 6 Q0 0 6 0 H34 Q40 0 40 6 V72 Q40 90 20 90 Q0 90 0 72 Z",
  Oval: "M0 20 Q0 0 20 0 Q40 0 40 20 V72 Q40 90 20 90 Q0 90 0 72 Z",
  Almond: "M0 32 Q2 6 20 0 Q38 6 40 32 V72 Q40 90 20 90 Q0 90 0 72 Z",
  Coffin: "M5 4 Q6 0 11 0 H29 Q34 0 35 4 L40 72 Q40 90 20 90 Q0 90 0 72 Z",
  Stiletto: "M0 42 Q4 14 20 0 Q36 14 40 42 V72 Q40 90 20 90 Q0 90 0 72 Z",
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const star = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(1)},${(cy + rr * Math.sin(rad)).toFixed(1)}`);
  }
  return pts.join(" ");
};

function Overlay({ pattern, id, accent, detail, nail }: { pattern: Pattern; id: string; accent: string; detail: string; nail: number }) {
  switch (pattern) {
    case "french":
      return <path d="M-5 -5 H45 V22 Q20 34 -5 22 Z" fill={accent} />;
    case "dots":
      return <rect x="-5" y="-5" width="50" height="100" fill={`url(#${id}-dots)`} />;
    case "stripes":
      return <rect x="-5" y="-5" width="50" height="100" fill={`url(#${id}-stripes)`} />;
    case "plaid":
      return <rect x="-5" y="-5" width="50" height="100" fill={`url(#${id}-plaid)`} />;
    case "ombre":
    case "chrome":
      return <rect x="-5" y="-5" width="50" height="100" fill={`url(#${id}-grad)`} />;
    case "stars":
      return (
        <g fill={accent}>
          <polygon points={star(14 + (nail % 2) * 10, 30, 6)} />
          <polygon points={star(28 - (nail % 2) * 12, 58, 4)} />
          <circle cx={30} cy={18} r={1.3} fill={detail} />
          <circle cx={10} cy={70} r={1.1} fill={detail} />
        </g>
      );
    case "hearts":
      return nail % 2 === 0 ? (
        <path d="M20 62 C4 50 8 34 20 42 C32 34 36 50 20 62 Z" fill={accent} />
      ) : (
        <rect x="-5" y="-5" width="50" height="100" fill={`url(#${id}-dots)`} />
      );
    case "flowers":
      return (
        <g transform={`translate(${nail % 2 ? 22 : 18} ${nail % 2 ? 52 : 40})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="4.5" ry="7" fill={accent} transform={`rotate(${a})`} />
          ))}
          <circle r="3.2" fill={detail} />
        </g>
      );
    case "leopard":
      return (
        <g>
          {[
            [10, 18], [28, 26], [16, 44], [30, 54], [12, 68], [26, 78],
          ].map(([x, y], i) => (
            <g key={i} transform={`rotate(${(i * 37 + nail * 20) % 90} ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="5.5" ry="4" fill="none" stroke={accent} strokeWidth="2.2" strokeDasharray="6 3" />
              <ellipse cx={x} cy={y} rx="2.4" ry="1.7" fill={accent} opacity=".55" />
            </g>
          ))}
        </g>
      );
    case "lights":
      return (
        <g>
          <path d="M-5 30 Q20 46 45 26" stroke={detail} strokeWidth="1.2" fill="none" opacity=".8" />
          {[
            [6, 35, accent], [20, 40, detail], [34, 32, accent],
          ].map(([x, y, c], i) => (
            <ellipse key={i} cx={x as number} cy={(y as number) + 4} rx="3" ry="4.5" fill={c as string} />
          ))}
          <path d="M-5 62 Q20 78 45 58" stroke={detail} strokeWidth="1.2" fill="none" opacity=".8" />
          {[
            [8, 67, detail], [24, 71, accent], [38, 62, detail],
          ].map(([x, y, c], i) => (
            <ellipse key={i} cx={x as number} cy={(y as number) + 4} rx="3" ry="4.5" fill={c as string} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

type Variant = "hand" | "set" | "bundle" | "tool";

/**
 * Pure-SVG stand-in for product photography (no external images).
 * - hand:   five large nails fanned out (banners, tiles)
 * - set:    2 rows × 5 nails on the light card background, like a product shot
 * - bundle: dark board with a 3×3 grid of sets
 * - tool:   tube + bottle illustration for accessories
 */
export default function NailArt({
  palette,
  pattern,
  shape = "Almond",
  className,
  title,
  variant = "hand",
  bare,
}: {
  palette: [string, string, string, string];
  pattern: Pattern;
  shape?: string;
  className?: string;
  title?: string;
  variant?: Variant;
  /** Skip the background fill so the art can sit on a gradient. */
  bare?: boolean;
}) {
  const [bg, base, accent, detail] = palette;
  // Per-instance ids: identical <clipPath> ids break when the first copy sits in a hidden subtree.
  const id = "na" + hash(palette.join("") + pattern + shape) + useId().replace(/[^a-zA-Z0-9]/g, "");
  const path = SHAPE_PATHS[shape] ?? SHAPE_PATHS.Almond;

  const nail = (key: string | number, x: number, y: number, w: number, h: number, r: number, i: number, colors = { base, accent, detail }) => (
    <g key={key} transform={`translate(${x} ${y}) rotate(${r} ${w / 2} ${h / 2}) scale(${w / 40} ${h / 90})`}>
      <path d={path} fill="#000" opacity=".1" transform="translate(2 4)" />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="-5" y="-5" width="50" height="100" fill={colors.base} />
        <Overlay pattern={pattern} id={id} accent={colors.accent} detail={colors.detail} nail={i} />
        <path d="M8 10 Q6 40 9 70" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity=".35" fill="none" />
      </g>
      <path d={path} fill="none" stroke="#000" strokeOpacity=".08" strokeWidth=".8" />
    </g>
  );

  // Row of 5 upright nails, thumb → pinky, as laid out in product photos.
  const row = (cx: number, y: number, scale: number, keyPrefix: string, colors?: { base: string; accent: string; detail: string }) => {
    const sizes = [[26, 52], [22, 50], [23, 54], [22, 50], [18, 42]];
    const gap = 5 * scale;
    const total = sizes.reduce((s, [w]) => s + w * scale, 0) + gap * 4;
    let x = cx - total / 2;
    return sizes.map(([w, h], i) => {
      const el = nail(`${keyPrefix}${i}`, x, y + (54 - h) * scale, w * scale, h * scale, 0, i, colors);
      x += w * scale + gap;
      return el;
    });
  };

  let body: React.ReactNode;
  let background = bg;
  if (variant === "set") {
    background = "#f8f4f6";
    body = (
      <>
        {row(150, 78, 1.25, "a")}
        {row(150, 160, 1.25, "b")}
        <text x="150" y="276" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fill="#3a3a3a" opacity=".75">@oreonails.com</text>
      </>
    );
  } else if (variant === "bundle") {
    background = "#2a2326";
    const swaps = [
      { base, accent, detail }, { base: accent, accent: base, detail }, { base: detail, accent, detail: base },
      { base: accent, accent: detail, detail: base }, { base, accent: detail, detail: accent }, { base: detail, accent: base, detail: accent },
      { base, accent, detail }, { base: accent, accent: base, detail }, { base: detail, accent, detail: base },
    ];
    body = (
      <>
        <rect width="300" height="300" fill={bg} opacity=".18" />
        {swaps.map((c, i) => {
          const cx = 62 + (i % 3) * 88;
          const cy = 30 + Math.floor(i / 3) * 84;
          return (
            <g key={i}>
              {row(cx, cy, 0.5, `r${i}a`, c)}
              {row(cx, cy + 29, 0.5, `r${i}b`, c)}
              <rect x={cx - 18} y={cy + 61} width="36" height="3" rx="1.5" fill="#fff" opacity=".85" />
            </g>
          );
        })}
        <rect y="282" width="300" height="9" fill="#fff" opacity=".18" />
        <text x="150" y="289" textAnchor="middle" fontFamily="Georgia, serif" fontSize="5" letterSpacing="1" fill="#fff" opacity=".8">OREO NAILS</text>
      </>
    );
  } else if (variant === "tool") {
    background = "#f8f4f6";
    body = (
      <>
        <ellipse cx="150" cy="248" rx="80" ry="8" fill="#000" opacity=".06" />
        {/* tube */}
        <rect x="88" y="62" width="46" height="150" rx="8" fill={base} />
        <rect x="96" y="80" width="6" height="110" rx="3" fill="#fff" opacity=".35" />
        <rect x="93" y="212" width="36" height="34" rx="4" fill="#2b2b2b" />
        <text x="111" y="140" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="#fff" transform="rotate(-90 111 140)">OREO NAILS</text>
        {/* bottle */}
        <rect x="150" y="118" width="58" height="128" rx="12" fill={accent} />
        <rect x="160" y="96" width="38" height="26" rx="4" fill="#e9e9e9" />
        <rect x="170" y="82" width="18" height="16" rx="3" fill="#d6d6d6" />
        <rect x="158" y="150" width="42" height="46" rx="4" fill="#fff" opacity=".85" />
        <text x="179" y="170" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fill={detail === "#ffffff" ? "#4b384c" : detail}>OREO</text>
        <text x="179" y="182" textAnchor="middle" fontFamily="Arial" fontSize="4.5" fill="#666">PRESS-ON CARE</text>
        <rect x="160" y="128" width="5" height="100" rx="2.5" fill="#fff" opacity=".3" />
      </>
    );
  } else {
    const nails = [
      { x: 30, y: 128, w: 44, h: 104, r: -14 },
      { x: 82, y: 82, w: 38, h: 112, r: -6 },
      { x: 131, y: 66, w: 40, h: 120, r: 0 },
      { x: 181, y: 82, w: 38, h: 112, r: 6 },
      { x: 230, y: 116, w: 32, h: 96, r: 14 },
    ];
    body = (
      <>
        {!bare && <rect width="300" height="300" fill={`url(#${id}-bg)`} />}
        {nails.map((n, i) => nail(i, n.x, n.y, n.w, n.h, n.r, i))}
      </>
    );
  }

  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label={title ?? "Press-on nail set"} preserveAspectRatio="xMidYMid slice">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={path} />
        </clipPath>
        <pattern id={`${id}-dots`} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="2.2" fill={accent} />
        </pattern>
        <pattern id={`${id}-stripes`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="5" height="10" fill={accent} />
        </pattern>
        <pattern id={`${id}-plaid`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="6" fill={accent} opacity=".55" />
          <rect width="6" height="16" fill={accent} opacity=".55" />
          <rect y="11" width="16" height="1" fill={detail} opacity=".8" />
          <rect x="11" width="1" height="16" fill={detail} opacity=".8" />
        </pattern>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2={pattern === "chrome" ? "1" : "0"} y2="1">
          {pattern === "chrome" ? (
            <>
              <stop offset="0" stopColor={base} />
              <stop offset=".45" stopColor={accent} />
              <stop offset=".6" stopColor={detail} stopOpacity=".7" />
              <stop offset="1" stopColor={base} />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={accent} />
              <stop offset="1" stopColor={base} stopOpacity="0" />
            </>
          )}
        </linearGradient>
        <radialGradient id={`${id}-bg`} cx=".5" cy=".4" r=".75">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {!bare && <rect width="300" height="300" fill={background} />}
      {body}
    </svg>
  );
}
