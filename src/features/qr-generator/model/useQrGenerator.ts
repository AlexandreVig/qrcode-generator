import { useEffect, useMemo, useRef, useState } from "react";

import { listEncoders } from "@/application/qr/getEncoders";
import type { EncoderId } from "@/application/qr/getEncoders";
import { encodePayload } from "@/application/qr/encodePayload";
import {
  renderQrPngDataUrl,
  renderQrSvg,
  renderQrToCanvas,
} from "@/infrastructure/qr/renderQr";

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

    renderQrToCanvas(canvas, payload).catch(() => {
      // Keep UI stable if QR rendering fails (e.g. payload too large).
    });
  }, [payload]);

  async function downloadPng() {
    if (!payload) return;
    const dataUrl = await renderQrPngDataUrl(payload);
    triggerDownload(dataUrl, "qr-code.png");
  }

  async function downloadSvg() {
    if (!payload) return;
    const svg = await renderQrSvg(payload);
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
  };
}
