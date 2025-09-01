"use server";

import prisma from "./db";
import bcryptjs from "bcryptjs";

export const saltAndHashPassword = async (planPassword: string) => {
  try {
    const rounds = await bcryptjs.genSalt(10);
    return bcryptjs.hashSync(planPassword, rounds);
  } catch (error) {
    console.log(error, "[saltAndHashPassword]");
  }
};

export const getUserFromDb = async (email: string, plainPassword?: string) => {
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error("User not found!");

    if (!plainPassword) return user;

    const isValid =
      plainPassword &&
      user.password &&
      (await bcryptjs.compare(plainPassword, user.password));

    if (isValid) {
      return user;
    }

    return null;
  } catch (error) {
    console.log(error, "[getUserFromDb]");
  }
};

export const getLastLocalInvoiceNo = async (userId: string): Promise<any> => {
  try {
    // This should be an API call, not direct Prisma usage in client component
    const response = await prisma.localInvoice.findFirst({
      where: {
        userId: userId || "",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return response?.localInvoiceNo || 100;
  } catch (error) {
    console.log(error, "error");
    console.error("Error fetching last local invoice number:", error);
    return 100;
  }
};

export const getLastGSTInvoiceNo = async (userId: string): Promise<any> => {
  try {
    const response = await prisma.invoice.findFirst({
      where: {
        userId: userId || "",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return response?.invoiceNo || 387;
  } catch (error) {
    console.log(error, "error");
    console.error("Error fetching last gst invoice number:", error);
    return 387;
  }
};
