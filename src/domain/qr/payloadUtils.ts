/**
 * QR payload helpers.
 * Keep this file dependency-free so encoders remain easy to test.
 */

/**
 * Many formats (notably vCard) scan more reliably with CRLF newlines.
 */
export function joinCrlf(lines: ReadonlyArray<string>): string {
  return lines.join("\r\n");
}

/**
 * Normalize plain text for QR payloads.
 * - Ensures the input is a string
 * - Preserves user content (no trimming by default)
 */
export function normalizeTextPayload(text: string): string {
  return String(text);
}

/**
 * Normalizes a URL so scanners interpret it reliably.
 * - Trims whitespace
 * - Adds https:// if missing a scheme
 */
export function normalizeUrlPayload(rawUrl: string): string {
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return "";

  try {
    // Already a valid absolute URL.
    new URL(trimmed);
    return trimmed;
  } catch {
    const withScheme = `https://${trimmed}`;
    try {
      new URL(withScheme);
      return withScheme;
    } catch {
      // Leave validation to the encoder schema.
      return trimmed;
    }
  }
}

/**
 * Escapes special characters for the Wi-Fi QR format.
 * Commonly escaped: backslash, semicolon, comma, colon, double quote.
 */
export function escapeWifiValue(value: string): string {
  return String(value).replace(/[\\;,:"]/g, (match) => `\\${match}`);
}

/**
 * Escapes special characters for vCard 3.0 property values (RFC 2426).
 * Order matters: backslash must be escaped first.
 */
export function escapeVcardValue(value: string): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
