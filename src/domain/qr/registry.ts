import type { EncoderDefinition, EncoderId } from "./encoderDefinition";

export type EncoderRegistry<
  TEncoders extends readonly EncoderDefinition<Record<string, unknown>>[],
> = {
  list(): ReadonlyArray<TEncoders[number]>;
  get<TId extends TEncoders[number]["id"]>(id: TId): Extract<TEncoders[number], { id: TId }>;
  has(id: EncoderId): boolean;
};

export function createEncoderRegistry<
  const TEncoders extends readonly EncoderDefinition<Record<string, unknown>>[],
>(
  encoders: TEncoders,
): EncoderRegistry<TEncoders> {
  const byId = new Map<EncoderId, TEncoders[number]>();

  for (const encoder of encoders) {
    if (byId.has(encoder.id)) {
      throw new Error(`Duplicate encoder id: ${encoder.id}`);
    }
    byId.set(encoder.id, encoder);
  }

  return {
    list() {
      return [...encoders] as unknown as ReadonlyArray<TEncoders[number]>;
    },
    get(id) {
      const encoder = byId.get(id);
      if (!encoder) {
        throw new Error(`Unknown encoder id: ${id}`);
      }
      return encoder as Extract<TEncoders[number], { id: typeof id }>;
    },
    has(id) {
      return byId.has(id);
    },
  };
}
