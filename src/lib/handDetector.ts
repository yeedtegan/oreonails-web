"use client";

import type { HandLandmarker } from "@mediapipe/tasks-vision";

/**
 * Client-side hand check with MediaPipe Hand Landmarker.
 * The WASM runtime (public/mediapipe, copied on postinstall) and the model
 * (public/models) are served from our own origin and loaded lazily, once.
 */

export type HandCheck =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; message: string }
  /** a hand is there but the photo could be better — does not block */
  | { status: "warn"; message: string }
  /** no hand — blocks generation */
  | { status: "fail"; message: string }
  /** detector could not run (offline, old browser…) — does not block */
  | { status: "error"; message: string };

const WASM_PATH = "/mediapipe";
const MODEL_PATH = "/models/hand_landmarker.task";
const MAX_SIDE = 1024; // downscale big photos: faster, same accuracy for this use
const FINGERTIPS = [4, 8, 12, 16, 20];
const MIN_HAND_SIZE = 0.2; // hand bbox (longest side) relative to the photo

let landmarkerPromise: Promise<HandLandmarker> | null = null;

/** Starts loading the model (safe to call many times, e.g. on hover/click). */
export function warmUpHandDetector(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      return HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
        runningMode: "IMAGE",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
      });
    })();
    // allow a retry later if loading failed
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

async function toCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode(); // respects EXIF orientation
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function checkHandPhoto(file: File): Promise<HandCheck> {
  let landmarker: HandLandmarker;
  let canvas: HTMLCanvasElement;
  try {
    [landmarker, canvas] = await Promise.all([warmUpHandDetector(), toCanvas(file)]);
  } catch {
    return { status: "error", message: "We couldn't check this photo automatically — you can still continue." };
  }

  const { landmarks } = landmarker.detect(canvas);
  if (landmarks.length === 0) {
    return {
      status: "fail",
      message: "We couldn't find a hand in this photo. Please upload a clear photo of your hand.",
    };
  }

  // use the biggest hand in the photo
  const hands = landmarks.map((pts) => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    return { pts, size };
  });
  const hand = hands.reduce((a, b) => (b.size > a.size ? b : a));

  const tipCut = FINGERTIPS.some((i) => {
    const p = hand.pts[i];
    return p.x < 0.01 || p.x > 0.99 || p.y < 0.01 || p.y > 0.99;
  });
  if (tipCut) {
    return { status: "warn", message: "Some fingertips are cut off — keep all five nails inside the photo." };
  }
  if (hand.size < MIN_HAND_SIZE) {
    return { status: "warn", message: "Your hand looks small — move closer so the nails are clearly visible." };
  }
  return { status: "ok", message: "Hand detected" };
}
