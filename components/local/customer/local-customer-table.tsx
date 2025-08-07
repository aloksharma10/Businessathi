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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { useCustomerFilter } from "@/hooks/use-customer-filter";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { XCircle, ArrowUpDown } from "lucide-react";
import * as React from "react";
import { FilteredCustomerData, FilteredLocalCustomerData } from "@/action/filter-action";

export const LocalCustomerTable = () => {
  const { onOpen, registerRefreshCallback, unregisterRefreshCallback } = useModal();
  const { data: session } = useSession();
  const [filterState, setFilterState] = React.useState({
    globalSearch: "",
  });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const {
    customers,
    totalCount,
    pageCount,
    loading,
    error,
    filterCustomers,
  } = useCustomerFilter(session?.user?.id || "");

  React.useEffect(() => {
    if (session?.user?.id) {
      filterCustomers({
        userId: session.user.id,
        page,
        pageSize,
        globalSearch: filterState.globalSearch,
        customerType: "local",
      });
    }
  }, [session?.user?.id, filterState, page, pageSize, filterCustomers]);

  // Function to refetch data after successful operations
  const refetchData = React.useCallback(() => {
    if (session?.user?.id) {
      filterCustomers({
        userId: session.user.id,
        page,
        pageSize,
        globalSearch: filterState.globalSearch,
        customerType: "local",
      });
    }
  }, [session?.user?.id, filterState, page, pageSize, filterCustomers]);

  // Register refresh callback
  React.useEffect(() => {
    registerRefreshCallback("local-customers", refetchData);
    return () => {
      unregisterRefreshCallback("local-customers");
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

  const columns: ColumnDef<FilteredCustomerData | FilteredLocalCustomerData>[] = [
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
      id: "customerName",
      accessorKey: "customerName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("customerName")}</div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("address")}</div>
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
                  onOpen("editLocalCustomer", { localCustomer: row.original as FilteredLocalCustomerData })
                }
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit customer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onOpen("deleteLocalCustomer", { localCustomer: row.original as FilteredLocalCustomerData })
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete customer
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
              <Button variant="ghost" size="icon" onClick={handleResetFilters} aria-label="Reset filters">
                <XCircle className="w-5 h-5 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset filters</TooltipContent>
          </Tooltip>
        )}
      </div>
      <DataTable
        manualPagination={true}
        manualFiltering={false}
        columns={columns}
        data={customers}
        count={totalCount}
        page={page - 1}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizeOptions={[10, 15, 20, 25]}
        advancedFilter={false}
        showGlobalFilter={false}
        searchPlaceholder="Search by customer name or address"
        searchableColumns={[
          { id: "customerName", title: "Customer Name" },
          { id: "address", title: "Address" },
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
