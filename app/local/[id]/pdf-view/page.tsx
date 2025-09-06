import { LocalInvoiceTemplate } from "@/components/local/invoice/local-invoice-template";
import prisma from "@/lib/db";
import { toZonedTime } from "date-fns-tz";
import { notFound } from "next/navigation";

// Add print-specific CSS - copy from invoice-template.tsx
const printStyles = `
  @media print {
    .no-print {
      display: none;
    }
    #divToPrint {
      width: 100%;
      font-size: 12px;
      color: black !important;
      background: white !important;
    }
    .dark\\:border-white {
      border-color: black !important;
    }
    .dark\\:text-white {
      color: black !important;
    }
  }
`;

export default async function InvoicePdfViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

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

  if (!invoiceInfo) {
    notFound();
  }

  if (!invoiceInfo.userId) {
    notFound();
  }

  const companyInfo = await prisma.users.findUnique({
    where: {
      id: invoiceInfo.userId || "",
    },
  });

  if (!companyInfo) {
    // Handle case where company info is missing
    return <div>Company information not found.</div>
  }

  return (
    <html>
      <head>
        <title>Invoice {invoiceInfo.localInvoiceNo}</title>
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      </head>
      <body>
        <div id="divToPrint">
          <LocalInvoiceTemplate
          // @ts-ignore
            invoiceInfo={{...invoiceInfo, localInvoiceDate: toZonedTime(invoiceInfo?.localInvoiceDate, "Asia/Kolkata")}}
            companyInfo={companyInfo}
          />
        </div>
      </body>
    </html>
  );
}
