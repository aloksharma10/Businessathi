"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CustomerFilterParams,
  exportCustomersToCSV,
  exportCustomersToXLSX,
  filterCustomers,
  FilteredCustomerData,
  FilteredLocalCustomerData,
} from "@/action/filter-action";

interface UseCustomerFilterResult {
  customers: (FilteredCustomerData | FilteredLocalCustomerData)[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  filterCustomers: (params: CustomerFilterParams) => Promise<void>;
  exportToXLSX: (params: Omit<CustomerFilterParams, "page" | "pageSize">) => Promise<void>;
  exportToCSV: (params: Omit<CustomerFilterParams, "page" | "pageSize">) => Promise<void>;
}

export const useCustomerFilter = (userId: string): UseCustomerFilterResult => {
  const [customers, setCustomers] = useState<
    (FilteredCustomerData | FilteredLocalCustomerData)[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterCustomersHandler = useCallback(
    async (params: CustomerFilterParams) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await filterCustomers({
          userId,
          customerType: params.customerType,
          globalSearch: params.globalSearch,
          page: params.page,
          pageSize: params.pageSize,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });
        setCustomers(response.customers);
        setTotalCount(response.totalCount);
        setPageCount(response.pageCount);
        setCurrentPage(response.currentPage);
      } catch (err) {
        setError("Failed to fetch customers");
        console.error("Error in filterCustomersHandler:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId, filterCustomers]
  );

  const exportToXLSXHandler = useCallback(
    async (params: Omit<CustomerFilterParams, "page" | "pageSize">) => {
      if (!userId) return;
      try {
        await exportCustomersToXLSX({
          userId,
          customerType: params.customerType,
          globalSearch: params.globalSearch,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });
      } catch (err) {
        console.error("Error exporting XLSX:", err);
        throw err;
      }
    },
    [userId, exportCustomersToXLSX]
  );

  const exportToCSVHandler = useCallback(
    async (params: Omit<CustomerFilterParams, "page" | "pageSize">) => {
      if (!userId) return;
      try {
        await exportCustomersToCSV({
          userId,
          customerType: params.customerType,
          globalSearch: params.globalSearch,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });
      } catch (err) {
        console.error("Error exporting CSV:", err);
        throw err;
      }
    },
    [userId, exportCustomersToCSV]
  );

  return {
    customers,
    totalCount,
    pageCount,
    currentPage,
    loading,
    error,
    filterCustomers: filterCustomersHandler,
    exportToXLSX: exportToXLSXHandler,
    exportToCSV: exportToCSVHandler,
  };
}; 