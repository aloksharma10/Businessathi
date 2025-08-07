"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export const CreateCustomer = async (values: any, userId: string) => {
  try {
    const newCustomer = await prisma.customer.create({
      data: {
        customerName: values.values.customerName.toUpperCase(),
        address: values.values.address.toUpperCase(),
        gstIn: values.values.gstIn.toUpperCase(),
        state: values.values.state,
        stateCode: Number(values.values.stateCode),
        // userId: userId,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    revalidatePath("/");
    revalidatePath("/customers");
    return newCustomer;
  } catch (error) {
    console.error(error, "[CreateCustomer]");
  }
};

export const DeleteCustomer = async (id: string) => {
  try {
    const delCustomer = await prisma.customer.delete({
      where: { id },
    });
    revalidatePath("/");
    revalidatePath("/customers");
    return delCustomer;
  } catch (error) {
    console.error(error, "[DeleteCustomer]");
  }
};

export const UpdateCustomer = async (id: string, values: any) => {
  try {
    const editCustomer = await prisma.customer.update({
      where: { id },
      data: {
        customerName: values.customerName?.toUpperCase(),
        address: values.address?.toUpperCase(),
        gstIn: values.gstIn?.toUpperCase(),
        state: values.state,
        stateCode: values.stateCode ? Number(values.stateCode) : undefined,
      },
    });

    revalidatePath("/customers");
    return editCustomer;
  } catch (error) {
    console.error(error, "[UpdateCustomer]");
  }
};

export const CreateLocalCustomer = async (values: any, userId: string) => {
  try {
    const newLocalCustomer = await prisma.localCustomer.create({
      data: {
        customerName: values.values.customerName.toUpperCase(),
        address: values.values.address.toUpperCase(),
        userId: userId,
      },
    });
    revalidatePath("/");
    revalidatePath("/local/customers");
    return newLocalCustomer;
  } catch (error) {
    console.error(error, "[CreateLocalCustomer]");
  }
};

export const UpdateLocalCustomer = async (id: string, values: any) => {
  try {
    const editLocalCustomer = await prisma.localCustomer.update({
      where: {
        id,
      },
      data: {
        customerName: values.customerName?.toUpperCase(),
        address: values.address?.toUpperCase(),
      },
    });
    revalidatePath("/");
    revalidatePath("/customers");
    return editLocalCustomer;
  } catch (error) {
    console.error(error, "[UpdateLocalCustomer]");
  }
};

export const DeleteLocalCustomer = async (id: string) => {
  try {
    const delLocalCustomer = await prisma.localCustomer.delete({
      where: {
        id,
      },
    });
    revalidatePath("/");
    revalidatePath("/customers");
    return delLocalCustomer;
  } catch (error) {
    console.error(error, "[DeleteLocalCustomer]");
  }
};
