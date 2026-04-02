import { toZonedTime } from "date-fns-tz";

/**
 * Indian financial year label for a calendar date (FY April–March).
 * Uses Asia/Kolkata so April 1 in India maps to the new FY (e.g. Apr 2026 → "26-27").
 */
export function getIndianFinancialYearLabel(date: Date): string {
  const local = toZonedTime(date, "Asia/Kolkata");
  const y = local.getFullYear();
  const m = local.getMonth();
  const startYear = m >= 3 ? y : y - 1;
  const start2 = startYear % 100;
  const end2 = (startYear + 1) % 100;
  return `${String(start2).padStart(2, "0")}-${String(end2).padStart(2, "0")}`;
}

const PREFIX_MAX = 8;

/** Allow A–Z, 0–9 for invoice prefix segment */
export function normalizeInvoicePrefix(raw: string): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, PREFIX_MAX);
  return cleaned;
}

/**
 * Short code from company name, e.g. "Acme Corp Name" → "ACN" (up to 4 chars from word initials).
 */
export function defaultPrefixFromCompanyName(
  companyName: string | null | undefined
): string {
  if (!companyName?.trim()) return "INV";
  const words = companyName
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length >= 2) {
    const initials = words
      .slice(0, 4)
      .map((w) => w[0])
      .join("");
    const n = normalizeInvoicePrefix(initials);
    if (n.length >= 2) return n.slice(0, Math.min(4, PREFIX_MAX));
  }
  const compact = companyName.replace(/[^a-zA-Z0-9]/g, "");
  const n = normalizeInvoicePrefix(compact);
  return n.length > 0 ? n.slice(0, Math.min(4, PREFIX_MAX)) : "INV";
}

export function resolveGstInvoicePrefix(
  companyName: string | null | undefined,
  gstInvoicePrefix: string | null | undefined
): string {
  const explicit = gstInvoicePrefix?.trim();
  if (explicit) {
    const n = normalizeInvoicePrefix(explicit);
    if (n.length > 0) return n;
  }
  return defaultPrefixFromCompanyName(companyName);
}

export function buildGstInvoiceNo(
  prefix: string,
  fyLabel: string,
  serial: number,
  serialPad = 4
): string {
  const p = normalizeInvoicePrefix(prefix);
  const serialPart = Math.max(0, Math.floor(serial))
    .toString()
    .padStart(serialPad, "0");
  return `${p}/${fyLabel}/${serialPart}`;
}

const GST_INVOICE_PATTERN =
  /^([A-Z0-9]{1,8})\/(\d{2}-\d{2})\/(\d+)$/;

export function parseStructuredGstInvoiceNo(
  invoiceNo: string
): { prefix: string; fy: string; serial: number } | null {
  const m = invoiceNo.trim().match(GST_INVOICE_PATTERN);
  if (!m) return null;
  return {
    prefix: m[1],
    fy: m[2],
    serial: parseInt(m[3], 10),
  };
}

export function maxSerialForPrefixAndFy(
  invoiceNos: string[],
  prefix: string,
  fyLabel: string
): number {
  const p = normalizeInvoicePrefix(prefix);
  let max = 0;
  for (const no of invoiceNos) {
    const parsed = parseStructuredGstInvoiceNo(no);
    if (
      parsed &&
      parsed.prefix === p &&
      parsed.fy === fyLabel
    ) {
      max = Math.max(max, parsed.serial);
    }
  }
  return max;
}
