import { z } from "zod";

import type { EncoderDefinition } from "../encoderDefinition";
import { normalizeTextPayload } from "../payloadUtils";

const textSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    // Keeping an upper bound helps avoid surprising "QR too dense" failures.
    // Adjust later once UI supports version/ECC controls.
    .max(2000, "Text is too long"),
});

export type TextEncoderInput = z.infer<typeof textSchema>;

export const textEncoder: EncoderDefinition<TextEncoderInput> = {
  id: "text",
  title: "Text",
  description: "Encodes plain UTF-8 text.",
  schema: textSchema,
  fields: [
    {
      name: "text",
      label: "Enter your text",
      kind: "textarea",
      placeholder: "type something...",
    },
  ],
  getInitialValue() {
    return { text: "" };
  },
  encode(input) {
    return normalizeTextPayload(input.text);
  },
};
