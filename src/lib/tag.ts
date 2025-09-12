// Client-safe tag utilities used across server and client.

export function normalizeTag(input: string): string {
  const lower = (input || "").toLowerCase();
  const collapsed = lower.trim().replace(/\s+/g, "-");
  return collapsed
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");
}

export function isValidTag(tag: string): boolean {
  if (!tag) return false;
  if (tag.length < 3 || tag.length > 30) return false;
  return /^[a-z0-9._-]+$/.test(tag);
}

export function suggestTagFrom(displayName?: string | null, email?: string | null): string | null {
  const namePart = (displayName || "").trim() || (email || "").split("@")[0] || "";
  const base = normalizeTag(namePart);
  return base || null;
}

