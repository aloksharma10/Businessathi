"use server";

import prisma from "@/lib/db";

export const getCustomers = async (userId: any) => {
  try {
    return await prisma.localCustomer.findMany({
      where: {
        userId: userId,
      },
    });
  } catch (error) {
    console.error(error, "[getCustomers]");
  }
};

export const getProducts = async (userId: any) => {
  try {
    return await prisma.localProduct.findMany({
      where: {
        userId: userId,
      },
    });
  } catch (error) {
    console.error(error, "[getProducts]");
  }
};
