"use client";

import { useModal } from "@/store/store";
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
  LoaderCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  downloadButtonInColumn,
  downloadInvoicePDF,
  formatCurrencyForIndia,
} from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import { useInvoiceFilter } from "@/hooks/use-invoice-filter";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { toast } from "sonner";
import { LocalInvoice, LocalCustomer } from "@prisma/client";
import HoverCardToolTip from "@/components/hover-card-tooltip";

interface FilterState {
  month?: string;
  customerId?: string;
  globalSearch?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const LocalInvoiceTableWithFilter = () => {
  const { onOpen, registerRefreshCallback, unregisterRefreshCallback } =
    useModal();
  const { data: session } = useSession();
  const [filterState, setFilterState] = useState<FilterState>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { invoices, totalCount, currentPage, loading, filterInvoices } =
    useInvoiceFilter(session?.user?.id || "");

  const loadFilterOptions = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      // Assuming getMonths and getCustomers are defined elsewhere or will be added.
      // For now, they are placeholders.
      // const [months, customers] = await Promise.all([
      //   getMonths("local"),
      //   getCustomers("local"),
      // ]);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  }, [session?.user?.id]);

  // Load initial data and filter options
  useEffect(() => {
    if (session?.user?.id) {
      loadFilterOptions();
      // Apply initial filter with all invoices
      filterInvoices({
        invoiceType: "local",
        page: 1,
        pageSize: 10,
      });
    }
  }, [session?.user?.id, filterInvoices, loadFilterOptions]);

  // Function to refetch data after successful operations
  const refetchData = useCallback(() => {
    if (session?.user?.id) {
      filterInvoices({
        invoiceType: "local",
        page: page,
        pageSize: pageSize,
        ...filterState,
      });
    }
  }, [session?.user?.id, page, pageSize, filterState, filterInvoices]);

  // Refetch data when page or pageSize changes
  useEffect(() => {
    if (session?.user?.id) {
      filterInvoices({
        invoiceType: "local",
        page: page,
        pageSize: pageSize,
        ...filterState,
      });
    }
  }, [session?.user?.id, page, pageSize, filterState, filterInvoices]);

  // Register refresh callback
  useEffect(() => {
    registerRefreshCallback("local-invoices", refetchData);
    return () => {
      unregisterRefreshCallback("local-invoices");
    };
  }, [registerRefreshCallback, unregisterRefreshCallback, refetchData]);

  // Apply filters
  const applyFilters = async (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filterState, ...newFilters };
    setFilterState(updatedFilters);
    setPage(1); // Reset to first page when filters change

    try {
      await filterInvoices({
        invoiceType: "local",
        page: 1,
        pageSize: pageSize,
        ...updatedFilters,
      });
    } catch (err) {
      toast.error(
        `Failed to apply filters: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  // Handle pagination change
  const handlePaginationChange = useCallback(({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setPage(pageIndex + 1);
    setPageSize(newPageSize);
  }, []);

  // Bulk download selected invoices as a single PDF
  const handleBulkDownload = async (
    selectedInvoices: FilteredInvoiceData[]
  ) => {
    const selectedInvoiceIds = selectedInvoices.map((invoice) => invoice.id);
    if (selectedInvoiceIds.length === 0) {
      toast.error("No invoices selected for bulk PDF download.");
      return;
    }
    try {
      const queryParams = new URLSearchParams();
      selectedInvoiceIds.forEach((id) => queryParams.append("ids", id));
      const response = await fetch(
        `/api/invoice/local/download-pdf?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to download bulk PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `selected_local_invoices.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading bulk PDF:", err);
      toast.error(
        `Error downloading bulk PDF: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleBulkEdit = (selectedInvoices: FilteredInvoiceData[]) => {
    console.log("Bulk edit selected invoices:", selectedInvoices);
  };

  const columns: ColumnDef<FilteredInvoiceData>[] = [
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
      accessorKey: "invoiceNo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="hover:bg-slate-800 hover:text-white text-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Invoice No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const id = row.original.id;
        const invoiceNo = row.original.invoiceNo;
        return (
          <div className="flex items-center justify-center">
            {row.getValue("invoiceNo")}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="cursor-pointer"
                  onClick={() =>
                    downloadButtonInColumn({
                      invoiceId: id,
                      invoiceNo,
                      invoiceType: "local",
                    })
                  }
                  variant={"link"}
                  size={"icon"}
                >
                  <Download className="ml-2 h-4 w-4 text-green-600" />
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
      cell: ({ row }) => {
        const dateValue = row.original.invoiceDate;
        if (!dateValue) return null;
        return (
          <div className="text-center">
            {format(new Date(dateValue), "dd-MM-yyyy")}
          </div>
        );
      },
    },
    {
      accessorKey: "monthOf",
      header: () => {
        return <div className="text-center">Month</div>;
      },
      cell: ({ row }) => (
        <div className="capitalize text-center">{row.getValue("monthOf")}</div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("customerName")}</div>
      ),
    },
    {
      accessorKey: "product",
      header: "Products",
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
                  <div key={index} className="flex justify-between items-center w-full">
                    <span className="capitalize font-semibold">{product.productName}</span>
                    <span className="text-sm text-gray-500">Qty: {product.qty}, Rate: {product.rate}</span>
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
      accessorKey: "totalInvoiceValue", // Updated to totalInvoiceValue
      header: () => {
        return <div className="text-center">Total Invoice Value</div>;
      },
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {formatCurrencyForIndia(row.getValue("totalInvoiceValue"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
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
              <DropdownMenuItem
                onClick={() => {
                  onOpen("editLocalInvoice", {
                    localInvoice: {
                      id: row.original.id,
                      localInvoiceNo: row.original.invoiceNo,
                      localInvoiceDate: row.original.invoiceDate as Date,
                      monthOf: row.original.monthOf,
                      yearOf: row.original.yearOf,
                      localTotalInvoiceValue: row.original.totalInvoiceValue,
                      userId: session?.user?.id || null,
                      customerId: row.original.customerId,
                      createdAt: row.original.createdAt,
                      updatedAt: row.original.updatedAt,
                      customer: {
                        id: row.original.customerId,
                        customerName: row.original.customerName,
                        address: row.original.address,
                        userId: session?.user?.id || null,
                        createdAt: row.original.createdAt,
                        updatedAt: row.original.updatedAt,
                      } as LocalCustomer,
                      pricedProducts: [],
                    } as LocalInvoice,
                  });
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit invoice
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  downloadInvoicePDF({
                    invoiceId: id,
                    invoiceNo,
                    invoiceType: "local",
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
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Global Search */}
            <div className="space-y-2">
              <Label htmlFor="global-search">Global Search</Label>
              <Input
                id="global-search"
                placeholder="Search by invoice number, customer name, or address"
                value={filterState.globalSearch || ""}
                onChange={(e) => applyFilters({ globalSearch: e.target.value })}
              />
            </div>

            {/* Month Filter */}
            {/* <div className="space-y-2">
              <Label htmlFor="month-filter">Month</Label>
              <Select
                value={filterState.month || ""}
                onValueChange={(value) => applyFilters({ month: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Months</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Customer Filter */}
            {/* <div className="space-y-2">
              <Label htmlFor="customer-filter">Customer</Label>
              <Select
                value={filterState.customerId || ""}
                onValueChange={(value) => applyFilters({ customerId: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Customers</SelectItem>
                  {availableCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={{
                  from: filterState.dateFrom,
                  to: filterState.dateTo,
                }}
                setDate={(range) => {
                  applyFilters({
                    dateFrom: range?.from,
                    dateTo: range?.to,
                  });
                }}
                disabledDates={[]}
              />
            </div>
          </div>

          {/* Export Buttons */}
          {/* <div className="flex gap-2 mt-4">
            <Button
              onClick={() => handleExport("xlsx")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export XLSX
            </Button>
            <Button
              onClick={() => handleExport("csv")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
          </div> */}
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
        manualSorting={false}
        manualFiltering={false}
        columns={columns}
        data={invoices}
        count={totalCount}
        page={page - 1}
        pageCount={Math.ceil(totalCount / pageSize)}
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
        onSelectionChange={() => {}} // No selection change needed here
        bulkActions={[
          {
            label: "Download Selected",
            action: handleBulkDownload,
            variant: "default",
          },
          {
            label: "Edit Selected",
            action: handleBulkEdit,
            variant: "outline",
          },
        ]}
        showDownload={false}
        dateRangeFilter={false}
        defaultDateRange={{
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date(),
        }}
        defaultSort={[
          {
            id: "invoiceDate",
            desc: true,
          },
        ]}
        defaultVisibility={{
          address: false, // Hide address column by default
        }}
        onPaginationChange={handlePaginationChange}
        pageSizeOptions={[10, 25, 50, 100]}
        isLoading={loading}
        isError={false}
        errorMessage={undefined}
      />
    </div>
  );
};
