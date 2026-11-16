type P = React.SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const SearchIcon = (p: P) => (<svg {...base} {...p}><circle cx="11" cy="11" r="7.5" /><path d="m21 21-4.5-4.5" /></svg>);
export const BagIcon = (p: P) => (<svg {...base} {...p}><path d="M4.5 8h15l-1.2 12.2a1 1 0 0 1-1 .8H6.7a1 1 0 0 1-1-.8L4.5 8Z" /><path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" /></svg>);
export const UserIcon = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>);
export const UserSolid = (p: P) => (<svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="7.5" r="4.5" /><path d="M3.5 21a8.5 8.5 0 0 1 17 0Z" /></svg>);
export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (<svg {...base} {...p} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" /></svg>);
export const MenuIcon = (p: P) => (<svg {...base} {...p}><path d="M3 6.5h18M3 12h18M3 17.5h18" /></svg>);
export const CloseIcon = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const ChevronDown = (p: P) => (<svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>);
export const ChevronLeft = (p: P) => (<svg {...base} {...p}><path d="m15 6-6 6 6 6" /></svg>);
export const ChevronRight = (p: P) => (<svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>);
export const PlusIcon = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const MinusIcon = (p: P) => (<svg {...base} {...p}><path d="M5 12h14" /></svg>);
export const CheckIcon = (p: P) => (<svg {...base} {...p}><path d="m5 12 5 5 9-10" /></svg>);
export const TruckIcon = (p: P) => (<svg {...base} {...p}><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7z" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>);
export const BrushIcon = (p: P) => (<svg {...base} {...p}><path d="m14.5 4.5 5 5L11 18H6v-5z" /><path d="m12.5 6.5 5 5" /><path d="M6 18 3.5 20.5" /></svg>);
export const RepeatIcon = (p: P) => (<svg {...base} {...p}><path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5" /><path d="M4 4v4.5h4.5" /><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5" /><path d="M20 20v-4.5h-4.5" /></svg>);
export const SwapIcon = (p: P) => (<svg {...base} {...p}><path d="M4 8h14l-3-3M20 16H6l3 3" /></svg>);
export const ClockIcon = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const UsersIcon = (p: P) => (<svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4.5-6.2" /></svg>);
export const RulerIcon = (p: P) => (<svg {...base} {...p}><rect x="2.5" y="8" width="19" height="8" rx="1.5" /><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4" /></svg>);
export const GiftIcon = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12" /><path d="M12 8S10.5 3.5 8 4.5 9 8 12 8Zm0 0s1.5-4.5 4-3.5S15 8 12 8Z" /></svg>);
export const TagIcon = (p: P) => (<svg {...base} {...p}><path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9-8-8Z" /><circle cx="8" cy="8" r="1.4" /></svg>);
export const StarIcon = (p: P) => (<svg {...base} {...p}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" /></svg>);
export const ShieldIcon = (p: P) => (<svg {...base} {...p}><path d="M12 3 4.5 6v6c0 4.4 3.2 7.8 7.5 9 4.3-1.2 7.5-4.6 7.5-9V6Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>);
export const PenIcon = (p: P) => (<svg {...base} {...p}><path d="M4 20l1-5L16 4l4 4L9 19z" /><path d="M14 6l4 4" /></svg>);

export const InstagramIcon = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".8" fill="currentColor" /></svg>);
export const TiktokIcon = (p: P) => (<svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8.3 3v7.6a1.9 1.9 0 1 1-1.9-1.9h.3V9.6h-.3a4.1 4.1 0 1 0 4.1 4.1V9.9a4.8 4.8 0 0 0 2.6.8V8.5a2.6 2.6 0 0 1-2.6-2.5Z" /></svg>);
export const FacebookIcon = (p: P) => (<svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a10 10 0 0 0-1.6 19.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 12 2Z" /></svg>);
export const PinterestIcon = (p: P) => (<svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.5-1.8-4.3-4.4-4.3a4.6 4.6 0 0 0-4.8 4.6c0 .9.3 1.9.8 2.4l.1.4-.3 1.2c0 .2-.2.3-.4.2-1.3-.6-2.1-2.5-2.1-4.1 0-3.3 2.4-6.4 7-6.4 3.7 0 6.5 2.6 6.5 6.2 0 3.7-2.3 6.6-5.5 6.6-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2Z" /></svg>);
export const YoutubeIcon = (p: P) => (<svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z" /></svg>);

export function Stars({ rating, size = 14, className = "text-plum" }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-[1px] ${className}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={rating >= i - 0.25 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
          <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.8l-5.1 2.6 1-5.6-4.1-4 5.7-.8z" />
        </svg>
      ))}
    </span>
  );
}

/** Two-line serif wordmark in the same position/format as the reference logo. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-col items-center leading-none ${className}`}>
      <span className="font-playfair-display text-[19px] tracking-[0.06em] md:text-[20px]">OREO</span>
      <span className="mt-[3px] font-playfair-display text-[8px] tracking-[0.45em]">NAILS</span>
    </span>
  );
}

export const QuestionIcon = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></svg>);
export const ChatIcon = (p: P) => (<svg {...base} {...p}><path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.2A7.5 7.5 0 1 1 20 11.5Z" /></svg>);
export const MailIcon = (p: P) => (<svg {...base} {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></svg>);
export const PhoneIcon = (p: P) => (<svg {...base} {...p}><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 17.5h2" /></svg>);
export const PinIcon = (p: P) => (<svg {...base} {...p}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>);
export const StoreIcon = (p: P) => (<svg {...base} {...p}><path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8" /><path d="M10 20v-4h4v4" /></svg>);
export const ScissorsIcon = (p: P) => (<svg {...base} {...p}><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><path d="M8 8.5 20 17M8 15.5 20 7" /></svg>);
export const LayersIcon = (p: P) => (<svg {...base} {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12.5 9 5 9-5M3 16.5l9 5 9-5" /></svg>);
export const SparkleIcon = (p: P) => (<svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>);
export const InfoIcon = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r=".6" fill="currentColor" /></svg>);
export const HandIcon = (p: P) => (<svg {...base} {...p}><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3.2 15a1.5 1.5 0 0 1 2.4-1.8L8 15" /></svg>);
export const BoxIcon = (p: P) => (<svg {...base} {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>);
export const CardIcon = (p: P) => (<svg {...base} {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg>);
export const CoinsIcon = (p: P) => (<svg {...base} {...p}><ellipse cx="9" cy="7" rx="5.5" ry="2.5" /><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" /><path d="M9.5 16.3c.6 1 2.8 1.7 5 1.7 3 0 5.5-1.1 5.5-2.5v-4c0-1.2-1.9-2.2-4.5-2.4" /></svg>);
export const HeartOutline = (p: P) => (<svg {...base} {...p}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" /></svg>);
export const ArrowRight = (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
