import { useMemo, useRef, useState } from "react";

import type { DecodedLogoSource } from "@/infrastructure/image/decodeLogoImage";
import type { CropRect } from "@/infrastructure/image/cropLogoToSquare";
import type { QrLogoShape } from "@/infrastructure/qr/renderQr";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// FRAME_SIZE is the actual crop selection (what ends up in the QR). VIEWPORT_SIZE is
// the larger visible container around it, so the parts of the image outside the crop
// stay visible (dimmed) instead of being hidden — the user can see what they're
// excluding, not just what they're including.
const FRAME_SIZE = 220;
const VIEWPORT_SIZE = 320;
const MAX_ZOOM_MULTIPLIER = 4;

type LogoCropperProps = {
  source: DecodedLogoSource;
  shape: QrLogoShape;
  onConfirm(crop: CropRect): void;
  onCancel(): void;
};

// The smallest zoom that still lets the image fully cover the crop frame (no empty
// space in the selection). This varies per image — a 3000px photo and a 64px icon
// need very different minimum zooms — so it can never be a fixed constant.
function minZoomFor(source: DecodedLogoSource): number {
  return Math.max(FRAME_SIZE / source.width, FRAME_SIZE / source.height);
}

function clampPan(pan: number, zoom: number, sourceSize: number): number {
  const maxPan = Math.max(0, (sourceSize * zoom) / 2 - FRAME_SIZE / 2);
  return Math.min(maxPan, Math.max(-maxPan, pan));
}

export function LogoCropper({ source, shape, onConfirm, onCancel }: LogoCropperProps) {
  const [zoom, setZoom] = useState(() => minZoomFor(source));
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  // Reset zoom/pan when a new source arrives (e.g. re-opening the cropper for another
  // upload) — adjusting state during render per React's guidance, so it isn't a
  // setState-in-effect cascade.
  const [trackedSource, setTrackedSource] = useState(source);
  if (source !== trackedSource) {
    setTrackedSource(source);
    setZoom(minZoomFor(source));
    setPan({ x: 0, y: 0 });
  }

  const minZoom = useMemo(() => minZoomFor(source), [source]);
  const maxZoom = minZoom * MAX_ZOOM_MULTIPLIER;

  // Pure derivation from `source` (draws once to get a stable <img> src) — a useMemo,
  // not an effect, since there's no external system to synchronize with here.
  const previewSrc = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext("2d")?.drawImage(source.source, 0, 0);
    return canvas.toDataURL("image/png");
  }, [source]);

  const maskClassName = useMemo(
    () => (shape === "circle" ? "rounded-full" : "rounded-none"),
    [shape],
  );

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({
      x: clampPan(dragState.current.panX + dx, zoom, source.width),
      y: clampPan(dragState.current.panY + dy, zoom, source.height),
    });
  }

  function onPointerUp() {
    dragState.current = null;
  }

  function handleZoomChange(next: number) {
    setZoom(next);
    setPan((prev) => ({
      x: clampPan(prev.x, next, source.width),
      y: clampPan(prev.y, next, source.height),
    }));
  }

  function handleConfirm() {
    const size = FRAME_SIZE / zoom;
    const rawX = source.width / 2 - (FRAME_SIZE / 2 + pan.x) / zoom;
    const rawY = source.height / 2 - (FRAME_SIZE / 2 + pan.y) / zoom;
    onConfirm({
      x: Math.min(Math.max(rawX, 0), source.width - size),
      y: Math.min(Math.max(rawY, 0), source.height - size),
      size,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative overflow-hidden border-2 bg-muted touch-none select-none"
        style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt=""
            draggable={false}
            className="absolute top-1/2 left-1/2 max-w-none"
            style={{
              width: source.width,
              height: source.height,
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          />
        ) : null}

        {/* Dims everything outside the crop frame, leaving the frame itself clear —
            a "spotlight" made by extending this element's own shadow past the
            viewport's clipped edges. */}
        <div
          className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] border-2 border-primary ${maskClassName}`}
          style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
        />
      </div>

      <div className="w-full max-w-xs flex items-center gap-3">
        <span className="text-sm font-head shrink-0">Zoom</span>
        <Slider
          min={minZoom}
          max={maxZoom}
          step={(maxZoom - minZoom) / 100}
          value={[zoom]}
          onValueChange={(next) => handleZoomChange(Array.isArray(next) ? next[0] : next)}
          aria-label="Zoom"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={handleConfirm}>
          Use this logo
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
