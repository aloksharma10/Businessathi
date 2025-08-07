import prisma from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvoiceForm } from "@/components/gst/invoice/invoice-form";
import { auth } from "@/auth";

export default async function InvoiceEditPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
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

  const invoiceInfo = await prisma.invoice.findUnique({
    where: {
      id: params.id,
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

  if (!invoiceInfo) {
    return <div>Invoice not found</div>
  }

  return (
    <div className="lg:p-4">
      <Card>
        <CardHeader className="px-5 lg:px-6">
          <CardTitle>Update Invoice</CardTitle>
          <CardDescription>Invoice </CardDescription>
        </CardHeader>
        <CardContent className="px-3 lg:px-6">
          <InvoiceForm
            isEdit={true}
            invoiceInfo={invoiceInfo}
            customers={customers || []}
            products={products || []}
            lastInvoiceNo={invoiceInfo?.invoiceNo || ""}
            lastInvoiceDate={invoiceInfo?.invoiceDate || null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
