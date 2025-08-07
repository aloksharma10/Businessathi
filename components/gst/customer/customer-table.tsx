"use client";

import { Customer } from "@prisma/client";
import { useModal } from "@/store/store";
import { DataTable } from "@/components/data-table/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  XCircle,
} from "lucide-react";
import { useCustomerFilter } from "@/hooks/use-customer-filter";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";
import {
  FilteredCustomerData,
  FilteredLocalCustomerData,
} from "@/action/filter-action";

export const CustomerTable = () => {
  const { onOpen, registerRefreshCallback, unregisterRefreshCallback } =
    useModal();
  const { data: session } = useSession();
  const [filterState, setFilterState] = React.useState<{
    globalSearch: string;
  }>({
    globalSearch: "",
  });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15); // Default page size

  const {
    customers,
    totalCount,
    pageCount,
    loading,
    error,
    filterCustomers,
    exportToXLSX,
    exportToCSV,
  } = useCustomerFilter(session?.user?.id || "");

  React.useEffect(() => {
    if (session?.user?.id) {
      filterCustomers({
        userId: session?.user?.id || "",
        page,
        pageSize,
        globalSearch: filterState.globalSearch,
        customerType: "gst",
      });
    }
  }, [session?.user?.id, filterState, page, filterCustomers, pageSize]);

  // Function to refetch data after successful operations
  const refetchData = React.useCallback(() => {
    if (session?.user?.id) {
      filterCustomers({
        userId: session?.user?.id || "",
        page,
        pageSize,
        globalSearch: filterState.globalSearch,
        customerType: "gst",
      });
    }
  }, [session?.user?.id, filterState, page, pageSize, filterCustomers]);

  // Register refresh callback
  React.useEffect(() => {
    registerRefreshCallback("gst-customers", refetchData);
    return () => {
      unregisterRefreshCallback("gst-customers");
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
          customerType: "gst",
          userId: session?.user?.id || "",
        });
        toast.success("XLSX export completed");
      } else {
        await exportToCSV({
          globalSearch: filterState.globalSearch,
          customerType: "gst",
          userId: session?.user?.id || "",
        });
        toast.success("CSV export completed");
      }
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const columns: ColumnDef<FilteredCustomerData | FilteredLocalCustomerData>[] =
    [
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
        accessorKey: "customerName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Customer Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <div>{row.getValue("customerName")}</div>,
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("address")}</div>
        ),
      },
      {
        accessorKey: "gstIn",
        header: "GSTIN/UIN",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("gstIn")}</div>
        ),
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("state")}</div>
        ),
      },
      {
        accessorKey: "stateCode",
        header: "State Code",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("stateCode")}</div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        enableSorting: false,
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
                  onClick={() =>
                    onOpen("editCustomer", {
                      customer: row.original as Customer,
                    })
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onOpen("deleteCustomer", {
                      customer: row.original as Customer,
                    })
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
          placeholder="Search customers..."
          value={filterState.globalSearch}
          onChange={handleSearch}
          className="max-w-sm"
        />
        {isFilterActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetFilters}
                aria-label="Reset filters"
              >
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
            <DropdownMenuItem onClick={() => handleExport("xlsx")}>
              Export XLSX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DataTable
        showCalender={false}
        manualPagination={true}
        manualFiltering={false}
        columns={columns}
        data={customers}
        count={totalCount}
        page={page - 1}
        pageCount={pageCount}
        pageSize={pageSize}
        advancedFilter={false}
        showGlobalFilter={false}
        searchPlaceholder="Search by customer name, address, GST number, or state"
        searchableColumns={[
          { id: "customerName", title: "Customer Name" },
          { id: "address", title: "Address" },
          { id: "gstIn", title: "GST Number" },
          { id: "state", title: "State" },
        ]}
        selectable={true}
        bulkActions={[]}
        showDownload={false}
        dateRangeFilter={false}
        defaultSort={[
          {
            id: "createdAt",
            desc: true,
          },
        ]}
        defaultVisibility={{
          address: false, // Hide address column by default
        }}
        onPaginationChange={({ pageIndex, pageSize: newPageSize }) => {
          setPage(pageIndex + 1);
          setPageSize(newPageSize);
        }}
        pageSizeOptions={[15, 25, 50, 100]}
        isLoading={loading}
        isError={!!error}
        errorMessage={error || undefined}
      />
    </div>
  );
};
