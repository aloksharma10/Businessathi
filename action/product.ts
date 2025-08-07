"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export const CreateProduct = async (values: any, userId: string) => {
  try {
    const newProduct = await prisma.product.create({
      data: {
        productName: values.values.productName.toUpperCase(),
        hsnCode: Number(values.values.hsnCode),
        cgstRate: Number(values.values.cgstRate),
        sgstRate: Number(values.values.sgstRate),
        userId: userId || "",
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/gst/products");
    revalidatePath("/gst/create-invoice");
    return newProduct;
  } catch (error) {
    console.error(error, "[CreateProduct]");
  }
};

export const UpdateProduct = async (id: string, values: any) => {
  try {
    const editProduct = await prisma.product.update({
      where: { id },
      data: {
        productName: values.productName?.toUpperCase(),
        hsnCode: values.hsnCode ? Number(values.hsnCode) : undefined,
        cgstRate: values.cgstRate ? Number(values.cgstRate) : undefined,
        sgstRate: values.sgstRate ? Number(values.sgstRate) : undefined,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/gst/products");
    revalidatePath("/gst/create-invoice");
    return editProduct;
  } catch (error) {
    console.error(error, "[UpdateProduct]");
  }
};

export const DeleteProduct = async (id: string) => {
  try {
    const delProduct = await prisma.product.delete({
      where: { id },
    });
    revalidatePath("/dashboard");
    revalidatePath("/gst/products");
    revalidatePath("/gst/create-invoice");
    return delProduct;
  } catch (error) {
    console.error(error, "[DeleteProduct]");
  }
};

export const CreateLocalProduct = async (values: any, userId: string) => {
  try {
    const newLocalProduct = await prisma.localProduct.create({
      data: {
        productName: values.values.productName.toUpperCase(),
        userId: userId || "",
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/local/create-invoice");
    revalidatePath("/local/products");
    return newLocalProduct;
  } catch (error) {
    console.error(error, "[CreateLocalProduct]");
  }
};
export const UpdateLocalProduct = async (id: string, values: any) => {
  try {
    const editLocalProduct = await prisma.localProduct.update({
      where: { id },
      data: {
        productName: values.productName.toUpperCase(),
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/local/create-invoice");
    revalidatePath("/local/products");
    return editLocalProduct;
  } catch (error) {
    console.error(error, "[UpdateLocalProduct]");
  }
};
export const DeleteLocalProduct = async (id: string) => {
  try {
    const delLocalProduct = await prisma.localProduct.delete({
      where: { id },
    });
    revalidatePath("/dashboard");
    revalidatePath("/local/create-invoice");
    revalidatePath("/local/products");
    return delLocalProduct;
  } catch (error) {
    console.error(error, "[DeleteLocalProduct]");
  }
};
