import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";

const EXTS = [".jpg", ".jpeg", ".webp", ".png"];

/** Returns "/images/<name>.<ext>" if that file exists in public/, else null. */
export function findImage(name: string) {
  for (const ext of EXTS) {
    const rel = `/images/${name}${ext}`;
    if (existsSync(path.join(process.cwd(), "public", rel))) return rel;
  }
  return null;
}

/**
 * Optional photography slot (server component). Drop e.g. `public/images/hero.jpg` and it replaces
 * the illustrated fallback — so the layout can match the reference 1:1 once you add your own photos.
 */
export default function Photo({
  name,
  src: remote,
  alt = "",
  fallback,
  className = "",
  priority,
  sizes = "100vw",
  position,
}: {
  name: string;
  /** Remote image (e.g. a product photo from Shopify) used when there's no local file. */
  src?: string | null;
  alt?: string;
  fallback: React.ReactNode;
  className?: string;
  priority?: boolean;
  sizes?: string;
  position?: string;
}) {
  const src = findImage(name) ?? remote;
  if (!src) return <>{fallback}</>;
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={`object-cover ${className}`} style={position ? { objectPosition: position } : undefined} />;
}
