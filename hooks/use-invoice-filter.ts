"use client";

import { useState, useCallback } from "react";
import { filterInvoices, getUniqueMonths, getUniqueCustomers, InvoiceFilterParams, FilteredInvoiceData } from "@/action/filter-action";

interface UseInvoiceFilterReturn {
  invoices: FilteredInvoiceData[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  filterInvoices: (params: Omit<InvoiceFilterParams, "userId">) => Promise<void>;
  getMonths: (invoiceType: "gst" | "local") => Promise<string[]>;
  getCustomers: (invoiceType: "gst" | "local") => Promise<{ id: string; customerName: string; address: string; }[]>;
  exportToXLSX: (params: Omit<InvoiceFilterParams, "userId">) => Promise<{ buffer: ArrayBuffer; filename: string; contentType: string, exportData: any[] }>;
  exportToCSV: (params: Omit<InvoiceFilterParams, "userId">) => Promise<{ content: string; filename: string; contentType: string, exportData: any[] }>;
}

export const useInvoiceFilter = (userId: string): UseInvoiceFilterReturn => {
  const [invoices, setInvoices] = useState<FilteredInvoiceData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterInvoicesData = useCallback(async (params: Omit<InvoiceFilterParams, "userId">) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await filterInvoices({
        ...params,
        userId,
      });

      setInvoices(result.invoices);
      setTotalCount(result.totalCount);
      setPageCount(result.pageCount);
      setCurrentPage(result.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter invoices");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getMonths = useCallback(async (invoiceType: "gst" | "local") => {
    try {
      return await getUniqueMonths(userId, invoiceType);
    } catch (err) {
      console.error("Error getting months:", err);
      return [];
    }
  }, [userId]);

  const getCustomers = useCallback(async (invoiceType: "gst" | "local") => {
    try {
      return await getUniqueCustomers(userId, invoiceType);
    } catch (err) {
      console.error("Error getting customers:", err);
      return [];
    }
  }, [userId]);

  const exportToXLSX = useCallback(async (params: Omit<InvoiceFilterParams, "userId">) => {
    try {
      const response = await fetch("/api/invoice/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          format: "xlsx",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export invoices");
      }

      const data = await response.json(); // Assuming the response is JSON with buffer, filename, contentType
      // Convert base64 string to ArrayBuffer
      const buffer = Uint8Array.from(atob(data.buffer), c => c.charCodeAt(0)).buffer;
      return { buffer, filename: data.filename, contentType: data.contentType, exportData: data.exportData };
    } catch (err) {
      console.error("Error exporting to XLSX:", err);
      throw err;
    }
  }, []);

  const exportToCSV = useCallback(async (params: Omit<InvoiceFilterParams, "userId">) => {
    try {
      const response = await fetch("/api/invoice/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          format: "csv",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export invoices");
      }

      const data = await response.json(); // Assuming the response is JSON with content, filename, contentType
      return { content: data.content, filename: data.filename, contentType: data.contentType, exportData: data.exportData };
    } catch (err) {
      console.error("Error exporting to CSV:", err);
      throw err;
    }
  }, []);

  return {
    invoices,
    totalCount,
    pageCount,
    currentPage,
    loading,
    error,
    filterInvoices: filterInvoicesData,
    getMonths,
    getCustomers,
    exportToXLSX,
    exportToCSV,
  };
}; 