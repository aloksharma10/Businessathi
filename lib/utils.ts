import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyForIndia(amount: number) {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  });

  return formatter.format(amount);
}

export const exportToExcel = (
  data: any[],
  fileName: string,
  onClose: () => void
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!cols"] = Object.keys(data[0]).map((header) => ({
    wch:
      Math.max(
        header.length,
        ...data.map((row) => String(row[header]).length)
      ) + 2,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
  onClose();
};

export const downloadInvoicePDF = async ({
  invoiceId,
  invoiceNo,
  invoiceType,
}: {
  invoiceId: string;
  invoiceNo: string;
  invoiceType: "gst" | "local";
}) => {
  try {
    const downloadPath =
      invoiceType === "gst"
        ? `/api/invoice/gst/download-pdf?id=${invoiceId}`
        : `/api/invoice/local/download-pdf?id=${invoiceId}`;

    const response = await fetch(downloadPath);

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    // Optionally, show a toast or alert to the user
  }
};

export const downloadButtonInColumn = async ({
  invoiceId,
  invoiceNo,
  invoiceType,
}: {
  invoiceId: string;
  invoiceNo: string;
  invoiceType: "gst" | "local";
}) => {
  try {
    const downloadPath =
      invoiceType === "gst"
        ? `/api/invoice/gst/download-pdf?id=${invoiceId}`
        : `/api/invoice/local/download-pdf?id=${invoiceId}`;

    const response = await fetch(downloadPath);
    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    // Optionally, show a toast or alert to the user
  }
};
