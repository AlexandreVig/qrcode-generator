import { listEncoders } from "@/application/qr/getEncoders";
import type { EncoderId } from "@/application/qr/getEncoders";

import { Card } from "@/components/retroui/Card";
import { Tabs } from "@/components/retroui/Tabs";
import { Text } from "@/components/retroui/Text";

import { useQrGenerator } from "../model/useQrGenerator";
import { EncoderPanel } from "./EncoderPanel";
import { Footer } from "./Footer";
import { QrPreviewCard } from "./QrPreviewCard";

export function QrGenerator() {
  const encoders = listEncoders();

  const {
    activeEncoderId,
    setActiveEncoderId,

    getEncoderInput,
    setEncoderInput,

    payload,
    fieldErrors,
    shouldShowError,

    canvasRef,

    downloadJpg,
    downloadPng,
    downloadSvg,
  } = useQrGenerator();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto px-4 pt-8 sm:pt-12 md:pt-16 pb-4 sm:pb-6 text-center flex-1">
      <Text as="h1" className="text-3xl sm:text-4xl lg:text-5xl">
        <span>Create your</span>
        <span className="bg-primary px-2 py-2 mx-1 -rotate-3 inline-block">
          QR Code
        </span>
        <span className="inline-block -rotate-12">🖐️</span>
      </Text>

      <div className="my-8 sm:my-12 md:my-16 flex justify-center items-start flex-col md:flex-row gap-6 md:gap-8">
        <Card className="w-full max-w-xl text-left">
          <Card.Content className="grid p-4 sm:p-6">
            <Tabs
              className="w-full"
              value={activeEncoderId}
              onValueChange={(next) => setActiveEncoderId(next as EncoderId)}
            >
              <Tabs.List
                aria-label="QR code input type"
                className="flex-wrap gap-2 space-x-0"
              >
                {encoders.map((encoder) => (
                  <Tabs.Trigger key={encoder.id} value={encoder.id}>
                    {encoder.title}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <Tabs.Panels>
                {encoders.map((encoder) => (
                  <EncoderPanel
                    key={encoder.id}
                    encoder={encoder}
                    value={getEncoderInput(encoder.id)}
                    onChange={(next) => setEncoderInput(encoder.id, next)}
                    fieldErrors={
                      shouldShowError && encoder.id === activeEncoderId
                        ? fieldErrors
                        : undefined
                    }
                  />
                ))}
              </Tabs.Panels>
            </Tabs>
          </Card.Content>
        </Card>

        <div className="w-full md:w-auto flex justify-center">
          <QrPreviewCard
            canvasRef={canvasRef}
            payload={payload}
            onDownloadJpg={downloadJpg}
            onDownloadPng={downloadPng}
            onDownloadSvg={downloadSvg}
          />
        </div>
      </div>
      </main>

      <Footer />
    </div>
  );
}
