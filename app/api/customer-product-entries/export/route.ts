import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportCustomerProductEntriesToXLSX } from "@/action/customer-product-entry";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      dateFrom,
      dateTo,
    }: {
      customerId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = body;

    const result = await exportCustomerProductEntriesToXLSX({
      userId: session.user.id,
      customerId: customerId || undefined,
      dateFrom,
      dateTo,
    });

    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error("Customer product entries export error:", error);
    return NextResponse.json(
      { error: "Failed to export entries" },
      { status: 500 }
    );
  }
}
