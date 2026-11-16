import { NextResponse } from "next/server";

export const fail = (status: number, error: string, fields?: Record<string, string[]>) => NextResponse.json({ error, ...(fields && { fields }) }, { status });

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Trimmed string field, or undefined when missing/blank. Over-long values are rejected by the caller via `tooLong`. */
export const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const num = (v: string | null) => (v && !isNaN(Number(v)) ? Number(v) : undefined);
