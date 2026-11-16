// Static storefront config and shared types. Catalogue, cart, checkout and customer accounts live in Shopify —
// see src/lib/shopify/. Custom fields (palette, pattern…) are Shopify metafields in the "oreo" namespace.

export type Pattern =
  | "solid"
  | "french"
  | "dots"
  | "stripes"
  | "stars"
  | "plaid"
  | "ombre"
  | "hearts"
  | "flowers"
  | "leopard"
  | "chrome"
  | "lights";

export type ProductType = "set" | "bundle" | "tool";

export interface ProductVariant {
  id: string;
  available: boolean;
  size?: string;
  shape?: string;
}

export interface Product {
  /** Shopify product GID. */
  id?: string;
  handle: string;
  title: string;
  type: ProductType;
  price: number;
  compareAt?: number;
  collections: string[];
  palette: [string, string, string, string]; // background, base, accent, detail
  pattern: Pattern;
  shape: string;
  rating: number;
  reviewCount: number;
  description: string;
  setsIncluded?: number;
  rank: number; // best-seller rank (lower = better)
  added: number; // higher = newer
  images?: string[];
  active?: boolean;
  /** Present when fetched with variants (product page, cart adds). */
  variants?: ProductVariant[];
}

export interface Collection {
  handle: string;
  title: string;
  description: string;
  group: "shop" | "collection" | "season" | "other";
  palette: [string, string, string, string];
  pattern: Pattern;
  image?: string | null;
}

export const SITE = {
  name: "Oreo Nails",
  tagline: "Press-on nails hand-painted to order in our studio.",
  email: "hello@oreonails.com",
  whatsapp: "+84 900 000 000",
  hours: "9 AM – 5 PM (GMT+7), Monday – Saturday",
  address: "123 Example Street, Hanoi, Vietnam",
  freeShippingThreshold: 69,
  shippingFee: 5.99,
  welcomeCode: "WELCOME10",
  welcomePercent: 10,
  socials: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
    pinterest: "https://pinterest.com/",
    youtube: "https://youtube.com/",
  },
};

/**
 * Mix & match tiers shown in the UI ("buy 2 get 1"…). The discount itself is applied by Shopify automatic
 * Buy X Get Y discounts (created by scripts/shopify-migrate.mjs) — keep the two in sync.
 */
export const PROMO_TIERS = [
  { buy: 2, get: 1 },
  { buy: 3, get: 2 },
  { buy: 5, get: 3 },
];

export const SIZES = ["XS", "S", "M", "L", "Custom"] as const;
export const SHAPES = ["Almond", "Coffin", "Square", "Oval", "Stiletto"] as const;

export const SETS_INCLUDED = [
  "10 hand-painted nails in your size (24 for Custom)",
  "Nail glue",
  "2 sheets of adhesive tabs",
  "2 alcohol prep pads",
  "Cuticle pusher",
  "Mini nail file",
];

export const SIZE_CHART: { size: string; mm: [number, number, number, number, number] }[] = [
  { size: "XS", mm: [14, 10, 11, 10, 7] },
  { size: "S", mm: [15, 11, 12, 10, 8] },
  { size: "M", mm: [16, 12, 13, 11, 9] },
  { size: "L", mm: [17, 13, 14, 12, 10] },
];

export interface Article {
  slug: string;
  tags?: string[];
  title: string;
  excerpt: string;
  date: string;
  palette: [string, string, string, string];
  pattern: Pattern;
  body?: string[];
  image?: string | null;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  product?: string;
  productTitle?: string;
  variant?: string;
  date: string;
}

export const NAV = {
  main: [
    { label: "Holiday Glam", href: "/collections/holiday-glam", badge: "New" },
    { label: "Toenails", href: "/collections/toenails" },
    { label: "Best Sellers", href: "/collections/best-sellers" },
    { label: "Bundles", href: "/pages/build-bundle" },
    { label: "Tools", href: "/collections/tools-accessories" },
    { label: "Size Guide", href: "/pages/sizing-guide" },
  ],
  footer: [
    {
      title: "Information",
      links: [
        { label: "About Us", href: "/pages/about-us" },
        { label: "Reviews", href: "/pages/reviews" },
        { label: "The Oreo Club", href: "/pages/rewards" },
        { label: "Nail Guide", href: "/blogs/nail-guide" },
      ],
    },
    {
      title: "Customer Service",
      links: [
        { label: "Track Order", href: "/pages/track-order" },
        { label: "Size Guide", href: "/pages/sizing-guide" },
        { label: "How to Apply", href: "/pages/how-to-apply" },
        { label: "Care & Reuse Guide", href: "/pages/care-guide" },
        { label: "Custom Nail Service", href: "/pages/custom-nail-service" },
      ],
    },
    {
      title: "Policies",
      links: [
        { label: "Shipping & Delivery", href: "/pages/shipping-policy" },
        { label: "Returns & Exchanges", href: "/pages/return-policy" },
        { label: "Privacy Policy", href: "/pages/privacy-policy" },
        { label: "Terms of Service", href: "/pages/terms-of-service" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "FAQ", href: "/pages/faq" },
        { label: "Contact Us", href: "/pages/contact" },
      ],
    },
  ],
};

// ---- API response types ----

export interface SiteSettings {
  promoTiers: { buy: number; get: number }[];
  freeShippingThreshold: number;
  shippingFee: number;
  sizes: string[];
  shapes: string[];
}

export interface Faq {
  q: string;
  a: string;
  category?: string;
}

export interface ReviewSummary {
  count: number;
  average: number;
  distribution: Record<string, number>;
}

/* ---------------- "db" backend: orders and accounts (Oreo Nails API) ---------------- */

export interface OrderItem {
  handle: string;
  title: string;
  unitPrice: number;
  qty: number;
  size: string | null;
  shape: string | null;
  customSizes: string | null;
}

export interface Address {
  firstName?: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  countryCode: string;
  phone?: string;
}

export interface Order {
  number: string;
  email: string;
  name: string;
  address: string;
  subtotal: number;
  promoDiscount: number;
  code: string | null;
  codeDiscount: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  phone?: string | null;
  shippingAddress?: Address | null;
  billingAddress?: Address | null;
  shippingMethod?: string | null;
  paymentMethod?: "card" | "paypal";
  paymentStatus?: "pending" | "paid";
  paymentDetail?: string | null;
  paidAt?: string | null;
  acceptsMarketing?: boolean;
  pointsAwarded?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  points: number;
  createdAt: string;
}
