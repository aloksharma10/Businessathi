import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import puppeteer from "puppeteer";

const BASE_URL =
  process.env.APP_URL || "https://businessathi.acnexttech.com";

import { PDFDocument } from "pdf-lib";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const invoiceId = searchParams.get("id");
    const invoiceIds = searchParams.getAll("ids"); // For bulk download

    const invoiceUrls: string[] = [];

    if (invoiceId) {
      invoiceUrls.push(`${BASE_URL}/gst/${invoiceId}/pdf-view`);
    } else if (invoiceIds.length > 0) {
      invoiceIds.forEach((id) => {
        invoiceUrls.push(`${BASE_URL}/gst/${id}/pdf-view`);
      });
    } else {
      return new NextResponse("Missing invoice ID(s)", { status: 400 });
    }

    if (invoiceUrls.length === 0) {
      return new NextResponse("Invoice(s) not found or no URLs generated", {
        status: 404,
      });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for Heroku/Docker deployments
    });
    const page = await browser.newPage();

    const mergedPdf = await PDFDocument.create();

    for (const url of invoiceUrls) {
      await page.goto(url, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices()
      );
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    await browser.close();

    const finalPdfBytes = await mergedPdf.save();

    return new NextResponse(Buffer.from(finalPdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoices.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
