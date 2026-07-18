import { useEffect, useMemo, useRef, useState } from "react";

import { listEncoders } from "@/application/qr/getEncoders";
import type { EncoderId } from "@/application/qr/getEncoders";
import { encodePayload } from "@/application/qr/encodePayload";
import {
  DEFAULT_LOGO_SIZE_RATIO,
  renderQrPngDataUrl,
  renderQrSvg,
  renderQrToCanvas,
  type LogoOptions,
  type QrLogoShape,
} from "@/infrastructure/qr/renderQr";
import { decodeLogoImage } from "@/infrastructure/image/decodeLogoImage";
import { cropLogoToSquare, type ProcessedLogo } from "@/infrastructure/image/cropLogoToSquare";

const LOGO_ERROR_MESSAGES: Record<string, string> = {
  "unsupported-type": "Please upload a PNG, JPEG, WebP, or SVG image.",
  "too-large": "That image is too large — please use a file under 5MB.",
  "decode-failed": "That file couldn't be read as an image.",
};

type EncoderInputValue = Record<string, unknown>;

const initialInputsByEncoderId = (() => {
  const entries = listEncoders().map((encoder) => [
    encoder.id,
    encoder.getInitialValue() as unknown as EncoderInputValue,
  ]);
  return Object.fromEntries(entries) as Record<EncoderId, EncoderInputValue>;
})();

function formatEncodeError(error: unknown): string {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues?: Array<{ message?: string }> }).issues;
    const first = issues?.find((i) => typeof i.message === "string")?.message;
    if (first) return first;
  }
  return "Please check the form fields.";
}

type FieldErrors = Record<string, string>;

function getFieldErrors(error: unknown): FieldErrors {
  if (!error || typeof error !== "object" || !("issues" in error)) return {};

  const issues = (error as {
    issues?: Array<{ path?: unknown; message?: unknown }>;
  }).issues;

  if (!Array.isArray(issues)) return {};

  const fieldErrors: FieldErrors = {};
  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;

    const path = (issue as { path?: unknown }).path;
    const message = (issue as { message?: unknown }).message;
    if (typeof message !== "string" || !message) continue;

    if (Array.isArray(path) && typeof path[0] === "string") {
      const fieldName = path[0];
      if (!fieldErrors[fieldName]) fieldErrors[fieldName] = message;
    }
  }

  return fieldErrors;
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function useQrGenerator() {
  const [activeEncoderId, setActiveEncoderId] = useState<EncoderId>("text");

  const [inputsByEncoderId, setInputsByEncoderId] = useState<
    Record<EncoderId, EncoderInputValue>
  >(() => ({ ...initialInputsByEncoderId }));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [logo, setLogo] = useState<ProcessedLogo | null>(null);
  const [logoSizeRatio, setLogoSizeRatio] = useState(DEFAULT_LOGO_SIZE_RATIO);
  const [logoShape, setLogoShape] = useState<QrLogoShape>("square");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);

  const logoOptions: LogoOptions | undefined = useMemo(
    () =>
      logo
        ? { image: logo.bitmap, dataUrl: logo.dataUrl, sizeRatio: logoSizeRatio, shape: logoShape }
        : undefined,
    [logo, logoSizeRatio, logoShape],
  );

  // Step-2 stand-in for the interactive cropper (built in a later step): decode the
  // upload and auto-center-crop it to a square, same behavior the app had before any
  // crop UI existed. This lets the render pipeline be verified end-to-end first.
  async function uploadLogo(file: File) {
    setLogoLoading(true);
    setLogoError(null);
    const result = await decodeLogoImage(file);
    if (!result.ok) {
      setLogoLoading(false);
      setLogoError(LOGO_ERROR_MESSAGES[result.error] ?? "Something went wrong with that image.");
      return;
    }

    const { width, height } = result.logo;
    const side = Math.min(width, height);
    const cropped = await cropLogoToSquare(result.logo, {
      x: (width - side) / 2,
      y: (height - side) / 2,
      size: side,
    });
    setLogoLoading(false);
    setLogo(cropped);
  }

  function removeLogo() {
    setLogo(null);
    setLogoError(null);
  }

  function getEncoderInput(id: EncoderId): EncoderInputValue {
    return inputsByEncoderId[id];
  }

  function setEncoderInput(id: EncoderId, next: EncoderInputValue) {
    setInputsByEncoderId((prev) => ({ ...prev, [id]: next }));
  }

  const currentInput = getEncoderInput(activeEncoderId);

  const encodeResult = useMemo(
    () => encodePayload({ encoderId: activeEncoderId, input: currentInput }),
    [activeEncoderId, currentInput],
  );

  const payload = encodeResult.ok ? encodeResult.payload : "";
  const errorMessage = encodeResult.ok
    ? null
    : formatEncodeError(encodeResult.error);

  const fieldErrors = useMemo(
    () => (encodeResult.ok ? {} : getFieldErrors(encodeResult.error)),
    [encodeResult],
  );

  const shouldShowError = useMemo(() => {
    if (!errorMessage) return false;

    const initial = initialInputsByEncoderId[activeEncoderId];
    const current = currentInput;

    const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);
    for (const key of keys) {
      const currentValue = current[key];
      const initialValue = initial[key];

      if (typeof currentValue === "string") {
        if (currentValue.trim().length > 0) return true;
        continue;
      }

      if (typeof currentValue === "boolean") {
        if (currentValue !== Boolean(initialValue)) return true;
        continue;
      }

      if (currentValue !== initialValue) return true;
    }

    return false;
  }, [
    activeEncoderId,
    errorMessage,
    currentInput,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!payload) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    renderQrToCanvas(canvas, payload, undefined, logoOptions).catch(() => {
      // Keep UI stable if QR rendering fails (e.g. payload too large).
    });
  }, [payload, logoOptions]);

  async function downloadPng() {
    if (!payload) return;
    const dataUrl = await renderQrPngDataUrl(payload, undefined, logoOptions);
    triggerDownload(dataUrl, "qr-code.png");
  }

  async function downloadSvg() {
    if (!payload) return;
    const svg = await renderQrSvg(payload, undefined, logoOptions);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "qr-code.svg");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function downloadJpg() {
    const canvas = canvasRef.current;
    if (!payload || !canvas) return;

    // JPEG has no alpha channel — composite on explicit white so any transparent
    // pixels from the source canvas don't render as black.
    const flattened = document.createElement("canvas");
    flattened.width = canvas.width;
    flattened.height = canvas.height;
    const ctx = flattened.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, flattened.width, flattened.height);
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = flattened.toDataURL("image/jpeg", 0.92);
    triggerDownload(dataUrl, "qr-code.jpg");
  }

  return {
    activeEncoderId,
    setActiveEncoderId,

    getEncoderInput,
    setEncoderInput,

    payload,
    errorMessage,
    fieldErrors,
    shouldShowError,

    canvasRef,

    downloadJpg,
    downloadPng,
    downloadSvg,

    hasLogo: logo !== null,
    logoThumbnailDataUrl: logo?.dataUrl ?? null,
    logoSizeRatio,
    setLogoSizeRatio,
    logoShape,
    setLogoShape,
    logoError,
    logoLoading,
    uploadLogo,
    removeLogo,
  };
}
