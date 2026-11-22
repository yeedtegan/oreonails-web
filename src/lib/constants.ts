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

/** Quick refinements offered after a design is generated. `open` = customer finishes the sentence. */
export const REFINEMENTS: { emoji: string; label: string; text: string; open?: boolean }[] = [
  { emoji: "🌸", label: "Add 3D Flowers", text: "add 3D flowers" },
  { emoji: "🦪", label: "Add Pearls", text: "add pearls" },
  { emoji: "💎", label: "Add Rhinestones", text: "add rhinestones" },
  { emoji: "✨", label: "Add Glitter", text: "add glitter" },
  { emoji: "🪙", label: "Add Foil (Gold/Silver)", text: "add gold foil accents" },
  { emoji: "🎀", label: "Add Bow", text: "add a small bow" },
  { emoji: "💝", label: "Add Charms", text: "add small charms" },
  { emoji: "🎨", label: "Change Color", text: "change the color to ", open: true },
];
