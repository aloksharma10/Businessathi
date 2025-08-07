"use client";

import { useModal } from "@/store/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Download, XCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { useProductFilter } from "@/hooks/use-product-filter";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import * as React from "react";
import { FilteredProductData, FilteredLocalProductData } from "@/action/filter-action";
import { Product } from "@prisma/client";

export const ProductTable = () => {
  const { onOpen, registerRefreshCallback, unregisterRefreshCallback } = useModal();
  const { data: session } = useSession();
  const [filterState, setFilterState] = React.useState<{
    globalSearch: string;
  }>({
    globalSearch: "",
  });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const {
    products,
    totalCount,
    pageCount,
    loading,
    filterProducts,
    exportToXLSX,
    exportToCSV,
    error,
  } = useProductFilter(session?.user?.id || "");

  React.useEffect(() => {
    if (session?.user?.id) {
      filterProducts({
        userId: session?.user?.id || "",
        page,
        pageSize,
        globalSearch: filterState.globalSearch,
        productType: "gst",
      });
    }
  }, [session?.user?.id, filterState, page, pageSize, filterProducts]);

  // Function to refetch data after successful operations
  const refetchData = React.useCallback(() => {
    if (session?.user?.id) {
      filterProducts({
        userId: session?.user?.id || "",
        page,
        pageSize,
        globalSearch: filterState.globalSearch,
        productType: "gst",
      });
    }
  }, [session?.user?.id, filterState, page, pageSize, filterProducts]);

  // Register refresh callback
  React.useEffect(() => {
    registerRefreshCallback("gst-products", refetchData);
    return () => {
      unregisterRefreshCallback("gst-products");
    };
  }, [registerRefreshCallback, unregisterRefreshCallback, refetchData]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterState({ globalSearch: e.target.value });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilterState({ globalSearch: "" });
    setPage(1);
  };

  const handleExport = async (format: "xlsx" | "csv") => {
    try {
      if (format === "xlsx") {
        await exportToXLSX({
          globalSearch: filterState.globalSearch,
          productType: "gst",
          userId: session?.user?.id || "",
        });
        toast.success("XLSX export completed");
      } else {
        await exportToCSV({
          globalSearch: filterState.globalSearch,
          productType: "gst",
          userId: session?.user?.id || "",
        });
        toast.success("CSV export completed");
      }
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const columns: ColumnDef<FilteredProductData | FilteredLocalProductData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "productName",
      accessorKey: "productName",
      header: "Product Name",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("productName")}</div>
      ),
    },
    {
      accessorKey: "hsnCode",
      header: "HSN Code",
      cell: ({ row }) => {
        const product = row.original as FilteredProductData | FilteredLocalProductData;
        if ('hsnCode' in product) {
          return (
            <div className="capitalize">{product.hsnCode}</div>
          );
        } else {
          return null; // Or some placeholder for local products
        }
      },
    },
    {
      accessorKey: "cgstRate",
      header: "CGST Rate",
      cell: ({ row }) => {
        const product = row.original as FilteredProductData | FilteredLocalProductData;
        if ('cgstRate' in product) {
          return (
            <div className="capitalize text-center md:text-start">{product.cgstRate}</div>
          );
        } else {
          return null; // Or some placeholder for local products
        }
      },
    },
    {
      accessorKey: "sgstRate",
      header: "SGST Rate",
      cell: ({ row }) => {
        const product = row.original as FilteredProductData | FilteredLocalProductData;
        if ('sgstRate' in product) {
          return (
            <div className="capitalize text-center md:text-start">{product.sgstRate}</div>
          );
        } else {
          return null; // Or some placeholder for local products
        }
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onOpen("editProduct", { product: row.original as Product })}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onOpen("deleteProduct", { product: row.original as Product })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const isFilterActive = !!filterState.globalSearch;

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-3">
        <Input
          placeholder="Search products..."
          value={filterState.globalSearch}
          onChange={handleSearch}
          className="max-w-sm"
        />
        {isFilterActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleResetFilters} aria-label="Reset filters">
                <XCircle className="w-5 h-5 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset filters</TooltipContent>
          </Tooltip>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Download className="mr-3 h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("xlsx")}>Export XLSX</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")}>Export CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DataTable
        showCalender={false}
        manualPagination={true}
        manualFiltering={false}
        columns={columns}
        data={products}
        count={totalCount}
        page={page - 1}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizeOptions={[10, 15, 20, 25]}
        advancedFilter={false}
        showGlobalFilter={false}
        searchPlaceholder="Search by product name or HSN code"
        searchableColumns={[
          { id: "productName", title: "Product Name" },
          { id: "hsnCode", title: "HSN Code" },
        ]}
        selectable={true}
        onSelectionChange={() => {}}
        bulkActions={[]}
        showDownload={false}
        dateRangeFilter={false}
        defaultSort={[
          {
            id: "createdAt",
            desc: true,
          },
        ]}
        defaultVisibility={{}}
        onPaginationChange={({ pageIndex, pageSize: newPageSize }) => {
          setPage(pageIndex + 1);
          setPageSize(newPageSize);
        }}
        isLoading={loading}
        isError={!!error}
        errorMessage={error || undefined}
      />
    </div>
  );
};
