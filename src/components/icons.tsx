import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const SparkleIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" />
    <path d="M18 14c.3 1.7 1.1 2.5 2.8 2.8-1.7.3-2.5 1.1-2.8 2.8-.3-1.7-1.1-2.5-2.8-2.8 1.7-.3 2.5-1.1 2.8-2.8Z" />
    <path d="M18.5 3v3M17 4.5h3" />
  </svg>
);

export const GalleryIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="9.5" r="1.6" />
    <path d="m3.5 18 5-5 3.5 3.5 3-3 5.5 5" />
  </svg>
);

export const PlayIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8.5 5 3.5-5 3.5Z" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.6v.1" strokeWidth={2} />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
  </svg>
);

export const CartIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.5 3.5h2.6l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 7H6" />
    <circle cx="9.5" cy="20" r="1.3" />
    <circle cx="17.5" cy="20" r="1.3" />
  </svg>
);

export const CloudUploadIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 18.5H6a4 4 0 0 1-.6-7.95A6 6 0 0 1 17 8.6a4.5 4.5 0 0 1 1 8.9" />
    <path d="M12 21v-9M8.8 15 12 11.8l3.2 3.2" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" />
  </svg>
);

export const CameraIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.2l1.4-2.2h6.8L16.8 7H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z" />
    <circle cx="12" cy="12.8" r="3.6" />
  </svg>
);

export const PencilIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M15.5 4.5 19.5 8.5 9 19l-5 1 1-5Z" />
    <path d="m13.5 6.5 4 4M5 15l4 4" />
  </svg>
);

export const ChevronRightIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CrownIcon = (p: P) => (
  <svg viewBox="0 0 48 28" aria-hidden {...p}>
    <defs>
      <linearGradient id="crown-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d8b47c" />
        <stop offset="1" stopColor="#8a6230" />
      </linearGradient>
    </defs>
    <path
      d="M5 22 2 7l11 8 11-13 11 13 11-8-3 15Z"
      fill="url(#crown-g)"
      stroke="#7d5a2c"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <rect x="5" y="23" width="38" height="3.5" rx="1.5" fill="url(#crown-g)" />
    <circle cx="2" cy="6" r="2" fill="#c49a5c" />
    <circle cx="24" cy="2" r="2.2" fill="#c49a5c" />
    <circle cx="46" cy="6" r="2" fill="#c49a5c" />
  </svg>
);

export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 15V3.5M8 7.5l4-4 4 4" />
    <path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16" />
  </svg>
);

export const ExpandIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
  </svg>
);

export const SendIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20.5 3.5 3.5 10.6l6.8 3.1 3.1 6.8Z" />
    <path d="m10.3 13.7 4.4-4.4" />
  </svg>
);

export const ArrowLeftIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
