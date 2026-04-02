"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

function normName(s: string) {
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

/** Find existing plant customer by normalized name or create one. */
export async function ensurePlantCustomer(userId: string, rawName: string) {
  const customerName = normName(rawName);
  if (!customerName) {
    throw new Error("Customer name is required.");
  }
  const existing = await prisma.plantCustomer.findUnique({
    where: {
      uniq_plant_customer_user_name: { userId, customerName },
    },
  });
  if (existing) {
    return { id: existing.id, created: false as const };
  }
  const c = await prisma.plantCustomer.create({
    data: {
      userId,
      customerName,
      address: "",
      tags: [],
    },
  });
  revalidatePath("/customer-product-entries");
  return { id: c.id, created: true as const };
}

/** Find existing plant product by normalized name or create one. */
export async function ensurePlantProduct(userId: string, rawName: string) {
  const productName = normName(rawName);
  if (!productName) {
    throw new Error("Product name is required.");
  }
  const existing = await prisma.plantProduct.findUnique({
    where: {
      uniq_plant_product_user_name: { userId, productName },
    },
  });
  if (existing) {
    return { id: existing.id, created: false as const };
  }
  const p = await prisma.plantProduct.create({
    data: {
      userId,
      productName,
      tags: [],
    },
  });
  revalidatePath("/customer-product-entries");
  return { id: p.id, created: true as const };
}
