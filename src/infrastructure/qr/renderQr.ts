import QRCode from "qrcode";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export type RenderQrOptions = {
  errorCorrectionLevel?: QrErrorCorrectionLevel;
  margin?: number;
  /** For PNG output. */
  scale?: number;
};

export type QrLogoShape = "square" | "circle";

export type LogoOptions = {
  image: CanvasImageSource;
  dataUrl: string;
  sizeRatio: number;
  shape: QrLogoShape;
};

// Continuous slider range instead of fixed tiers — clamped at both ends so the UI
// can't drag the logo into a size that reliably breaks scanning.
export const MIN_LOGO_SIZE_RATIO = 0.1;
export const MAX_LOGO_SIZE_RATIO = 0.28;
export const DEFAULT_LOGO_SIZE_RATIO = 0.2;

function clampLogoSizeRatio(ratio: number): number {
  return Math.min(MAX_LOGO_SIZE_RATIO, Math.max(MIN_LOGO_SIZE_RATIO, ratio));
}

const defaultMargin = 2;
const defaultScale = 8;

function resolveOptions(
  options: RenderQrOptions,
  hasLogo: boolean,
): Required<RenderQrOptions> {
  return {
    errorCorrectionLevel: options.errorCorrectionLevel ?? (hasLogo ? "H" : "M"),
    margin: options.margin ?? defaultMargin,
    scale: options.scale ?? defaultScale,
  };
}

/** Draws `logo` centered on `canvas`, with a solid inset behind it so QR modules don't show through. */
function compositeLogo(canvas: HTMLCanvasElement, logo: LogoOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const center = canvas.width / 2;
  const size = canvas.width * clampLogoSizeRatio(logo.sizeRatio);
  const insetSize = size * 1.15;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  if (logo.shape === "circle") {
    ctx.beginPath();
    ctx.arc(center, center, insetSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(center, center, size / 2, 0, Math.PI * 2);
    ctx.clip();
  } else {
    ctx.fillRect(center - insetSize / 2, center - insetSize / 2, insetSize, insetSize);
  }

  ctx.drawImage(logo.image, center - size / 2, center - size / 2, size, size);
  ctx.restore();
}

const VIEW_BOX_PATTERN = /viewBox="0 0 ([\d.]+) ([\d.]+)"/;

/**
 * Injects a logo into a raw QR SVG string. `qrcode`'s SVG output has no native image
 * embedding, so this splices in a background shape + <image> before the closing tag.
 * Coordinates are in QR module units (the same space as the SVG's own viewBox), not
 * pixels — confirmed by inspecting `qrcode`'s actual output: no width/height attribute,
 * only `viewBox="0 0 N N"` where N is the module count including margin.
 */
function injectLogoIntoSvg(svg: string, logo: LogoOptions): string {
  const match = svg.match(VIEW_BOX_PATTERN);
  if (!match) return svg; // Unexpected output shape — skip the logo rather than emit a broken SVG.

  const width = Number(match[1]);
  const height = Number(match[2]);
  const cx = width / 2;
  const cy = height / 2;
  const size = width * clampLogoSizeRatio(logo.sizeRatio);
  const insetSize = size * 1.15;

  const background =
    logo.shape === "circle"
      ? `<circle cx="${cx}" cy="${cy}" r="${insetSize / 2}" fill="#ffffff"/>`
      : `<rect x="${cx - insetSize / 2}" y="${cy - insetSize / 2}" width="${insetSize}" height="${insetSize}" fill="#ffffff"/>`;

  const clipDef =
    logo.shape === "circle"
      ? `<clipPath id="qr-logo-clip"><circle cx="${cx}" cy="${cy}" r="${size / 2}"/></clipPath>`
      : "";
  const clipAttr = logo.shape === "circle" ? ` clip-path="url(#qr-logo-clip)"` : "";

  // logo.dataUrl is a base64 PNG we generated ourselves (see cropLogoToSquare.ts) —
  // never raw user bytes/markup — so it's safe to splice directly into the attribute.
  const image = `<image href="${logo.dataUrl}" xlink:href="${logo.dataUrl}" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"${clipAttr}/>`;

  const injected = `<g>${clipDef}${background}${image}</g>`;

  // xlink:href needs its namespace declared for strict XML/SVG parsers, even though
  // bare `href` alone (SVG2) is enough for modern browsers.
  const withXlinkNs = svg.includes("xmlns:xlink")
    ? svg
    : svg.replace("<svg ", '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');

  return withXlinkNs.replace(/<\/svg>\s*$/, `${injected}</svg>`);
}

export async function renderQrSvg(
  payload: string,
  options: RenderQrOptions = {},
  logo?: LogoOptions,
) {
  const opts = resolveOptions(options, Boolean(logo));
  const svg = await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
  });

  return logo ? injectLogoIntoSvg(svg, logo) : svg;
}

export async function renderQrPngDataUrl(
  payload: string,
  options: RenderQrOptions = {},
  logo?: LogoOptions,
) {
  const opts = resolveOptions(options, Boolean(logo));

  if (!logo) {
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: opts.errorCorrectionLevel,
      margin: opts.margin,
      scale: opts.scale,
    });
  }

  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, payload, {
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
    scale: opts.scale,
  });
  compositeLogo(canvas, logo);
  return canvas.toDataURL("image/png");
}

export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  payload: string,
  options: RenderQrOptions = {},
  logo?: LogoOptions,
) {
  const opts = resolveOptions(options, Boolean(logo));
  await QRCode.toCanvas(canvas, payload, {
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
    scale: opts.scale,
  });

  if (logo) {
    compositeLogo(canvas, logo);
  }
}
