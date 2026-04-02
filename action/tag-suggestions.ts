"use server";

import prisma from "@/lib/db";

export type TagScope =
  | "customer"
  | "product"
  | "localCustomer"
  | "localProduct"
  | "plantCustomer"
  | "plantProduct";

/** Distinct tags already used by this user for the given scope (sorted). */
export async function getDistinctTagsForScope(
  userId: string,
  scope: TagScope
): Promise<string[]> {
  const set = new Set<string>();
  const addFromRows = (tags: string[] | undefined) => {
    for (const t of tags ?? []) {
      const n = String(t).trim().toUpperCase();
      if (n) set.add(n);
    }
  };

  if (scope === "customer") {
    const rows = await prisma.customer.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) addFromRows(r.tags);
  } else if (scope === "product") {
    const rows = await prisma.product.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) addFromRows(r.tags);
  } else if (scope === "localCustomer") {
    const rows = await prisma.localCustomer.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) addFromRows(r.tags);
  } else if (scope === "localProduct") {
    const rows = await prisma.localProduct.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) addFromRows(r.tags);
  } else if (scope === "plantCustomer") {
    const rows = await prisma.plantCustomer.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) addFromRows(r.tags);
  } else {
    const rows = await prisma.plantProduct.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) addFromRows(r.tags);
  }

  return [...set].sort((a, b) => a.localeCompare(b));
}

/** All distinct tags across GST, local, and plant customers and products (sorted). */
export async function getAllDistinctTags(userId: string): Promise<string[]> {
  const [
    gstCust,
    gstProd,
    locCust,
    locProd,
    plantCust,
    plantProd,
  ] = await Promise.all([
    prisma.customer.findMany({ where: { userId }, select: { tags: true } }),
    prisma.product.findMany({ where: { userId }, select: { tags: true } }),
    prisma.localCustomer.findMany({ where: { userId }, select: { tags: true } }),
    prisma.localProduct.findMany({ where: { userId }, select: { tags: true } }),
    prisma.plantCustomer.findMany({ where: { userId }, select: { tags: true } }),
    prisma.plantProduct.findMany({ where: { userId }, select: { tags: true } }),
  ]);
  const set = new Set<string>();
  const add = (tags: string[] | undefined) => {
    for (const t of tags ?? []) {
      const n = String(t).trim().toUpperCase();
      if (n) set.add(n);
    }
  };
  for (const r of gstCust) add(r.tags);
  for (const r of gstProd) add(r.tags);
  for (const r of locCust) add(r.tags);
  for (const r of locProd) add(r.tags);
  for (const r of plantCust) add(r.tags);
  for (const r of plantProd) add(r.tags);
  return [...set].sort((a, b) => a.localeCompare(b));
}
