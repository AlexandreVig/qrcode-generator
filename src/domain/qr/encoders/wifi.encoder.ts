import { z } from "zod";

import type { EncoderDefinition } from "../encoderDefinition";
import { escapeWifiValue } from "../payloadUtils";

const wifiSchema = z
  .object({
    ssid: z.string().min(1, "Network name (SSID) is required").max(64),
    hidden: z.boolean().default(false),
    encryption: z.enum(["none", "wpa", "wep"]).default("wpa"),
    password: z.string().max(128).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.encryption !== "none" && !value.password?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password is required for WPA/WEP",
      });
    }
  });

export type WifiEncoderInput = z.infer<typeof wifiSchema>;

export const wifiEncoder: EncoderDefinition<WifiEncoderInput> = {
  id: "wifi",
  title: "Wi‑Fi",
  description: "Encodes Wi‑Fi network credentials.",
  schema: wifiSchema,
  fields: [
    { name: "ssid", label: "Network name", kind: "text", placeholder: "SSID" },
    {
      name: "encryption",
      label: "Encryption",
      kind: "select",
      options: [
        { label: "None", value: "none" },
        { label: "WPA/WPA2", value: "wpa" },
        { label: "WEP", value: "wep" },
      ],
    },
    { name: "password", label: "Password", kind: "password", placeholder: "Password" },
    { name: "hidden", label: "Hidden", kind: "checkbox", checkboxLabel: "Hidden" },
  ],
  getInitialValue() {
    return { ssid: "", hidden: false, encryption: "wpa", password: "" };
  },
  encode(input) {
    const ssid = escapeWifiValue(input.ssid);

    const segments: string[] = [];

    if (input.encryption === "none") {
      // Many scanners expect T:nopass for open networks.
      segments.push("T:nopass", `S:${ssid}`);
    } else {
      const t = input.encryption.toUpperCase();
      const password = escapeWifiValue(input.password ?? "");
      segments.push(`T:${t}`, `S:${ssid}`, `P:${password}`);
    }

    if (input.hidden) segments.push("H:true");

    return `WIFI:${segments.map((s) => `${s};`).join("")};`;
  },
};
