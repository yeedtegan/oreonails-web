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

export const ChatIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h10A1.5 1.5 0 0 1 17 5.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3h0A1.5 1.5 0 0 1 4 11.5Z" />
    <path d="M7.5 7.5h6M7.5 10h4" />
    <path d="M19 9.5h.5A1.5 1.5 0 0 1 21 11v5.5a1.5 1.5 0 0 1-1.5 1.5H19v2.5L16 18h-4.5a1.5 1.5 0 0 1-1.5-1.5V16" />
  </svg>
);

export const FlowerIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 9.8C10 6.5 10.6 3.5 12 3.5s2 3 0 6.3ZM12 14.2c2 3.3 1.4 6.3 0 6.3s-2-3 0-6.3ZM9.8 12C6.5 14 3.5 13.4 3.5 12s3-2 6.3 0ZM14.2 12c3.3-2 6.3-1.4 6.3 0s-3 2-6.3 0Z" />
    <path d="M10.4 10.4C7.5 8.8 6.6 6.6 7.6 5.6s3.2 0 4.8 2.8M13.6 13.6c2.9 1.6 3.8 3.8 2.8 4.8s-3.2 0-4.8-2.8M13.6 10.4c1.6-2.9 3.8-3.8 4.8-2.8s0 3.2-2.8 4.8M10.4 13.6c-1.6 2.9-3.8 3.8-4.8 2.8s0-3.2 2.8-4.8" />
  </svg>
);

export const PearlIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8" />
  </svg>
);

export const DiamondIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.5 4.5h11l3.5 5-9 10-9-10Z" />
    <path d="M3 9.5h18M9.5 4.5l-1.5 5 4 10 4-10-1.5-5" />
  </svg>
);

export const LayersIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m12 4 8.5 4.5L12 13 3.5 8.5Z" />
    <path d="m3.5 12.2 8.5 4.5 8.5-4.5M3.5 15.8l8.5 4.5 8.5-4.5" />
  </svg>
);

export const BowIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10.5 10.5 4 6.5c-1-.6-2 0-2 1.2v6.6c0 1.2 1 1.8 2 1.2l6.5-4M13.5 10.5 20 6.5c1-.6 2 0 2 1.2v6.6c0 1.2-1 1.8-2 1.2l-6.5-4" />
    <rect x="10.5" y="9.5" width="3" height="4" rx="1" />
    <path d="m11 13.5-2.5 6M13 13.5l2.5 6" />
  </svg>
);

export const PaletteIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-1 1.4-2-.5-1.2.3-2.5 1.6-2.5h2a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9Z" />
    <circle cx="7.5" cy="11" r="1.2" />
    <circle cx="10" cy="7" r="1.2" />
    <circle cx="14.5" cy="7" r="1.2" />
    <circle cx="17" cy="10.5" r="1.2" />
  </svg>
);

export const HistoryIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 4v4h4M12 7.5V12l3 2" />
  </svg>
);

export const BagIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 8h15l-1 12a1.5 1.5 0 0 1-1.5 1.4H7a1.5 1.5 0 0 1-1.5-1.4Z" />
    <path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-13M10 10.5v6M14 10.5v6" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

export const ArrowRightIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ChevronLeftIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const GiftIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12M12 8v13" />
    <path d="M12 8c-1-3-4.5-4.5-5.5-2.6S9 8 12 8Zm0 0c1-3 4.5-4.5 5.5-2.6S15 8 12 8Z" />
  </svg>
);

export const TruckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.5 6.5h11v10h-11ZM13.5 9.5h4l3 3.5v3.5h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

export const NoteIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <path d="M8 8.5h8M8 12h8M8 15.5h4.5" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </svg>
);

export const FilterIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1" />
    <circle cx="15" cy="6.5" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="17.5" r="2" />
  </svg>
);

export const ChevronDownIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 9 7 7 7-7" />
  </svg>
);

export const BagPlusIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 8h15l-1 12a1.5 1.5 0 0 1-1.5 1.4H7a1.5 1.5 0 0 1-1.5-1.4Z" />
    <path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5M12 12.5v5M9.5 15h5" />
  </svg>
);

export const StarIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9Z" />
  </svg>
);

/** nail polish bottle + file */
export const ToolIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="10" width="8" height="10.5" rx="2" />
    <path d="M6.5 10V6.5h3V10M7.5 6.5V3.5h1v3" />
    <path d="M17.5 3.5c1.2 0 1.8.9 1.6 2.2l-1.6 13.6c-.1.8-.6 1.2-1.1 1.2s-.9-.5-.8-1.3l.6-13.5c.1-1.4.5-2.2 1.3-2.2Z" />
  </svg>
);

export const FootIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8.5 21c-2.4 0-3.8-2-3.3-4.6l.8-4c.4-2 2-3.4 4-3.4h.5c1.9 0 3.4 1.6 3.3 3.5l-.3 4.3C13.3 19.4 11.3 21 8.5 21Z" />
    <circle cx="9" cy="5" r="1.6" />
    <circle cx="12.6" cy="4.6" r="1.2" />
    <circle cx="15.4" cy="5.6" r="1" />
    <circle cx="17.6" cy="7.4" r="0.9" />
    <circle cx="18.8" cy="9.9" r="0.8" />
  </svg>
);

export const CrownOutlineIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m3.5 8 4.5 4 4-6.5 4 6.5 4.5-4-1.8 10.5H5.3Z" />
    <path d="M5.5 21h13" />
  </svg>
);
