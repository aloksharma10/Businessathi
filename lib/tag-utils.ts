/** Normalize comma/semicolon-separated tags or string arrays to uppercase trimmed tokens (deduped). */
export function normalizeTags(input: unknown): string[] {
  const seen = new Set<string>();
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const t of input) {
      const n = String(t).trim().toUpperCase();
      if (n && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  }
  if (typeof input === "string") {
    const out: string[] = [];
    for (const part of input.split(/[,;]/)) {
      const n = part.trim().toUpperCase();
      if (n && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
    return out;
  }
  return [];
}

export function tagsToInputString(tags: string[] | undefined | null): string {
  if (!tags?.length) return "";
  return tags.join(", ");
}
