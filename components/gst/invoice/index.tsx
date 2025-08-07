import prisma from "@/lib/db";
import { InvoiceForm } from "./invoice-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/auth";

export const Invoice = async () => {
  const session = await auth();

  const customers = await prisma.customer.findMany({
    where: {
      userId: session?.user?.id,
    },
  });
  const products = await prisma.product.findMany({
    where: {
      userId: session?.user?.id,
    },
  });
  const invoices = await prisma.invoice.findFirst({
    where: {
      userId: session?.user?.id || "",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="px-5 lg:px-6">
        <CardTitle>{session?.user.companyName}</CardTitle>
        <CardDescription>Create Invoice</CardDescription>
      </CardHeader>
      <CardContent className="px-2 lg:px-6">
        <InvoiceForm
          isEdit={false}
          customers={customers || []}
          products={products || []}
          lastInvoiceNo={invoices?.invoiceNo || ""}
          lastInvoiceDate={invoices?.invoiceDate || new Date()}
        />
      </CardContent>
    </Card>
  );
};
