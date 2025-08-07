"use client";

import { useModal } from "@/store/store";
import { LocalInvoice } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpDown,
  Download,
  MoreHorizontal,
  Pencil,
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
import { useState, useMemo } from "react";

// Extended type that includes the transformed data
type LocalInvoiceWithCustomer = LocalInvoice & {
  customerName: string;
  address: string;
  product?: string;
};

export const LocalInvoiceTable = ({
  invoices,
}: {
  invoices: LocalInvoiceWithCustomer[];
}) => {
  const { onOpen } = useModal();
  const [selectedRows, setSelectedRows] = useState<LocalInvoiceWithCustomer[]>([]);

  // Handle bulk actions
  const handleBulkDownload = async (selectedInvoices: LocalInvoiceWithCustomer[]) => {
    for (const invoice of selectedInvoices) {
      await downloadInvoicePDF({
        invoiceId: invoice.id,
        invoiceNo: invoice.localInvoiceNo,
        invoiceType: "local",
      });
    }
  };

  const handleBulkEdit = (selectedInvoices: LocalInvoiceWithCustomer[]) => {
    // Handle bulk edit - you can implement this based on your requirements
    console.log("Bulk edit selected invoices:", selectedInvoices);
  };

  const columns: ColumnDef<LocalInvoiceWithCustomer>[] = [
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
      accessorKey: "localInvoiceNo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="hover:bg-slate-800 hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Invoice No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const id = row.original.id;
        const invoiceNo = row.original.localInvoiceNo;
        return (
          <div className="flex items-center ml-8">
            {row.getValue("localInvoiceNo")}
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
      accessorKey: "localInvoiceDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="hover:bg-slate-800 hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Invoice Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>{format(row.getValue("localInvoiceDate"), "dd MMMM yyyy")}</div>
      ),
    },
    {
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="hover:bg-slate-800 hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Month
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      accessorKey: "monthOf",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("monthOf")}</div>
      ),
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="hover:bg-slate-800 hover:text-white"
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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="hover:bg-slate-800 hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Address
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("address")}</div>
      ),
    },
    {
      accessorKey: "localTotalInvoiceValue",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="hover:bg-slate-800 hover:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Invoice Value
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="capitalize">
          {formatCurrencyForIndia(row.getValue("localTotalInvoiceValue"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const { id } = row.original;
        const invoiceNo = row.original.localInvoiceNo;
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
                  onOpen("editLocalInvoice", { localInvoice: row.original })
                }
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

  // Get unique months for filtering
  const uniqueMonths = useMemo(() => {
    const months = invoices.map(invoice => invoice.monthOf).filter(Boolean);
    return [...new Set(months)].map(month => ({
      label: month,
      value: month,
    }));
  }, [invoices]);

  // Get unique customers for filtering
  const uniqueCustomers = useMemo(() => {
    const customers = invoices.map(invoice => invoice.customerName).filter(Boolean);
    return [...new Set(customers)].map(customer => ({
      label: customer,
      value: customer,
    }));
  }, [invoices]);

  return (
    <DataTable
      showCalender={true}
      manualPagination={false}
      manualSorting={false}
      manualFiltering={false}
      columns={columns}
      data={invoices}
      count={invoices.length}
      page={0}
      pageCount={Math.ceil(invoices.length / 15)}
      pageSize={15}
      advancedFilter={true}
      searchPlaceholder="Search by invoice number, customer name, or address"
      searchableColumns={[
        { id: "localInvoiceNo", title: "Invoice Number" },
        { id: "customerName", title: "Customer Name" },
        { id: "address", title: "Address" },
      ]}
      filterableColumns={[
        {
          id: "monthOf",
          title: "Month",
          options: uniqueMonths,
        },
        {
          id: "customerName",
          title: "Customer",
          options: uniqueCustomers,
        },
      ]}
      selectable={true}
      onSelectionChange={setSelectedRows}
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
      showDownload={true}
      dateRangeFilter={true}
      defaultDateRange={{
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      }}
      defaultSort={[
        {
          id: "localInvoiceDate",
          desc: true,
        },
      ]}
      defaultVisibility={{
        address: false, // Hide address column by default
      }}
    />
  );
};
