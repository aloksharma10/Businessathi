"use server";

import prisma from "@/lib/db";
import * as XLSX from "xlsx";
import { endOfDay, format, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export type EntryKind = "gst" | "local";
export type ProductLineInput = { productId: string; qty: number };

function mergeProductLines(lines: ProductLineInput[]): ProductLineInput[] {
  const m = new Map<string, number>();
  for (const l of lines) {
    const id = l.productId;
    if (!id) continue;
    m.set(id, (m.get(id) ?? 0) + Math.max(1, Math.floor(l.qty) || 1));
  }
  return [...m.entries()].map(([productId, qty]) => ({ productId, qty }));
}

function parseEntryLines(entry: {
  productLines: Prisma.JsonValue | null;
  productIds: string[];
}): ProductLineInput[] {
  const raw = entry.productLines as unknown;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((r: { productId?: string; qty?: number }) => ({
      productId: String(r.productId ?? ""),
      qty: Math.max(1, Math.floor(Number(r.qty)) || 1),
    }));
  }
  if (entry.productIds?.length) {
    return entry.productIds.map((productId) => ({
      productId,
      qty: 1,
    }));
  }
  return [];
}

function rowKind(e: {
  kind: string | null;
  localCustomerId: string | null;
}): EntryKind {
  if (e.kind === "local" || e.localCustomerId) return "local";
  return "gst";
}

/** Default lines from the most recent saved entry for this customer (same kind). */
export async function getLinesFromLastCustomerProductEntry(
  userId: string,
  kind: EntryKind,
  customerId: string
): Promise<ProductLineInput[]> {
  const where: Prisma.CustomerProductEntryWhereInput =
    kind === "gst"
      ? {
          userId,
          customerId,
        }
      : {
          userId,
          kind: "local",
          localCustomerId: customerId,
        };

  const lastEntry = await prisma.customerProductEntry.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });
  if (!lastEntry) return [];
  return parseEntryLines(lastEntry);
}

export async function createCustomerProductEntry(
  userId: string,
  params: {
    kind: EntryKind;
    customerId: string;
    productLines: ProductLineInput[];
    entryDate: Date;
    notes?: string | null;
  }
) {
  const lines = mergeProductLines(
    params.productLines.map((l) => ({
      productId: l.productId,
      qty: Math.max(1, Math.floor(l.qty) || 1),
    }))
  ).filter((l) => l.productId);

  const uniqueIds = [...new Set(lines.map((l) => l.productId))];
  if (!uniqueIds.length) {
    throw new Error("Select at least one product.");
  }

  if (params.kind === "gst") {
    const customer = await prisma.customer.findFirst({
      where: { id: params.customerId, userId },
    });
    if (!customer) {
      throw new Error("Customer not found.");
    }
    const products = await prisma.product.findMany({
      where: { userId, id: { in: uniqueIds } },
      select: { id: true },
    });
    if (products.length !== uniqueIds.length) {
      throw new Error("One or more products are invalid.");
    }
    await prisma.customerProductEntry.create({
      data: {
        userId,
        kind: "gst",
        customerId: params.customerId,
        localCustomerId: null,
        productIds: uniqueIds,
        productLines: lines as unknown as Prisma.InputJsonValue,
        entryDate: params.entryDate,
        notes: params.notes?.trim() || null,
      },
    });
  } else {
    const customer = await prisma.localCustomer.findFirst({
      where: { id: params.customerId, userId },
    });
    if (!customer) {
      throw new Error("Customer not found.");
    }
    const products = await prisma.localProduct.findMany({
      where: { userId, id: { in: uniqueIds } },
      select: { id: true },
    });
    if (products.length !== uniqueIds.length) {
      throw new Error("One or more products are invalid.");
    }
    await prisma.customerProductEntry.create({
      data: {
        userId,
        kind: "local",
        customerId: null,
        localCustomerId: params.customerId,
        productIds: uniqueIds,
        productLines: lines as unknown as Prisma.InputJsonValue,
        entryDate: params.entryDate,
        notes: params.notes?.trim() || null,
      },
    });
  }

  revalidatePath("/customer-product-entries");
  revalidatePath("/gst/customer-product-entries");
}

export interface ListCustomerProductEntriesParams {
  userId: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export type CustomerProductEntryListRow = {
  id: string;
  kind: EntryKind;
  createdAt: Date;
  entryDate: Date | null;
  notes: string | null;
  customerName: string;
  productLines: ProductLineInput[];
  productNames: string;
};

export async function listCustomerProductEntries(
  params: ListCustomerProductEntriesParams
): Promise<{
  rows: CustomerProductEntryListRow[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}> {
  const {
    userId,
    customerId,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 15,
  } = params;

  const dateRange =
    dateFrom || dateTo
      ? {
          gte: dateFrom ? startOfDay(dateFrom) : undefined,
          lte: dateTo ? endOfDay(dateTo) : undefined,
        }
      : null;

  const where: Prisma.CustomerProductEntryWhereInput = {
    userId,
    ...(customerId
      ? {
          OR: [{ customerId }, { localCustomerId: customerId }],
        }
      : {}),
    ...(dateRange
      ? {
          OR: [
            {
              AND: [
                { entryDate: { not: null } },
                {
                  entryDate: {
                    ...(dateRange.gte ? { gte: dateRange.gte } : {}),
                    ...(dateRange.lte ? { lte: dateRange.lte } : {}),
                  },
                },
              ],
            },
            {
              AND: [
                { entryDate: null },
                {
                  createdAt: {
                    ...(dateRange.gte ? { gte: dateRange.gte } : {}),
                    ...(dateRange.lte ? { lte: dateRange.lte } : {}),
                  },
                },
              ],
            },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * pageSize;

  const [entries, totalCount] = await Promise.all([
    prisma.customerProductEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        customer: { select: { id: true, customerName: true } },
        localCustomer: { select: { id: true, customerName: true } },
      },
    }),
    prisma.customerProductEntry.count({ where }),
  ]);

  const gstProductIds = new Set<string>();
  const localProductIds = new Set<string>();
  for (const e of entries) {
    const lines = parseEntryLines(e);
    const k = rowKind(e);
    for (const l of lines) {
      if (k === "local") localProductIds.add(l.productId);
      else gstProductIds.add(l.productId);
    }
  }

  const [gstProducts, localProducts] = await Promise.all([
    gstProductIds.size === 0
      ? []
      : prisma.product.findMany({
          where: { userId, id: { in: [...gstProductIds] } },
          select: { id: true, productName: true },
        }),
    localProductIds.size === 0
      ? []
      : prisma.localProduct.findMany({
          where: { userId, id: { in: [...localProductIds] } },
          select: { id: true, productName: true },
        }),
  ]);

  const gstNameById = Object.fromEntries(
    gstProducts.map((p) => [p.id, p.productName])
  );
  const localNameById = Object.fromEntries(
    localProducts.map((p) => [p.id, p.productName])
  );

  const rows: CustomerProductEntryListRow[] = entries.map((e) => {
    const k = rowKind(e);
    const lines = parseEntryLines(e);
    const nameById = k === "local" ? localNameById : gstNameById;
    const productNames = lines
      .map((l) => {
        const name = nameById[l.productId] ?? l.productId;
        return `${name} × ${l.qty}`;
      })
      .join(", ");
    const customerName =
      k === "local"
        ? e.localCustomer?.customerName ?? "—"
        : e.customer?.customerName ?? "—";

    return {
      id: e.id,
      kind: k,
      createdAt: e.createdAt,
      entryDate: e.entryDate,
      notes: e.notes,
      customerName,
      productLines: lines,
      productNames,
    };
  });

  return {
    rows,
    totalCount,
    pageCount: Math.ceil(totalCount / pageSize) || 1,
    currentPage: page,
  };
}

export interface CustomerProductEntryExportParams {
  userId: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function exportCustomerProductEntriesToXLSX(
  params: CustomerProductEntryExportParams
) {
  const dateFrom = params.dateFrom
    ? new Date(params.dateFrom)
    : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

  const { rows } = await listCustomerProductEntries({
    userId: params.userId,
    customerId: params.customerId,
    dateFrom,
    dateTo,
    page: 1,
    pageSize: 100000,
  });

  if (rows.length === 0) {
    throw new Error("No entries found for export.");
  }

  const exportData = rows.map((r) => ({
    Type: r.kind === "gst" ? "GST" : "General",
    "Entry Date": format(r.entryDate ?? r.createdAt, "dd/MM/yyyy HH:mm"),
    "Customer Name": r.customerName,
    Products: r.productNames,
    Notes: r.notes ?? "",
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 20 },
    { wch: 28 },
    { wch: 50 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const filename = `customer_product_entries_${timestamp}.xlsx`;

  return {
    buffer,
    filename,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
