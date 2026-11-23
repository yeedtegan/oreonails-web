import type { NailStyleId } from "@/components/NailThumb";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_PROMPT = 500;

/** `prompt` is the line added to the design description when the style is picked. */
export type NailStyle = { id: NailStyleId; label: string; prompt: string };

export const STYLES: NailStyle[] = [
  { id: "french", label: "French", prompt: "Classic French tips: soft nude-pink base with clean white tips" },
  { id: "minimal", label: "Minimal", prompt: "Minimal nude nails with a tiny gold dot accent" },
  { id: "floral", label: "Floral", prompt: "Delicate hand-painted pink flowers on a soft pink base" },
  { id: "glitter", label: "Glitter", prompt: "Sparkling silver glitter finish" },
  { id: "ombre", label: "Ombre", prompt: "Soft ombre fading from milky white to pink" },
  { id: "3d-art", label: "3D Art", prompt: "3D nail art with a small pink bow and pearl accents" },
  { id: "holiday", label: "Holiday", prompt: "Festive deep red nails with gold sparkle accents" },
  { id: "halloween", label: "Halloween", prompt: "Glossy black Halloween nails with spider webs and a tiny pumpkin" },
  { id: "christmas", label: "Christmas", prompt: "Christmas red nails with white snowflakes" },
];

export const MORE_STYLES: NailStyle[] = [
  { id: "chrome", label: "Chrome", prompt: "Mirror chrome finish" },
  { id: "marble", label: "Marble", prompt: "White marble nails with soft grey veins and gold flakes" },
  { id: "cat-eye", label: "Cat Eye", prompt: "Magnetic cat-eye effect in deep purple" },
  { id: "matte", label: "Matte", prompt: "Matte mocha brown finish" },
];

/** The style's prompt text, e.g. "Classic French tips: …". */
export function stylePrompt(id: NailStyleId) {
  return [...STYLES, ...MORE_STYLES].find((s) => s.id === id)?.prompt ?? "";
}

/** The description line for a style, e.g. "- Classic French tips: …". */
export function styleLine(id: NailStyleId) {
  const prompt = stylePrompt(id);
  return prompt ? `- ${prompt}` : "";
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** True if a description line still carries the style's prompt (even without the "- "). */
export function lineHasStyle(line: string, id: NailStyleId) {
  const prompt = normalize(stylePrompt(id));
  return !!prompt && normalize(line).includes(prompt);
}

/** Price of one custom press-on set (USD). */
export const DESIGN_PRICE = 28;

/** Quick Add details: pick several (list on desktop, tiles on phones), then "Generate" sends them as one edit. */
export type QuickAddCategory = "glitter" | "bow" | "flower" | "gem" | "charm";
export const QUICK_ADD_CATEGORIES: { id: QuickAddCategory; label: string; emoji: string }[] = [
  { id: "glitter", label: "Glitter", emoji: "✨" },
  { id: "bow", label: "Bow", emoji: "🎀" },
  { id: "flower", label: "3D Flower", emoji: "🌸" },
  { id: "gem", label: "Gem", emoji: "💎" },
  { id: "charm", label: "Charm", emoji: "⭐" },
];
export const QUICK_ADD: { id: string; label: string; emoji: string; text: string; category: QuickAddCategory; image: string }[] = [
  { id: "glitter", label: "Glitter", emoji: "✨", text: "add glitter", category: "glitter", image: "/quick/glitter.jpg" },
  { id: "bow", label: "Bow", emoji: "🎀", text: "add a small bow", category: "bow", image: "/quick/bow.jpg" },
  { id: "3d-flower", label: "3D Flower", emoji: "🌸", text: "add 3D flowers", category: "flower", image: "/quick/flower.jpg" },
  { id: "gem", label: "Gem", emoji: "💎", text: "add a large gem", category: "gem", image: "/quick/gem.jpg" },
  { id: "pearl", label: "Pearl", emoji: "🤍", text: "add pearls", category: "gem", image: "/quick/pearl.jpg" },
  { id: "charms", label: "Charms", emoji: "🔱", text: "add small gold charms", category: "charm", image: "/quick/charms.jpg" },
  { id: "metal", label: "Metal Accent", emoji: "🪙", text: "add thin gold metal accents", category: "charm", image: "/quick/metal.jpg" },
  { id: "rhinestone", label: "Rhinestone", emoji: "💠", text: "add rhinestones", category: "gem", image: "/quick/rhinestone.jpg" },
  { id: "lace", label: "Lace", emoji: "🕸️", text: "add a white lace pattern", category: "charm", image: "/quick/lace.jpg" },
  { id: "heart", label: "Heart", emoji: "💜", text: "add a small heart gem", category: "gem", image: "/quick/heart.jpg" },
  { id: "butterfly", label: "Butterfly", emoji: "🦋", text: "add a small 3D butterfly", category: "flower", image: "/quick/butterfly.jpg" },
  { id: "star", label: "Star", emoji: "⭐", text: "add a small gold star", category: "charm", image: "/quick/star.jpg" },
];
