import prisma from "@/lib/db";

export const getInvoiceInfo = async (id: string, type: string) => {
  if (type === "local") {
  const invoiceInfo = await prisma.localInvoice.findUnique({
    where: {
      id: id,
    },
    include: {
      customer: true,
      pricedProducts: {
        include: {
          product: true,
        },
      },
    },
    });
    return invoiceInfo;
  }
  if (type === "gst") {
    const invoiceInfo = await prisma.invoice.findUnique({
      where: {
        id: id,
      },
      include: {
        customer: true,
        pricedProducts: {
          include: {
            product: true,
          },
        },
      },
    });
    return invoiceInfo;
  }
  return null;
};

export const getCompanyInfo = async (id: string, type: string) => {
  if (type === "local") {
  const companyInfo = await prisma.users.findUnique({
    where: {
      id: id,
      },
    });
    return companyInfo;
  }
  if (type === "gst") {
    const companyInfo = await prisma.users.findUnique({
      where: {
        id: id,
      },
    });
    return companyInfo;
  }
  return null;
};