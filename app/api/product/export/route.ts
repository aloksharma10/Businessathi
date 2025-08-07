import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportProductsToXLSX, exportProductsToCSV, ProductFilterParams } from "@/action/filter-action";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { format, ...filterParams }: { format: "xlsx" | "csv" } & ProductFilterParams = body;

    // Add userId from session
    const params: ProductFilterParams = {
      ...filterParams,
      userId: session.user.id,
    };

    let result;

    if (format === "xlsx") {
      result = await exportProductsToXLSX(params);
      
      return new NextResponse(result.buffer, {
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
      });
    } else if (format === "csv") {
      result = await exportProductsToCSV(params);
      
      return new NextResponse(result.content, {
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'xlsx' or 'csv'" }, { status: 400 });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export products" },
      { status: 500 }
    );
  }
} 