import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportInvoicesToXLSX, exportInvoicesToCSV, InvoiceFilterParams } from "@/action/filter-action";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { format, ...filterParams }: { format: "xlsx" | "csv" } & InvoiceFilterParams = body;

    // Add userId from session
    const params: InvoiceFilterParams = {
      ...filterParams,
      userId: session.user.id,
    };

    let result;

    if (format === "xlsx") {
      result = await exportInvoicesToXLSX(params);
      
      // Convert ArrayBuffer to base64 string for JSON transport
      const base64Buffer = Buffer.from(result.buffer).toString('base64');
      
      return NextResponse.json({
        buffer: base64Buffer,
        filename: result.filename,
        contentType: result.contentType,
        exportData: result.exportData, // Include the transformed data
      });
    } else if (format === "csv") {
      result = await exportInvoicesToCSV(params);
      
      return NextResponse.json({
        content: result.content,
        filename: result.filename,
        contentType: result.contentType,
        exportData: result.exportData, // Include the transformed data
      });
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'xlsx' or 'csv'" }, { status: 400 });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export invoices" },
      { status: 500 }
    );
  }
} 