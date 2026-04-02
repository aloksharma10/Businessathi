"use server";

import prisma from "@/lib/db";
import * as XLSX from "xlsx";
import { endOfDay, format, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export type EntryKind = "gst" | "local" | "plant";
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
  plantCustomerId: string | null;
}): EntryKind {
  if (e.kind === "local" || e.localCustomerId) return "local";
  if (e.kind === "plant" || e.plantCustomerId) return "plant";
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
      : kind === "local"
        ? {
            userId,
            kind: "local",
            localCustomerId: customerId,
          }
        : {
            userId,
            kind: "plant",
            plantCustomerId: customerId,
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
        plantCustomerId: null,
        productIds: uniqueIds,
        productLines: lines as unknown as Prisma.InputJsonValue,
        entryDate: params.entryDate,
        notes: params.notes?.trim() || null,
      },
    });
  } else if (params.kind === "local") {
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
        plantCustomerId: null,
        productIds: uniqueIds,
        productLines: lines as unknown as Prisma.InputJsonValue,
        entryDate: params.entryDate,
        notes: params.notes?.trim() || null,
      },
    });
  } else if (params.kind === "plant") {
    const customer = await prisma.plantCustomer.findFirst({
      where: { id: params.customerId, userId },
    });
    if (!customer) {
      throw new Error("Customer not found.");
    }
    const products = await prisma.plantProduct.findMany({
      where: { userId, id: { in: uniqueIds } },
      select: { id: true },
    });
    if (products.length !== uniqueIds.length) {
      throw new Error("One or more products are invalid.");
    }
    await prisma.customerProductEntry.create({
      data: {
        userId,
        kind: "plant",
        customerId: null,
        localCustomerId: null,
        plantCustomerId: params.customerId,
        productIds: uniqueIds,
        productLines: lines as unknown as Prisma.InputJsonValue,
        entryDate: params.entryDate,
        notes: params.notes?.trim() || null,
      },
    });
  } else {
    throw new Error("Invalid entry kind.");
  }

  revalidatePath("/customer-product-entries");
  revalidatePath("/customer-product-entries/saved");
  revalidatePath("/gst/customer-product-entries");
}

export interface ListCustomerProductEntriesParams {
  userId: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  /** Match entries where customer or any line product has at least one of these tags. */
  tagFilter?: string[];
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

function buildEntryWhere(
  userId: string,
  customerId: string | undefined,
  dateFrom: Date | undefined,
  dateTo: Date | undefined
): Prisma.CustomerProductEntryWhereInput {
  const dateRange =
    dateFrom || dateTo
      ? {
          gte: dateFrom ? startOfDay(dateFrom) : undefined,
          lte: dateTo ? endOfDay(dateTo) : undefined,
        }
      : null;

  return {
    userId,
    ...(customerId
      ? {
          OR: [
            { customerId },
            { localCustomerId: customerId },
            { plantCustomerId: customerId },
          ],
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
}

function tagSetFromFilter(tags?: string[]): Set<string> | null {
  if (!tags?.length) return null;
  const s = new Set<string>();
  for (const t of tags) {
    const n = String(t).trim().toUpperCase();
    if (n) s.add(n);
  }
  return s.size ? s : null;
}

function tagsMatch(tags: string[] | undefined | null, filter: Set<string>): boolean {
  if (!tags?.length) return false;
  for (const t of tags) {
    const n = String(t).trim().toUpperCase();
    if (n && filter.has(n)) return true;
  }
  return false;
}

type EntryWithRelations = {
  id: string;
  createdAt: Date;
  entryDate: Date | null;
  notes: string | null;
  kind: string | null;
  customerId: string | null;
  localCustomerId: string | null;
  plantCustomerId: string | null;
  productIds: string[];
  productLines: Prisma.JsonValue | null;
  customer: {
    id: string;
    customerName: string;
    tags?: string[];
  } | null;
  localCustomer: {
    id: string;
    customerName: string;
    tags?: string[];
  } | null;
  plantCustomer: {
    id: string;
    customerName: string;
    tags?: string[];
  } | null;
};

type RowWithTagCtx = CustomerProductEntryListRow & {
  _tagCtx?: {
    customerTags: string[];
    lineProductTags: string[][];
  };
};

async function mapEntriesToRows(
  entries: EntryWithRelations[],
  userId: string,
  withProductTags: boolean
): Promise<RowWithTagCtx[]> {
  const gstProductIds = new Set<string>();
  const localProductIds = new Set<string>();
  const plantProductIds = new Set<string>();
  for (const e of entries) {
    const lines = parseEntryLines(e);
    const k = rowKind(e);
    for (const l of lines) {
      if (k === "local") localProductIds.add(l.productId);
      else if (k === "plant") plantProductIds.add(l.productId);
      else gstProductIds.add(l.productId);
    }
  }

  const gstSel = withProductTags
    ? ({ id: true, productName: true, tags: true } as const)
    : ({ id: true, productName: true } as const);
  const localSel = withProductTags
    ? ({ id: true, productName: true, tags: true } as const)
    : ({ id: true, productName: true } as const);
  const plantSel = withProductTags
    ? ({ id: true, productName: true, tags: true } as const)
    : ({ id: true, productName: true } as const);

  const [gstProducts, localProducts, plantProducts] = await Promise.all([
    gstProductIds.size === 0
      ? []
      : prisma.product.findMany({
          where: { userId, id: { in: [...gstProductIds] } },
          select: gstSel,
        }),
    localProductIds.size === 0
      ? []
      : prisma.localProduct.findMany({
          where: { userId, id: { in: [...localProductIds] } },
          select: localSel,
        }),
    plantProductIds.size === 0
      ? []
      : prisma.plantProduct.findMany({
          where: { userId, id: { in: [...plantProductIds] } },
          select: plantSel,
        }),
  ]);

  const gstNameById = Object.fromEntries(
    gstProducts.map((p) => [p.id, p.productName])
  );
  const localNameById = Object.fromEntries(
    localProducts.map((p) => [p.id, p.productName])
  );
  const plantNameById = Object.fromEntries(
    plantProducts.map((p) => [p.id, p.productName])
  );

  const gstTagById = withProductTags
    ? Object.fromEntries(
        gstProducts.map((p) => [p.id, (p as { tags?: string[] }).tags ?? []])
      )
    : null;
  const localTagById = withProductTags
    ? Object.fromEntries(
        localProducts.map((p) => [p.id, (p as { tags?: string[] }).tags ?? []])
      )
    : null;
  const plantTagById = withProductTags
    ? Object.fromEntries(
        plantProducts.map((p) => [p.id, (p as { tags?: string[] }).tags ?? []])
      )
    : null;

  return entries.map((e) => {
    const k = rowKind(e);
    const lines = parseEntryLines(e);
    const nameById =
      k === "local"
        ? localNameById
        : k === "plant"
          ? plantNameById
          : gstNameById;
    const productNames = lines
      .map((l) => {
        const name = nameById[l.productId] ?? l.productId;
        return `${name} × ${l.qty}`;
      })
      .join(", ");
    const customerName =
      k === "local"
        ? e.localCustomer?.customerName ?? "—"
        : k === "plant"
          ? e.plantCustomer?.customerName ?? "—"
          : e.customer?.customerName ?? "—";

    const base: RowWithTagCtx = {
      id: e.id,
      kind: k,
      createdAt: e.createdAt,
      entryDate: e.entryDate,
      notes: e.notes,
      customerName,
      productLines: lines,
      productNames,
    };
    if (withProductTags) {
      base._tagCtx = {
        customerTags:
          k === "gst"
            ? e.customer?.tags ?? []
            : k === "local"
              ? e.localCustomer?.tags ?? []
              : e.plantCustomer?.tags ?? [],
        lineProductTags: lines.map((l) =>
          k === "gst"
            ? gstTagById?.[l.productId] ?? []
            : k === "local"
              ? localTagById?.[l.productId] ?? []
              : plantTagById?.[l.productId] ?? []
        ),
      };
    }
    return base;
  });
}

function filterRowsByTags(
  rows: RowWithTagCtx[],
  filter: Set<string>
): CustomerProductEntryListRow[] {
  return rows
    .filter((r) => {
      const ctx = r._tagCtx;
      if (!ctx) return true;
      if (tagsMatch(ctx.customerTags, filter)) return true;
      for (const pt of ctx.lineProductTags) {
        if (tagsMatch(pt, filter)) return true;
      }
      return false;
    })
    .map(({ _tagCtx: _, ...rest }) => rest);
}

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
    tagFilter,
  } = params;

  const where = buildEntryWhere(userId, customerId, dateFrom, dateTo);
  const tagSet = tagSetFromFilter(tagFilter);
  const skip = (page - 1) * pageSize;

  const includeWithTags = {
    customer: { select: { id: true, customerName: true, tags: true } },
    localCustomer: { select: { id: true, customerName: true, tags: true } },
    plantCustomer: { select: { id: true, customerName: true, tags: true } },
  };
  const includeMinimal = {
    customer: { select: { id: true, customerName: true } },
    localCustomer: { select: { id: true, customerName: true } },
    plantCustomer: { select: { id: true, customerName: true } },
  };

  if (tagSet) {
    const allEntries = await prisma.customerProductEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: includeWithTags,
    });
    const mapped = await mapEntriesToRows(
      allEntries as EntryWithRelations[],
      userId,
      true
    );
    const filtered = filterRowsByTags(mapped, tagSet);
    const totalCount = filtered.length;
    const rows = filtered.slice(skip, skip + pageSize);
    return {
      rows,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize) || 1,
      currentPage: page,
    };
  }

  const [entries, totalCount] = await Promise.all([
    prisma.customerProductEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: includeMinimal,
    }),
    prisma.customerProductEntry.count({ where }),
  ]);

  const rows = await mapEntriesToRows(
    entries as EntryWithRelations[],
    userId,
    false
  );

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
  tagFilter?: string[];
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
    tagFilter: params.tagFilter,
    page: 1,
    pageSize: 100000,
  });

  if (rows.length === 0) {
    throw new Error("No entries found for export.");
  }

  const exportData = rows.map((r) => ({
    "Entry Date": format(r.entryDate ?? r.createdAt, "dd/MM/yyyy HH:mm"),
    "Customer Name": r.customerName,
    Products: r.productNames,
    Notes: r.notes ?? "",
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet["!cols"] = [
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
