/** Escape HTML delimiters so CMS text cannot close the JSON-LD script element. */
export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
