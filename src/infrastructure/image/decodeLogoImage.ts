export type LogoValidationError = "unsupported-type" | "too-large" | "decode-failed";

export type DecodedLogoSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
};

export type DecodeLogoResult =
  | { ok: true; logo: DecodedLogoSource }
  | { ok: false; error: LogoValidationError };

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ACCEPTED_RASTER_TYPES = ["image/png", "image/jpeg", "image/webp"];
const SVG_TYPE = "image/svg+xml";

// Fallback raster size for SVGs with no intrinsic width/height (viewBox-only).
const SVG_FALLBACK_RASTER_SIZE = 512;

async function decodeRaster(file: File): Promise<DecodedLogoSource> {
  const bitmap = await createImageBitmap(file);
  return { source: bitmap, width: bitmap.width, height: bitmap.height };
}

async function decodeSvg(file: File): Promise<DecodedLogoSource> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode-failed"));
    });
    img.src = objectUrl;
    await loaded;

    // naturalWidth/Height are 0 for viewBox-only SVGs with no explicit width/height.
    const width = img.naturalWidth || SVG_FALLBACK_RASTER_SIZE;
    const height = img.naturalHeight || SVG_FALLBACK_RASTER_SIZE;

    // Decoding through an <img>/canvas ("image context") is a browser-level security
    // boundary: scripts embedded in the SVG are never executed here. The raw SVG
    // markup is discarded once this rasterization completes.
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

    return { source: canvas, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function decodeLogoImage(file: File): Promise<DecodeLogoResult> {
  const isSvg = file.type === SVG_TYPE;
  if (!isSvg && !ACCEPTED_RASTER_TYPES.includes(file.type)) {
    return { ok: false, error: "unsupported-type" };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "too-large" };
  }

  try {
    const logo = isSvg ? await decodeSvg(file) : await decodeRaster(file);
    return { ok: true, logo };
  } catch {
    return { ok: false, error: "decode-failed" };
  }
}
