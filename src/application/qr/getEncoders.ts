import { createEncoderRegistry } from "@/domain/qr/registry";
import { textEncoder, urlEncoder, vcardEncoder, wifiEncoder } from "@/domain/qr/encoders";

export const encoderRegistry = createEncoderRegistry([
  textEncoder,
  urlEncoder,
  vcardEncoder,
  wifiEncoder,
] as const);

export function listEncoders() {
  return encoderRegistry.list();
}

export type EncoderId = ReturnType<typeof listEncoders>[number]["id"];

export type Encoder = ReturnType<typeof listEncoders>[number];

export type EncoderById<TId extends EncoderId> = Extract<Encoder, { id: TId }>;

export function getEncoder<TId extends EncoderId>(id: TId): EncoderById<TId> {
  return encoderRegistry.get(id);
}
