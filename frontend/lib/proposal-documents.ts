export interface ProposalDocument {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

/** Ignore malformed legacy attachments instead of crashing the client portal. */
export function normalizeProposalDocuments(value: unknown): ProposalDocument[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): ProposalDocument[] => {
    if (!entry || typeof entry !== "object" || typeof entry.url !== "string") return [];
    try {
      const url = new URL(entry.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      return [{ url: url.href, name: typeof entry.name === "string" && entry.name.trim() ? entry.name : "Attachment" }];
    } catch {
      return [];
    }
  });
}
