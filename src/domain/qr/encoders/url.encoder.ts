import { z } from "zod";

import type { EncoderDefinition } from "../encoderDefinition";
import { normalizeUrlPayload } from "../payloadUtils";

const urlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .max(2048, "URL is too long")
    .transform((value) => normalizeUrlPayload(value))
    .refine(
      (value) => {
        try {
          const parsed = new URL(value);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Enter a valid URL" },
    )
    .refine(
      (value) => {
        try {
          const parsed = new URL(value);
          const host = parsed.hostname;
          if (!host) return false;

          // Accept domains with a dot, localhost, or an IP address.
          if (host === "localhost") return true;
          if (host.includes(".")) return true;
          if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
          if (host.includes(":")) return true; // IPv6

          return false;
        } catch {
          return false;
        }
      },
      { message: "Enter a valid URL (e.g. https://example.com)" },
    ),
});

export type UrlEncoderInput = z.infer<typeof urlSchema>;

export const urlEncoder: EncoderDefinition<UrlEncoderInput> = {
  id: "url",
  title: "Website",
  description: "Encodes a URL (http/https).",
  schema: urlSchema,
  fields: [
    {
      name: "url",
      label: "Your website URL",
      kind: "url",
      placeholder: "www.my-website.com/",
    },
  ],
  getInitialValue() {
    return { url: "" };
  },
  encode(input) {
    return input.url;
  },
};
