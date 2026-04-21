import type { InferEncoderInput } from "@/domain/qr/encoderDefinition";

import { getEncoder, type EncoderById, type EncoderId } from "./getEncoders";

export type EncodePayloadSuccess<TInput = unknown> = {
  ok: true;
  payload: string;
  input: TInput;
};

export type EncodePayloadFailure = {
  ok: false;
  error: unknown;
};

export type EncodePayloadResult<TInput = unknown> =
  | EncodePayloadSuccess<TInput>
  | EncodePayloadFailure;

export function encodePayload<TId extends EncoderId>(args: {
  encoderId: TId;
  input: unknown;
}): EncodePayloadResult<InferEncoderInput<EncoderById<TId>>> {
  const encoder = getEncoder(args.encoderId);

  const parsed = encoder.schema.safeParse(args.input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }

  return {
    ok: true,
    payload: (encoder as { encode(input: unknown): string }).encode(parsed.data),
    input: parsed.data as InferEncoderInput<EncoderById<TId>>,
  };
}
