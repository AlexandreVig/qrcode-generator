import { z } from "zod";

import type { EncoderDefinition } from "../encoderDefinition";
import { escapeVcardValue, joinCrlf } from "../payloadUtils";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().max(max).optional());

const optionalEmail = (max: number) =>
  z.preprocess(emptyToUndefined, z.email("Enter a valid email").max(max).optional());

const vcardSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(128),

  phone: optionalString(64),
  email: optionalEmail(254),

  company: optionalString(128),
  title: optionalString(128),

  workPhone: optionalString(64),
  fax: optionalString(64),

  street: optionalString(128),
  city: optionalString(128),
  state: optionalString(128),
  zip: optionalString(32),
  country: optionalString(128),

  website: optionalString(2048),
});

export type VCardEncoderInput = z.infer<typeof vcardSchema>;

function nonEmpty(value: string | undefined): value is string {
  return !!value && value.trim().length > 0;
}

export const vcardEncoder: EncoderDefinition<VCardEncoderInput> = {
  id: "vcard",
  title: "Contact",
  description: "Encodes a vCard 3.0 contact.",
  schema: vcardSchema,
  fields: [
    { name: "fullName", label: "Full name", kind: "text" },
    { name: "phone", label: "Phone number", kind: "tel" },
    { name: "email", label: "Email", kind: "email" },
    { name: "company", label: "Company name", kind: "text" },
    { name: "title", label: "Work title", kind: "text" },
    { name: "workPhone", label: "Work phone", kind: "tel" },
    { name: "fax", label: "Fax", kind: "tel" },
    { name: "street", label: "Street", kind: "text" },
    { name: "city", label: "City", kind: "text" },
    { name: "state", label: "State", kind: "text" },
    { name: "zip", label: "Zip", kind: "text" },
    { name: "country", label: "Country", kind: "text" },
    { name: "website", label: "Website", kind: "url" },
  ],
  getInitialValue() {
    return {
      fullName: "",
      phone: "",
      email: "",
      company: "",
      title: "",
      workPhone: "",
      fax: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      website: "",
    };
  },
  encode(input) {
    const lines: string[] = [];
    const e = escapeVcardValue;

    lines.push("BEGIN:VCARD");
    lines.push("VERSION:3.0");

    lines.push(`FN:${e(input.fullName)}`);

    if (nonEmpty(input.company)) lines.push(`ORG:${e(input.company)}`);
    if (nonEmpty(input.title)) lines.push(`TITLE:${e(input.title)}`);

    if (nonEmpty(input.phone)) lines.push(`TEL;TYPE=CELL:${e(input.phone)}`);
    if (nonEmpty(input.workPhone)) lines.push(`TEL;TYPE=WORK:${e(input.workPhone)}`);
    if (nonEmpty(input.fax)) lines.push(`TEL;TYPE=FAX:${e(input.fax)}`);

    if (nonEmpty(input.email)) lines.push(`EMAIL:${e(input.email)}`);

    const hasAddress =
      nonEmpty(input.street) ||
      nonEmpty(input.city) ||
      nonEmpty(input.state) ||
      nonEmpty(input.zip) ||
      nonEmpty(input.country);

    if (hasAddress) {
      // ADR format: PO Box;Extended;Street;City;Region;PostalCode;Country
      // Components are joined with raw `;`; values inside each component are escaped.
      const adr = [
        "",
        "",
        e(input.street ?? ""),
        e(input.city ?? ""),
        e(input.state ?? ""),
        e(input.zip ?? ""),
        e(input.country ?? ""),
      ].join(";");
      lines.push(`ADR;TYPE=WORK:${adr}`);
    }

    if (nonEmpty(input.website)) lines.push(`URL:${e(input.website)}`);

    lines.push("END:VCARD");

    return joinCrlf(lines);
  },
};
