import { useState } from "react";

import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Popover } from "@/components/retroui/Popover";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type QrPreviewCardProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  payload: string;
  onDownloadJpg(): void;
  onDownloadPng(): Promise<void>;
  onDownloadSvg(): Promise<void>;
};

function DownloadFormatMenu({
  disabled,
  onDownloadPng,
  onDownloadSvg,
}: {
  disabled: boolean;
  onDownloadPng(): Promise<void>;
  onDownloadSvg(): Promise<void>;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <Popover.Trigger asChild>
        <Button className="z-20" size="icon" disabled={disabled}>
          {popoverOpen ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Content className="w-fit p-2" align="end">
        <Button
          variant="link"
          onClick={async () => {
            await onDownloadSvg();
            setPopoverOpen(false);
          }}
          disabled={disabled}
        >
          Download SVG
        </Button>
        <Button
          variant="link"
          onClick={async () => {
            await onDownloadPng();
            setPopoverOpen(false);
          }}
          disabled={disabled}
        >
          Download PNG
        </Button>
      </Popover.Content>
    </Popover>
  );
}

export function QrPreviewCard({
  canvasRef,
  payload,
  onDownloadJpg,
  onDownloadPng,
  onDownloadSvg,
}: QrPreviewCardProps) {
  const downloadsDisabled = !payload;

  return (
    <Card className="h-fit w-full max-w-xs sm:max-w-sm">
      <Card.Content>
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            className={`w-full max-w-64 aspect-square h-auto max-h-64 bg-border transition-opacity ${
              payload ? "opacity-100" : "opacity-10"
            }`}
          />
          <div className="flex flex-wrap justify-center items-center gap-2 mb-2 sm:mb-4">
            <Button
              className="z-10"
              onClick={onDownloadJpg}
              disabled={downloadsDisabled}
            >
              Download JPG
            </Button>

            <DownloadFormatMenu
              // Reset popover state when switching between placeholder and real payload.
              key={downloadsDisabled ? "disabled" : "enabled"}
              disabled={downloadsDisabled}
              onDownloadPng={onDownloadPng}
              onDownloadSvg={onDownloadSvg}
            />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
