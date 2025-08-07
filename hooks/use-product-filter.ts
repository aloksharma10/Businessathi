"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ProductFilterParams,
  exportProductsToCSV,
  exportProductsToXLSX,
  filterProducts,
  FilteredProductData,
  FilteredLocalProductData
} from "@/action/filter-action";

interface UseProductFilterResult {
  products: (FilteredProductData | FilteredLocalProductData)[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  filterProducts: (params: ProductFilterParams) => Promise<void>;
  exportToXLSX: (params: Omit<ProductFilterParams, "page" | "pageSize">) => Promise<void>;
  exportToCSV: (params: Omit<ProductFilterParams, "page" | "pageSize">) => Promise<void>;
}

export const useProductFilter = (userId: string): UseProductFilterResult => {
  const [products, setProducts] = useState<
    (FilteredProductData | FilteredLocalProductData)[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterProductsHandler = useCallback(
    async (params: ProductFilterParams) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await filterProducts({
          userId,
          productType: params.productType, // Add productType here
          globalSearch: params.globalSearch,
          page: params.page,
          pageSize: params.pageSize,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });
        setProducts(response.products);
        setTotalCount(response.totalCount);
        setPageCount(response.pageCount);
        setCurrentPage(response.currentPage);
      } catch (err) {
        setError("Failed to fetch products");
        console.error("Error in filterProductsHandler:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId, filterProducts] // Add filterProducts to dependency array
  );

  const exportToXLSXHandler = useCallback(
    async (params: Omit<ProductFilterParams, "page" | "pageSize">) => {
      if (!userId) return;
      try {
        await exportProductsToXLSX({
          userId,
          productType: params.productType, // Add productType here
          globalSearch: params.globalSearch,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });
      } catch (err) {
        console.error("Error exporting XLSX:", err);
        throw err;
      }
    },
    [userId, exportProductsToXLSX] // Add exportProductsToXLSX to dependency array
  );

  const exportToCSVHandler = useCallback(
    async (params: Omit<ProductFilterParams, "page" | "pageSize">) => {
      if (!userId) return;
      try {
        await exportProductsToCSV({
          userId,
          productType: params.productType, // Add productType here
          globalSearch: params.globalSearch,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });
      } catch (err) {
        console.error("Error exporting CSV:", err);
        throw err;
      }
    },
    [userId, exportProductsToCSV] // Add exportProductsToCSV to dependency array
  );

  return {
    products,
    totalCount,
    pageCount,
    currentPage,
    loading,
    error,
    filterProducts: filterProductsHandler,
    exportToXLSX: exportToXLSXHandler,
    exportToCSV: exportToCSVHandler,
  };
}; 