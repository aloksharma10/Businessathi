import { ToWords } from "to-words";

const toWords = new ToWords();

/** Parses the string-typed money fields stored in the DB; NaN/null become 0. */
export const num = (value: string | number | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const fixed2 = (value: string | number | null | undefined): string =>
  num(value).toFixed(2);

export const amountInWords = (
  value: string | number | null | undefined
): string => toWords.convert(num(value), { currency: true });

/** GST state codes are two digits ("07" for Delhi). */
export const stateCode = (code: number | null | undefined): string =>
  code == null ? "" : String(code).padStart(2, "0");

export const text = (value: unknown): string =>
  value == null ? "" : String(value);
