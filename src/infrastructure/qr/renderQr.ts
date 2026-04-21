import QRCode from "qrcode";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export type RenderQrOptions = {
  errorCorrectionLevel?: QrErrorCorrectionLevel;
  margin?: number;
  /** For PNG output. */
  scale?: number;
};

const defaultOptions: Required<RenderQrOptions> = {
  errorCorrectionLevel: "M",
  margin: 2,
  scale: 8,
};

export async function renderQrSvg(payload: string, options: RenderQrOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
  });
}

export async function renderQrPngDataUrl(
  payload: string,
  options: RenderQrOptions = {},
) {
  const opts = { ...defaultOptions, ...options };
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
    scale: opts.scale,
  });
}

export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  payload: string,
  options: RenderQrOptions = {},
) {
  const opts = { ...defaultOptions, ...options };
  return QRCode.toCanvas(canvas, payload, {
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
    scale: opts.scale,
  });
}
