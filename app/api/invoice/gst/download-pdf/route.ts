import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { gstInvoiceDocument } from "@/lib/pdf/gst-invoice";
import { renderPdf } from "@/lib/pdf/pdfmake";
import {
  orderByRequest,
  pdfResponse,
  requestedInvoiceIds,
} from "@/lib/pdf/request";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ids = requestedInvoiceIds(req.nextUrl.searchParams);
    if (ids.length === 0) {
      return new NextResponse("Missing invoice ID(s)", { status: 400 });
    }

    const [company, rows] = await Promise.all([
      prisma.users.findUnique({ where: { id: session.user.id } }),
      prisma.invoice.findMany({
        where: { id: { in: ids }, userId: session.user.id },
        include: {
          customer: true,
          pricedProducts: { include: { product: true } },
        },
      }),
    ]);
    const invoices = orderByRequest(ids, rows);

    if (!company || invoices.length === 0) {
      return new NextResponse("Invoice(s) not found", { status: 404 });
    }

    const pdf = await renderPdf(gstInvoiceDocument(invoices, company));
    const filename =
      invoices.length === 1 ? `${invoices[0].invoiceNo}.pdf` : "invoices.pdf";

    return pdfResponse(pdf, filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
