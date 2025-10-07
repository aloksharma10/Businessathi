"use client";

import { FilteredInvoiceData } from "@/action/filter-action";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpDown,
  Download,
  MoreHorizontal,
  Pencil,
  Filter,
  XCircle,
  LoaderCircle,
  Loader,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, downloadButtonInColumn, downloadInvoicePDF } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, parse } from "date-fns";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useInvoiceFilter } from "@/hooks/use-invoice-filter";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { toast } from "sonner";
import HoverCardToolTip from "@/components/hover-card-tooltip";
import Link from "next/link";
import { useModal } from "@/store/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/components/ui/multi-selector";
import { Spinner } from "@/components/spinner";

interface FilterState {
  globalSearch?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const GstInvoiceTableWithFilter = () => {
  const { data: session } = useSession();
  const [filterState, setFilterState] = useState<FilterState>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<FilteredInvoiceData[]>([]);
  const [searchValue, setSearchValue] = useState<string>(""); // State for input field
  const debouncedSearchValue = useDebounce(searchValue, 400); // Debounce with 400ms
  const { onOpen } = useModal();
  const isMobile = useIsMobile();
  const [loadingInvoices, setLoadingInvoices] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const {
    invoices,
    totalCount,
    pageCount,
    loading,
    error,
    filterInvoices,
    exportToXLSX,
    exportToCSV,
  } = useInvoiceFilter(session?.user?.id || "");

  // Update filterState with debounced search value
  useEffect(() => {
    setFilterState((prev) => ({
      ...prev,
      globalSearch: debouncedSearchValue || undefined, // Use undefined for empty string to clear filter
    }));
    setPage(1); // Reset to first page on search change
  }, [debouncedSearchValue]);

  const refetchData = useCallback(() => {
    if (session?.user?.id) {
      filterInvoices({
        invoiceType: "gst",
        page: page,
        pageSize,
        globalSearch: filterState.globalSearch || undefined, // Ensure undefined for empty search
        dateFrom: filterState.dateFrom,
        dateTo: filterState.dateTo,
        sortBy: filterState.sortBy || "invoiceNo",
        sortOrder: filterState.sortOrder || "desc",
      });
    }
  }, [session?.user?.id, page, pageSize, filterState, filterInvoices]);

  // Initial load and refetch on filter/page change
  useEffect(() => {
    refetchData();
  }, [refetchData]); // Depend on refetchData to capture changes in its dependencies

  // Handle search input change - this now only updates local state
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value); // Update input field immediately for smooth typing
  }, []);

  const handleDateRange = useCallback((range: { from?: Date; to?: Date }) => {
    setFilterState((prev) => ({
      ...prev,
      dateFrom: range.from,
      dateTo: range.to,
    }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterState({
      globalSearch: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "invoiceNo",
      sortOrder: "desc",
    });
    setSearchValue(""); // Reset search input
    setPage(1);
  }, []);

  const handleSortingChange = useCallback(
    (sorting: { id: string; desc: boolean }[]) => {
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        // Only allow sorting on invoiceNo
        if (id === "invoiceNo") {
          setFilterState((prev) => ({
            ...prev,
            sortBy: "invoiceNo",
            sortOrder: desc ? "desc" : "asc",
          }));
        }
      } else {
        setFilterState((prev) => ({
          ...prev,
          sortBy: "invoiceNo",
          sortOrder: "desc",
        }));
      }
      setPage(1);
    },
    []
  );

  const handleExport = useCallback(
    async (formatType: "xlsx" | "csv") => {
      try {
        setIsExporting(true);
        if (
          filterState.globalSearch?.toLowerCase().includes("titan") &&
          filterState.dateFrom &&
          filterState.dateTo
        ) {
          const xlsxResult = await exportToXLSX({
            invoiceType: "gst",
            exportType: "titan",
            globalSearch: filterState.globalSearch,
            dateFrom: filterState.dateFrom,
            dateTo: filterState.dateTo,
            sortBy: filterState.sortBy || "invoiceNo",
            sortOrder: filterState.sortOrder || "desc",
          });
          onOpen("titanCompanySubmit", {
            xlsxDataForTitan: xlsxResult.exportData,
          });
        } else if (
          !filterState.globalSearch &&
          filterState.dateFrom &&
          filterState.dateTo
        ) {
          const xlsxResult = await exportToXLSX({
            invoiceType: "gst",
            exportType: "gst",
            dateFrom: filterState.dateFrom,
            dateTo: filterState.dateTo,
            sortBy: filterState.sortBy || "invoiceNo",
            sortOrder: filterState.sortOrder || "desc",
          });
          onOpen("gstSubmit", { xlsxDataForGST: xlsxResult.exportData });
        } else {
          // Generic export: use the fetched result and trigger download
          if (formatType === "xlsx") {
            const xlsxResult = await exportToXLSX({
              invoiceType: "gst",
              // userId is already handled by the hook
              page: 1, // Ensure all data is fetched
              pageSize: 100000, // A very large number to fetch all data
              ...filterState,
            });
            const url = window.URL.createObjectURL(
              new Blob([xlsxResult.buffer], { type: xlsxResult.contentType })
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = xlsxResult.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("XLSX export completed");
          } else {
            const csvResult = await exportToCSV({
              invoiceType: "gst",
              // userId is already handled by the hook
              page: 1, // Ensure all data is fetched
              pageSize: 100000, // A very large number to fetch all data
              ...filterState,
            });
            const url = window.URL.createObjectURL(
              new Blob([csvResult.content], { type: csvResult.contentType })
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = csvResult.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("CSV export completed");
          }
        }
      } catch (error) {
        toast.error(`Failed to export`);
        console.error(error);
      } finally {
        setIsExporting(false);
      }
    },
    [filterState, onOpen, exportToXLSX, exportToCSV]
  );

  const handleBulkDownloadPDF = useCallback(
    async (selectedInvoices: FilteredInvoiceData[]) => {
      const selectedInvoiceIds = selectedInvoices.map((row) => row.id);
      if (selectedInvoiceIds.length === 0) {
        toast.error("No invoices selected for bulk PDF download.");
        return;
      }
      try {
        const queryParams = new URLSearchParams();
        selectedInvoiceIds.forEach((id) => queryParams.append("ids", id));
        const response = await fetch(
          `/api/invoice/gst/download-pdf?${queryParams.toString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to download bulk PDF");
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `selected_gst_invoices.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Bulk PDF download completed");
      } catch (error) {
        console.error("Error downloading bulk PDF:", error);
        toast.error("Error downloading bulk PDF");
      }
    },
    []
  );

  const handleDownloadAllFilteredPDF = useCallback(
    async (allFilteredInvoiceData: FilteredInvoiceData[]) => {
      const allFilteredInvoiceIds = allFilteredInvoiceData.map((row) => row.id);
      if (allFilteredInvoiceIds.length === 0) {
        toast.error("No invoices to download.");
        return;
      }
      try {
        const queryParams = new URLSearchParams();
        allFilteredInvoiceIds.forEach((id) => queryParams.append("ids", id));
        const response = await fetch(
          `/api/invoice/gst/download-pdf?${queryParams.toString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to download all filtered PDF");
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `all_filtered_gst_invoices.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("All filtered PDF download completed");
      } catch (error) {
        console.error("Error downloading all filtered PDF:", error);
        toast.error("Error downloading all filtered PDF");
      }
    },
    []
  );

  // Memoize columns to prevent unnecessary re-renders
  const columns: ColumnDef<FilteredInvoiceData>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
        accessorKey: "invoiceNo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className="hover:bg-slate-800 hover:text-white"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Invoice No
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const id = row.original.id;
          const invoiceNo = row.original.invoiceNo;
          const isRowLoading = loadingInvoices.has(id);
          const Icon = isRowLoading ? Loader : Download
          return (
            <div className="flex items-center justify-center">
              {row.getValue("invoiceNo")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="cursor-pointer"
                    onClick={async() => {
                      setLoadingInvoices(prev => new Set([...prev, id]));
                      try {
                        await downloadButtonInColumn({
                          invoiceId: id,
                          invoiceNo,
                          invoiceType: "gst",
                        });
                      } finally {
                        setLoadingInvoices(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(id);
                          return newSet;
                        });
                      }
                    }}
                    variant={"link"}
                    size={"icon"}
                  >
                    <Icon className={cn("ml-2 h-4 w-4 text-green-600", isRowLoading && "animate-spin")} key={id} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PDF</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
      {
        accessorKey: "invoiceDate",
        header: () => {
          return <div className="text-center">Invoice Date</div>;
        },
        cell: ({ row }) => (
          <div className="text-center">
            {format(row.getValue("invoiceDate"), "dd-MMM-yyyy")}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "monthOf",
        header: () => {
          return <div className="text-center">Month</div>;
        },
        cell: ({ row }) => {
          const year = row.original.yearOf;
          const month = row.original.monthOf;
          const date = parse(`${month} ${year}`, "MMMM yyyy", new Date());

          return (
            <div className="capitalize text-center">
              {format(date, "MMM yyyy")}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "customerName",
        header: "Customer Name",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("customerName")}</div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("address")}</div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => {
          const pricedProducts = row.original.pricedProducts;

          return (
            <HoverCardToolTip
              side="top"
              label="Products"
              align="center"
              className="min-w-max"
            >
              <div className="flex flex-col gap-2 p-2 w-full">
                {pricedProducts.length > 0 ? (
                  pricedProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center w-full"
                    >
                      <span className="capitalize text-sm">
                        {product.productName}
                      </span>
                      <span className="text-sm text-primary font-semibold">
                        &nbsp;:&nbsp;Qty: {product.qty}, Rate: {product.rate}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="capitalize">N/A</div>
                )}
              </div>
            </HoverCardToolTip>
          );
        },
      },
      {
        accessorKey: "totalTaxableValue",
        header: () => {
          return <div className="text-center">Total Taxable Value</div>;
        },
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("totalTaxableValue")}</div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "totalTaxGST",
        header: () => {
          return <div className="text-center">Total Tax</div>;
        },
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("totalTaxGST")}</div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "totalInvoiceValue",
        header: () => {
          return <div className="text-center">Total Invoice Value</div>;
        },
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("totalInvoiceValue"));

          const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "INR",
          }).format(amount);

          return <div className="text-center font-medium">{formatted}</div>;
        },
        enableSorting: false,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const { id } = row.original;
          const invoiceNo = row.original.invoiceNo;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/gst/invoices/${id}/edit`}>
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Invoice
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={() =>
                    downloadInvoicePDF({
                      invoiceId: id,
                      invoiceNo,
                      invoiceType: "gst",
                    })
                  }
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [loadingInvoices]
  );

  const isFilterActive = useMemo(
    () =>
      !!filterState.globalSearch ||
      !!filterState.dateFrom ||
      !!filterState.dateTo,
    [filterState.globalSearch, filterState.dateFrom, filterState.dateTo]
  );

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="md:flex gap-4">
            <div className="grid md:grid-cols-2 gap-4 md:w-1/2">
              {/* Global Search */}
              <div className="space-y-2">
                <Label htmlFor="global-search">Global Search</Label>
                <Input
                  id="global-search"
                  placeholder="Search by invoice number, customer name, or address"
                  value={searchValue}
                  onChange={handleSearch}
                />
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={{
                    from: filterState.dateFrom,
                    to: filterState.dateTo,
                  }}
                  setDate={handleDateRange}
                  disabledDates={[]}
                />
              </div>
            </div>

            <div className="flex flex-1 mt-4 gap-4 justify-end">
              <div className="flex items-end flex-1">
                {isFilterActive && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isMobile ? "outline" : "ghost"}
                        size={isMobile ? "default" : "icon"}
                        onClick={handleResetFilters}
                        aria-label="Reset filters"
                      >
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                        {isMobile && "Reset filters"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset filters</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex md:flex-1 justify-end items-end gap-2">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto px-5">
                      <Download className="mr-3 h-4 w-4" /> Export
                      {isExporting &&
                        (isMobile ? (
                          <Spinner size="lg" />
                        ) : (
                          <LoaderCircle className="ml-2 w-4 h-4 animate-spin text-primary" />
                        ))}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                      Export XLSX
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownloadAllFilteredPDF(invoices)}
                    >
                      Export All Invoices as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkDownloadPDF(selectedRows)}
                      disabled={selectedRows.length === 0}
                    >
                      Export Selected Invoices as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground flex items-center">
          Showing {invoices.length} of {totalCount} invoices
          {loading && <LoaderCircle className="animate-spin ml-2" />}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        showCalender={false}
        manualPagination={true}
        manualSorting={true}
        manualFiltering={false}
        columns={columns}
        data={invoices}
        count={totalCount}
        page={page - 1}
        pageCount={pageCount}
        pageSize={pageSize}
        advancedFilter={false}
        showGlobalFilter={false}
        searchPlaceholder="Search by invoice number, customer name, or address"
        searchableColumns={[
          { id: "invoiceNo", title: "Invoice Number" },
          { id: "customerName", title: "Customer Name" },
          { id: "address", title: "Address" },
        ]}
        selectable={true}
        onSelectionChange={setSelectedRows}
        showDownload={false}
        dateRangeFilter={false}
        defaultDateRange={{
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date(),
        }}
        defaultSort={[
          {
            id: filterState.sortBy || "invoiceNo",
            desc: filterState.sortOrder === "desc",
          },
        ]}
        defaultVisibility={{
          address: true,
        }}
        onPaginationChange={({ pageIndex, pageSize: newPageSize }) => {
          setPage(pageIndex + 1);
          setPageSize(newPageSize);
        }}
        onSortingChange={handleSortingChange}
        isLoading={loading}
        isError={!!error}
        errorMessage={error || undefined}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};