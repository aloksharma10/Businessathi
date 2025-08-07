import { auth } from "@/auth";
import { InvoiceTemplate } from "@/components/gst/invoice/invoice-template";
import prisma from "@/lib/db";

export default async function InvoicesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();
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

  const companyInfo = await prisma.users.findUnique({
    where: {
      id: session?.user?.id,
    },
  });

  if (!companyInfo) {
    // Handle case where company info is missing
    return <div>Company information not found.</div>;
  }

  return (
    <InvoiceTemplate invoiceInfo={invoiceInfo} companyInfo={companyInfo} />
  );
}
