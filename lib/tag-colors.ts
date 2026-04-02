import type { CSSProperties } from "react";

/** Same normalization as tags in the app (stable key for hashing). */
export function normalizeTagForColor(tag: string): string {
  return tag.trim().toUpperCase();
}

/** FNV-1a 32-bit hash → hue 0..359. Same string ⇒ same hue on every device. */
function fnv1a32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hueFromTag(tag: string): number {
  return fnv1a32(normalizeTagForColor(tag)) % 360;
}

export function tagHueStyle(hue: number): CSSProperties {
  return { "--tag-h": hue } as CSSProperties;
}
