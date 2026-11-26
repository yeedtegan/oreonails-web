import { MAX_PROMPT, QUICK_ADD } from "./constants";

/**
 * Quick Add writes into a text box: picking a detail adds its prompt as its own line ("Add pearls"), picking it
 * again removes that line. A detail counts as picked while its line is in the text — so deleting the line by hand
 * un-picks it too.
 */

/** "add pearls" → "Add pearls" */
const quickLine = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** is this line that detail (ignoring case, spaces, a leading "-" and a trailing "." / ",") */
const isQuickLine = (line: string, text: string) =>
  line.trim().replace(/^[-•*]\s*/, "").replace(/[.,;]+$/, "").trim().toLowerCase() === text.toLowerCase();

/** ids of the Quick Add details whose line is in the text */
export function pickedQuick(text: string): string[] {
  const lines = text.split("\n");
  return QUICK_ADD.filter((q) => lines.some((l) => isQuickLine(l, q.text))).map((q) => q.id);
}

/** the text with that detail's line added (or removed, if it is already there) */
export function toggleQuickLine(text: string, id: string): string {
  const item = QUICK_ADD.find((q) => q.id === id);
  if (!item) return text;
  const lines = text.split("\n");
  if (lines.some((l) => isQuickLine(l, item.text))) {
    return lines
      .filter((l) => !isQuickLine(l, item.text))
      .join("\n")
      .trim();
  }
  const body = text.replace(/\s+$/, "");
  return (body ? `${body}\n${quickLine(item.text)}` : quickLine(item.text)).slice(0, MAX_PROMPT);
}
