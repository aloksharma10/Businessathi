import { NextResponse } from "next/server";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * Reads `?id=` (single) or repeated `?ids=` (bulk) from the download URL,
 * keeping request order, dropping duplicates and anything that is not a
 * MongoDB ObjectId (Prisma would otherwise throw on the query).
 */
export function requestedInvoiceIds(searchParams: URLSearchParams): string[] {
  const single = searchParams.get("id");
  const raw = single ? [single] : searchParams.getAll("ids");
  return [...new Set(raw.filter((id) => OBJECT_ID.test(id)))];
}

/** Re-applies the order the client asked for; `findMany` returns rows unordered. */
export function orderByRequest<T extends { id: string }>(
  ids: string[],
  rows: T[]
): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export function pdfResponse(pdf: Buffer, filename: string): NextResponse {
  const safeName = filename.replace(/[^\w.-]+/g, "_");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
