import type { DecodedLogoSource } from "./decodeLogoImage";

export type CropRect = {
  x: number;
  y: number;
  size: number;
};

export type ProcessedLogo = {
  bitmap: ImageBitmap;
  dataUrl: string;
};

export const WORKING_LOGO_SIZE = 256;

export async function cropLogoToSquare(
  decoded: DecodedLogoSource,
  crop: CropRect,
): Promise<ProcessedLogo> {
  const canvas = document.createElement("canvas");
  canvas.width = WORKING_LOGO_SIZE;
  canvas.height = WORKING_LOGO_SIZE;

  canvas
    .getContext("2d")!
    .drawImage(
      decoded.source,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      WORKING_LOGO_SIZE,
      WORKING_LOGO_SIZE,
    );

  const dataUrl = canvas.toDataURL("image/png");
  const bitmap = await createImageBitmap(canvas);
  return { bitmap, dataUrl };
}
