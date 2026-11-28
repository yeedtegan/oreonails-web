"use client";

/** longest side of a stored product photo — plenty for the product page, ~5× a grid card */
const MAX_SIDE = 1600;
/** photos already this small (and not too big in pixels) are kept as they are */
const KEEP_BYTES = 400 * 1024;

/**
 * A product photo made web-sized before upload: at most 1600 px on its longest side, JPEG q0.86 on a white
 * background (the shop shows product photos with mix-blend-multiply, so white = no background).
 * A phone photo of 3–5 MB becomes ~200–400 KB. Anything that can't be decoded is uploaded unchanged.
 */
export async function shrinkImage(file: File): Promise<File> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= KEEP_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const g = canvas.getContext("2d");
    if (!g) return file;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.imageSmoothingQuality = "high";
    g.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]*$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    bmp.close();
  }
}
