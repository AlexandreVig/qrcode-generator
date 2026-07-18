import { useRef, useState } from "react";

import type { DecodedLogoSource } from "@/infrastructure/image/decodeLogoImage";
import type { CropRect } from "@/infrastructure/image/cropLogoToSquare";
import { MAX_LOGO_SIZE_RATIO, MIN_LOGO_SIZE_RATIO, type QrLogoShape } from "@/infrastructure/qr/renderQr";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { LogoCropper } from "./LogoCropper";

type LogoUploadPanelProps = {
  hasLogo: boolean;
  logoThumbnailDataUrl: string | null;
  logoSizeRatio: number;
  setLogoSizeRatio(ratio: number): void;
  logoShape: QrLogoShape;
  setLogoShape(shape: QrLogoShape): void;
  logoError: string | null;
  logoLoading: boolean;
  pendingLogoSource: DecodedLogoSource | null;
  selectLogoFile(file: File): void;
  confirmLogoCrop(crop: CropRect): void;
  cancelLogoCrop(): void;
  editLogoCrop(): void;
  removeLogo(): void;
  scannabilityWarning: string | null;
};

const ERROR_ID = "logo-upload-error";

export function LogoUploadPanel({
  hasLogo,
  logoThumbnailDataUrl,
  logoSizeRatio,
  setLogoSizeRatio,
  logoShape,
  setLogoShape,
  logoError,
  logoLoading,
  pendingLogoSource,
  selectLogoFile,
  confirmLogoCrop,
  cancelLogoCrop,
  editLogoCrop,
  removeLogo,
  scannabilityWarning,
}: LogoUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectLogoFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectLogoFile(file);
  }

  return (
    <Accordion className="w-full mt-4">
      <AccordionItem value="logo">
        <AccordionTrigger>Add a logo</AccordionTrigger>
        <AccordionContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {pendingLogoSource ? (
            <LogoCropper
              source={pendingLogoSource}
              shape={logoShape}
              onConfirm={confirmLogoCrop}
              onCancel={cancelLogoCrop}
            />
          ) : hasLogo ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {logoThumbnailDataUrl ? (
                  <img
                    src={logoThumbnailDataUrl}
                    alt="Logo preview"
                    className="w-12 h-12 border-2 object-cover"
                  />
                ) : null}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={editLogoCrop}>
                    Edit crop
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={removeLogo}>
                    Remove
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-head shrink-0">Size</span>
                <Slider
                  min={MIN_LOGO_SIZE_RATIO}
                  max={MAX_LOGO_SIZE_RATIO}
                  step={0.01}
                  value={[logoSizeRatio]}
                  onValueChange={(next) =>
                    setLogoSizeRatio(Array.isArray(next) ? next[0] : next)
                  }
                  aria-label="Logo size"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="logo-shape-circle"
                  checked={logoShape === "circle"}
                  onCheckedChange={(checked) => setLogoShape(checked ? "circle" : "square")}
                />
                <label htmlFor="logo-shape-circle" className="text-sm font-head font-medium">
                  Circle logo
                </label>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center gap-2 border-2 border-dashed rounded p-6 text-center transition-colors ${
                isDraggingOver ? "bg-accent" : ""
              }`}
            >
              <p className="text-sm text-muted-foreground">
                Drag and drop an image, or
              </p>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoLoading}
                aria-invalid={Boolean(logoError)}
                aria-describedby={logoError ? ERROR_ID : undefined}
              >
                {logoLoading ? "Processing…" : "Upload logo"}
              </Button>
            </div>
          )}

          {logoError ? (
            <p id={ERROR_ID} className="text-sm text-destructive mt-2">
              {logoError}
            </p>
          ) : null}

          {scannabilityWarning ? (
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
              {scannabilityWarning}
            </p>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
