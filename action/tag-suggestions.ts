"use server";

import prisma from "@/lib/db";

/** Distinct tags already used by this user for GST customers or products (sorted). */
export async function getDistinctTagsForScope(
  userId: string,
  scope: "customer" | "product"
): Promise<string[]> {
  const set = new Set<string>();
  if (scope === "customer") {
    const rows = await prisma.customer.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) {
      for (const t of r.tags ?? []) {
        const n = String(t).trim().toUpperCase();
        if (n) set.add(n);
      }
    }
  } else {
    const rows = await prisma.product.findMany({
      where: { userId },
      select: { tags: true },
    });
    for (const r of rows) {
      for (const t of r.tags ?? []) {
        const n = String(t).trim().toUpperCase();
        if (n) set.add(n);
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
