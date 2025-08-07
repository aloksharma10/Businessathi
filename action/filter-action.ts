"use server";

import prisma from "@/lib/db";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Prisma, Product, LocalProduct, Invoice, Customer, LocalInvoice, LocalCustomer, LocalCustomPrice, CustomPrice } from "@prisma/client";

// Types for filter parameters
export interface InvoiceFilterParams {
  userId: string;
  invoiceType: "gst" | "local";
  month?: string;
  customerId?: string;
  globalSearch?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PricedProduct {
  productId: string;
  productName: string;
  qty: number;
  rate: number;
  taxableValue?: string;
  cgstAmt?: string;
  sgstAmt?: string;
  productTotalValue: string;
  cgstRate?: number;
  sgstRate?: number;
}

export interface FilteredInvoiceData {
  id: string;
  invoiceNo: string;
  invoiceDate: Date;
  monthOf: string;
  yearOf: string;
  customerName: string;
  address: string;
  totalInvoiceValue: string;
  totalTaxGST?: string;
  totalTaxableValue?: string;
  isOutsideDelhiInvoice?: boolean;
  gstIn?: string;
  state?: string;
  stateCode?: number;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  pricedProducts: PricedProduct[];
}

// Types for customer filter parameters
export interface CustomerFilterParams {
  userId: string;
  customerType: "gst" | "local";
  globalSearch?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "customerName";
  sortOrder?: "asc" | "desc";
}

export interface FilteredCustomerData {
  id: string;
  userId: string;
  customerName: string;
  address: string;
  gstIn: string;
  state: string;
  stateCode: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilteredLocalCustomerData {
  id: string;
  userId: string;
  customerName: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types for product filter parameters
export interface ProductFilterParams {
  userId: string;
  productType: "gst" | "local";
  globalSearch?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "productName";
  sortOrder?: "asc" | "desc";
}

export interface FilteredProductData {
  id: string;
  userId: string;
  productName: string;
  hsnCode: number;
  cgstRate: number;
  sgstRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilteredLocalProductData {
  id: string;
  userId: string;
  productName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Main filter function for both GST and Local invoices
export const filterInvoices = async (params: InvoiceFilterParams) => {
  try {
    const {
      userId,
      invoiceType,
      month,
      customerId,
      globalSearch,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 15,
      sortBy = invoiceType === "gst" ? "invoiceNo" : "localInvoiceNo",
      sortOrder = "desc",
    } = params;

    const skip = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions: Prisma.InvoiceWhereInput | Prisma.LocalInvoiceWhereInput = {
      userId,
    };

    // Add month filter
    if (month) {
      whereConditions.monthOf = month;
    }

    // Add customer filter
    if (customerId) {
      whereConditions.customerId = customerId;
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      if (invoiceType === "gst") {
        (whereConditions as Prisma.InvoiceWhereInput).invoiceDate = {
          gte: dateFrom || undefined,
          lte: dateTo,
        };
      } else {
        (whereConditions as Prisma.LocalInvoiceWhereInput).localInvoiceDate = {
          gte: dateFrom,
          lte: dateTo || undefined,
        };
      }
    }

    // Add global search filter
    if (globalSearch) {
      const searchConditions: (Prisma.InvoiceWhereInput | Prisma.LocalInvoiceWhereInput)[] = [
        {
          customer: {
            customerName: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
        },
        {
          customer: {
            address: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
        },
      ];

      if (invoiceType === "gst") {
        searchConditions.push({
          invoiceNo: {
            contains: globalSearch,
            mode: "insensitive" as const,
          },
        });
      } else {
        searchConditions.push({
          localInvoiceNo: {
            contains: globalSearch,
            mode: "insensitive" as const,
          },
        });
      }

      if (invoiceType === "gst") {
        (whereConditions as Prisma.InvoiceWhereInput).OR = searchConditions as Prisma.InvoiceWhereInput[];
      } else {
        (whereConditions as Prisma.LocalInvoiceWhereInput).OR = searchConditions as Prisma.LocalInvoiceWhereInput[];
      }
    }

    // Get filtered invoices with customer data based on invoice type
    let invoices: (Invoice & { customer: Customer; pricedProducts: (CustomPrice & { product: Product; })[]; } | LocalInvoice & { customer: LocalCustomer; pricedProducts: (LocalCustomPrice & { product: LocalProduct; })[]; })[] = [];
    let totalCount = 0;

    if (invoiceType === "gst") {
      invoices = await prisma.invoice.findMany({
        where: whereConditions as Prisma.InvoiceWhereInput,
        include: {
          customer: true,
          pricedProducts: {
            include: {
              product: true,
            },
          },
        },
        orderBy: sortBy === "customer.customerName" 
          ? { customer: { customerName: sortOrder } }
          : sortBy === "customer.address"
          ? { customer: { address: sortOrder } }
          : { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }) as (Invoice & { customer: Customer; pricedProducts: (CustomPrice & { product: Product; })[]; })[];

      totalCount = await prisma.invoice.count({
        where: whereConditions as Prisma.InvoiceWhereInput,
      });
    } else {
      invoices = await prisma.localInvoice.findMany({
        where: whereConditions as Prisma.LocalInvoiceWhereInput,
        include: {
          customer: true,
          pricedProducts: {
            include: {
              product: true,
            },
          },
        },
        orderBy: sortBy === "customer.customerName" 
          ? { customer: { customerName: sortOrder } }
          : sortBy === "customer.address"
          ? { customer: { address: sortOrder } }
          : { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }) as (LocalInvoice & { customer: LocalCustomer; pricedProducts: (LocalCustomPrice & { product: LocalProduct; })[]; })[];

      totalCount = await prisma.localInvoice.count({
        where: whereConditions as Prisma.LocalInvoiceWhereInput,
      });
    }

    // Transform data to consistent format
    const transformedInvoices: FilteredInvoiceData[] = invoices.map(
      (invoice) => {
        if (invoiceType === "gst") {
          const gstInvoice = invoice as Invoice & { customer: Customer; pricedProducts: (CustomPrice & { product: Product; })[]; };
          return {
            id: gstInvoice.id,
            invoiceNo: gstInvoice.invoiceNo,
            invoiceDate: gstInvoice.invoiceDate,
            monthOf: gstInvoice.monthOf,
            yearOf: gstInvoice.yearOf,
            customerName: gstInvoice.customer.customerName,
            address: gstInvoice.customer.address,
            totalInvoiceValue: gstInvoice.totalInvoiceValue,
            totalTaxGST: gstInvoice.totalTaxGST,
            totalTaxableValue: gstInvoice.totalTaxableValue,
            isOutsideDelhiInvoice: gstInvoice.isOutsideDelhiInvoice,
            gstIn: gstInvoice.customer.gstIn,
            state: gstInvoice.customer.state,
            stateCode: gstInvoice.customer.stateCode,
            customerId: gstInvoice.customerId,
            createdAt: gstInvoice.createdAt,
            updatedAt: gstInvoice.updatedAt,
            pricedProducts: gstInvoice.pricedProducts.map(pp => ({
              productId: pp.productId,
              productName: pp.product.productName,
              qty: pp.qty,
              rate: pp.rate,
              taxableValue: pp.taxableValue,
              cgstAmt: pp.cgstAmt,
              sgstAmt: pp.sgstAmt,
              productTotalValue: pp.productTotalValue,
              cgstRate: pp.product.cgstRate,
              sgstRate: pp.product.sgstRate,
            })),
          } as FilteredInvoiceData;
        } else {
          const localInvoice = invoice as LocalInvoice & { customer: LocalCustomer; pricedProducts: (LocalCustomPrice & { product: LocalProduct; })[]; };
          return {
            id: localInvoice.id,
            invoiceNo: localInvoice.localInvoiceNo,
            invoiceDate: localInvoice.localInvoiceDate,
            monthOf: localInvoice.monthOf,
            yearOf: localInvoice.yearOf,
            customerName: localInvoice.customer.customerName,
            address: localInvoice.customer.address,
            totalInvoiceValue: localInvoice.localTotalInvoiceValue,
            customerId: localInvoice.customerId,
            pricedProducts: localInvoice.pricedProducts.map(pp => ({
              productId: pp.productId,
              productName: pp.product.productName,
              qty: pp.qty,
              rate: pp.rate,
              productTotalValue: pp.productTotalValue,
            })),
            localTotalInvoiceValue: localInvoice.localTotalInvoiceValue,
            createdAt: localInvoice.createdAt,
            updatedAt: localInvoice.updatedAt,
          } as FilteredInvoiceData;
        }
      }
    );

    return {
      invoices: transformedInvoices,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error filtering invoices:", error);
    throw new Error("Failed to filter invoices");
  }
};

// Get unique months for filtering
export const getUniqueMonths = async (
  userId: string,
  invoiceType: "gst" | "local"
) => {
  try {
    let months: { monthOf: string }[] = [];

    if (invoiceType === "gst") {
      months = await prisma.invoice.findMany({
        where: { userId },
        select: { monthOf: true },
        distinct: ["monthOf"],
        orderBy: { monthOf: "asc" },
      });
    } else {
      months = await prisma.localInvoice.findMany({
        where: { userId },
        select: { monthOf: true },
        distinct: ["monthOf"],
        orderBy: { monthOf: "asc" },
      });
    }

    return months.map((item) => item.monthOf).filter(Boolean);
  } catch (error) {
    console.error("Error getting unique months:", error);
    return [];
  }
};

// Get unique customers for filtering
export const getUniqueCustomers = async (
  userId: string,
  invoiceType: "gst" | "local"
) => {
  try {
    let customers: ({ id: string; customerName: string; address: string; } | { id: string; customerName: string; address: string; })[] = [];

    if (invoiceType === "gst") {
      customers = await prisma.customer.findMany({
        where: { userId },
        select: {
          id: true,
          customerName: true,
          address: true,
        },
        orderBy: { customerName: "asc" },
      });
    } else {
      customers = await prisma.localCustomer.findMany({
        where: { userId },
        select: {
          id: true,
          customerName: true,
          address: true,
        },
        orderBy: { customerName: "asc" },
      });
    }

    return customers;
  } catch (error) {
    console.error("Error getting unique customers:", error);
    return [];
  }
};

// Export filtered invoices to XLSX
export const exportInvoicesToXLSX = async (params: InvoiceFilterParams) => {
  try {
    // Get all filtered invoices without pagination
    const { invoices } = await filterInvoices({
      ...params,
      page: 1,
      pageSize: 10000, // Large number to get all results
    });

    if (invoices.length === 0) {
      throw new Error("No invoices found for export");
    }

    // Transform data for export
    const exportData = invoices.map((invoice) => ({
      "Invoice No": invoice.invoiceNo,
      "Invoice Date": format(invoice.invoiceDate, "dd-MM-yyyy"),
      Month: invoice.monthOf,
      "Customer Name": invoice.customerName,
      Address: invoice.address,
      "Total Invoice Value": invoice.totalInvoiceValue,
      ...(params.invoiceType === "gst" && {
        "GST Number": invoice.gstIn || "",
        State: invoice.state || "",
        "State Code": invoice.stateCode || "",
        "Total Taxable Value": invoice.totalTaxableValue || "",
        "Total GST": invoice.totalTaxGST || "",
      }),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Invoice No
      { wch: 15 }, // Invoice Date
      { wch: 12 }, // Month
      { wch: 8 }, // Year
      { wch: 25 }, // Customer Name
      { wch: 40 }, // Address
      { wch: 20 }, // Total Invoice Value
      ...(params.invoiceType === "gst"
        ? [
            { wch: 20 }, // GST Number
            { wch: 15 }, // State
            { wch: 12 }, // State Code
            { wch: 20 }, // Total Taxable Value
            { wch: 15 }, // Total GST
            { wch: 12 }, // Outside Delhi
          ]
        : []),
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    const sheetName = `${params.invoiceType.toUpperCase()} Invoices`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `${params.invoiceType}_invoices_${timestamp}.xlsx`;

    return {
      buffer,
      filename,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } catch (error) {
    console.error("Error exporting invoices to XLSX:", error);
    throw new Error("Failed to export invoices");
  }
};

// Export filtered invoices to CSV
export const exportInvoicesToCSV = async (params: InvoiceFilterParams) => {
  try {
    // Get all filtered invoices without pagination
    const { invoices } = await filterInvoices({
      ...params,
      page: 1,
      pageSize: 10000, // Large number to get all results
    });

    if (invoices.length === 0) {
      throw new Error("No invoices found for export");
    }

    // Define headers
    const headers = [
      "Invoice No",
      "Invoice Date",
      "Month",
      "Year",
      "Customer Name",
      "Address",
      "Total Invoice Value",
      ...(params.invoiceType === "gst"
        ? [
            "GST Number",
            "State",
            "State Code",
            "Total Taxable Value",
            "Total GST",
            "Outside Delhi",
          ]
        : []),
    ];

    // Transform data for CSV
    const csvData = invoices.map((invoice) => [
      invoice.invoiceNo,
      format(invoice.invoiceDate, "dd/MM/yyyy"),
      invoice.monthOf,
      invoice.yearOf,
      invoice.customerName,
      invoice.address,
      invoice.totalInvoiceValue,
      ...(params.invoiceType === "gst"
        ? [
            invoice.gstIn || "",
            invoice.state || "",
            invoice.stateCode || "",
            invoice.totalTaxableValue || "",
            invoice.totalTaxGST || "",
            invoice.isOutsideDelhiInvoice ? "Yes" : "No",
          ]
        : []),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `${params.invoiceType}_invoices_${timestamp}.csv`;

    return {
      content: csvContent,
      filename,
      contentType: "text/csv",
    };
  } catch (error) {
    console.error("Error exporting invoices to CSV:", error);
    throw new Error("Failed to export invoices");
  }
};

// Get invoice statistics for dashboard
export const getInvoiceStatistics = async (
  userId: string,
  invoiceType: "gst" | "local"
) => {
  try {
    // Get current month statistics
    const currentMonth = format(new Date(), "MMMM");
    const currentYear = format(new Date(), "yyyy");

    let currentMonthTotal = 0;
    let totalInvoices = 0;
    let totalValue = 0;
    let monthlyBreakdown: { month: string; total: number; count: number }[] = [];

    if (invoiceType === "gst") {
      // Get current month invoices
      const currentMonthInvoices = await prisma.invoice.findMany({
        where: {
          userId,
          monthOf: currentMonth,
          yearOf: currentYear,
        },
      });

      currentMonthTotal = currentMonthInvoices.reduce(
        (sum: number, invoice) =>
          sum + parseFloat(invoice.totalInvoiceValue || "0"),
        0
      );

      // Get total statistics
      totalInvoices = await prisma.invoice.count({ where: { userId } });

      const allInvoices = await prisma.invoice.findMany({
        where: { userId },
      });

      totalValue = allInvoices.reduce(
        (sum: number, invoice) =>
          sum + parseFloat(invoice.totalInvoiceValue || "0"),
        0
      );

      // Get monthly breakdown for current year
      const monthlyInvoices = await prisma.invoice.findMany({
        where: {
          userId,
          yearOf: currentYear,
        },
        select: {
          monthOf: true,
          totalInvoiceValue: true,
        },
      });

      // Group by month manually
      const monthlyMap = new Map<string, { total: number; count: number }>();
      monthlyInvoices.forEach((invoice) => {
        const month = invoice.monthOf;
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { total: 0, count: 0 });
        }
        monthlyMap.get(month)!.total += parseFloat(
          invoice.totalInvoiceValue || "0"
        );
        monthlyMap.get(month)!.count += 1;
      });

      monthlyBreakdown = Array.from(monthlyMap.entries()).map(
        ([month, data]) => ({
          month,
          total: data.total,
          count: data.count,
        })
      );
    } else {
      // Get current month invoices
      const currentMonthInvoices = await prisma.localInvoice.findMany({
        where: {
          userId,
          monthOf: currentMonth,
          yearOf: currentYear,
        },
      });

      currentMonthTotal = currentMonthInvoices.reduce(
        (sum: number, invoice) =>
          sum + parseFloat(invoice.localTotalInvoiceValue || "0"),
        0
      );

      // Get total statistics
      totalInvoices = await prisma.localInvoice.count({ where: { userId } });

      const allInvoices = await prisma.localInvoice.findMany({
        where: { userId },
      });

      totalValue = allInvoices.reduce(
        (sum: number, invoice) =>
          sum + parseFloat(invoice.localTotalInvoiceValue || "0"),
        0
      );

      // Get monthly breakdown for current year
      const monthlyInvoices = await prisma.localInvoice.findMany({
        where: {
          userId,
          yearOf: currentYear,
        },
        select: {
          monthOf: true,
          localTotalInvoiceValue: true,
        },
      });

      // Group by month manually
      const monthlyMap = new Map<string, { total: number; count: number }>();
      monthlyInvoices.forEach((invoice) => {
        const month = invoice.monthOf;
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { total: 0, count: 0 });
        }
        monthlyMap.get(month)!.total += parseFloat(
          invoice.localTotalInvoiceValue || "0"
        );
        monthlyMap.get(month)!.count += 1;
      });

      monthlyBreakdown = Array.from(monthlyMap.entries()).map(
        ([month, data]) => ({
          month,
          total: data.total,
          count: data.count,
        })
      );
    }

    return {
      currentMonthTotal,
      totalInvoices,
      totalValue,
      monthlyBreakdown,
    };
  } catch (error) {
    console.error("Error getting invoice statistics:", error);
    throw new Error("Failed to get invoice statistics");
  }
};

// Filter customers
export const filterCustomers = async (params: CustomerFilterParams) => {
  try {
    const {
      userId,
      customerType,
      globalSearch,
      page = 1,
      pageSize = 15,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const skip = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions: Prisma.CustomerWhereInput | Prisma.LocalCustomerWhereInput = {
      userId,
    };

    // Add global search filter
    if (globalSearch) {
      if (customerType === "gst") {
        (whereConditions as Prisma.CustomerWhereInput).OR = [
          {
            customerName: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
          {
            address: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
          {
            gstIn: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
          {
            state: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
        ];
      } else {
        (whereConditions as Prisma.LocalCustomerWhereInput).OR = [
          {
            customerName: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
          {
            address: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
        ];
      }
    }

    // Get filtered customers
    let customers: (Customer | LocalCustomer)[] = [];
    let totalCount = 0;

    if (customerType === "gst") {
      customers = await prisma.customer.findMany({
        where: whereConditions as Prisma.CustomerWhereInput,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: pageSize,
      });

      totalCount = await prisma.customer.count({
        where: whereConditions as Prisma.CustomerWhereInput,
      });
    } else {
      customers = await prisma.localCustomer.findMany({
        where: whereConditions as Prisma.LocalCustomerWhereInput,
        orderBy: {
          customerName: sortOrder, // LocalCustomer does not have createdAt to sort by
        },
        skip,
        take: pageSize,
      });

      totalCount = await prisma.localCustomer.count({
        where: whereConditions as Prisma.LocalCustomerWhereInput,
      });
    }

    // Transform data to consistent format
    const transformedCustomers: (FilteredCustomerData | FilteredLocalCustomerData)[] = customers.map((customer) => {
      if (customerType === "gst") {
        const gstCustomer = customer as Customer;
        return {
          id: gstCustomer.id,
          userId: gstCustomer.userId,
          customerName: gstCustomer.customerName,
          address: gstCustomer.address,
          gstIn: gstCustomer.gstIn,
          state: gstCustomer.state,
          stateCode: gstCustomer.stateCode,
          createdAt: gstCustomer.createdAt,
          updatedAt: gstCustomer.updatedAt,
        } as FilteredCustomerData;
      } else {
        const localCustomer = customer as LocalCustomer;
        return {
          id: localCustomer.id,
          userId: localCustomer.userId || '',
          customerName: localCustomer.customerName,
          address: localCustomer.address,
          createdAt: localCustomer.createdAt,
          updatedAt: localCustomer.updatedAt,
        } as FilteredLocalCustomerData;
      }
    });

    return {
      customers: transformedCustomers,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error filtering customers:", error);
    throw new Error("Failed to filter customers");
  }
};

// Filter products
export const filterProducts = async (params: ProductFilterParams) => {
  try {
    const {
      userId,
      productType,
      globalSearch,
      page = 1,
      pageSize = 15,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const skip = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions: Prisma.ProductWhereInput | Prisma.LocalProductWhereInput = {
      userId,
    };

    // Add global search filter
    if (globalSearch) {
      if (productType === "gst") {
        (whereConditions as Prisma.ProductWhereInput).OR = [
          {
            productName: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
          {
            hsnCode: {
              equals: isNaN(Number(globalSearch))
                ? undefined
                : Number(globalSearch),
            },
          },
        ];
      } else {
        (whereConditions as Prisma.LocalProductWhereInput).OR = [
          {
            productName: {
              contains: globalSearch,
              mode: "insensitive" as const,
            },
          },
        ];
      }
    }

    // Get filtered products
    let products: (Product | LocalProduct)[] = [];
    let totalCount = 0;

    if (productType === "gst") {
      products = await prisma.product.findMany({
        where: whereConditions as Prisma.ProductWhereInput,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: pageSize,
      });

      totalCount = await prisma.product.count({
        where: whereConditions as Prisma.ProductWhereInput,
      });
    } else {
      products = await prisma.localProduct.findMany({
        where: whereConditions as Prisma.LocalProductWhereInput,
        orderBy: {
          productName: sortOrder, // LocalProduct does not have hsnCode, cgstRate, sgstRate to sort by
        },
        skip,
        take: pageSize,
      });

      totalCount = await prisma.localProduct.count({
        where: whereConditions as Prisma.LocalProductWhereInput,
      });
    }

    // Transform data to consistent format
    const transformedProducts: (FilteredProductData | FilteredLocalProductData)[] = products.map((product) => {
      if (productType === "gst") {
        const gstProduct = product as Product;
        return {
          id: gstProduct.id,
          userId: gstProduct.userId,
          productName: gstProduct.productName,
          hsnCode: gstProduct.hsnCode,
          cgstRate: gstProduct.cgstRate,
          sgstRate: gstProduct.sgstRate,
          createdAt: gstProduct.createdAt,
          updatedAt: gstProduct.updatedAt,
        } as FilteredProductData;
      } else {
        const localProduct = product as LocalProduct;
        return {
          id: localProduct.id,
          userId: localProduct.userId || '', // Assuming userId can be null for LocalProduct
          productName: localProduct.productName,
          createdAt: localProduct.createdAt,
          updatedAt: localProduct.updatedAt,
        } as FilteredLocalProductData;
      }
    });

    return {
      products: transformedProducts,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error filtering products:", error);
    throw new Error("Failed to filter products");
  }
};

// Export customers to XLSX
export const exportCustomersToXLSX = async (params: CustomerFilterParams) => {
  try {
    // Get all filtered customers without pagination
    const { customers } = await filterCustomers({
      ...params,
      page: 1,
      pageSize: 10000, // Large number to get all results
    });

    if (customers.length === 0) {
      throw new Error("No customers found for export");
    }

    // Transform data for export
    const exportData = customers.map((customer) => {
      if (params.customerType === "gst") {
        const gstCustomer = customer as FilteredCustomerData;
        return {
          "Customer Name": gstCustomer.customerName,
          Address: gstCustomer.address,
          "GST Number": gstCustomer.gstIn,
          State: gstCustomer.state,
          "State Code": gstCustomer.stateCode,
          "Created Date": format(gstCustomer.createdAt, "dd/MM/yyyy"),
        };
      } else {
        const localCustomer = customer as FilteredLocalCustomerData;
        return {
          "Customer Name": localCustomer.customerName,
          Address: localCustomer.address,
          "Created Date": format(localCustomer.createdAt, "dd/MM/yyyy"),
        };
      }
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Customer Name
      { wch: 40 }, // Address
      ...(params.customerType === "gst"
        ? [
            { wch: 20 }, // GST Number
            { wch: 15 }, // State
            { wch: 12 }, // State Code
          ]
        : []),
      { wch: 15 }, // Created Date
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `customers_${params.customerType}_${timestamp}.xlsx`;

    return {
      buffer,
      filename,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } catch (error) {
    console.error("Error exporting customers to XLSX:", error);
    throw new Error("Failed to export customers");
  }
};

// Export customers to CSV
export const exportCustomersToCSV = async (params: CustomerFilterParams) => {
  try {
    // Get all filtered customers without pagination
    const { customers } = await filterCustomers({
      ...params,
      page: 1,
      pageSize: 10000, // Large number to get all results
    });

    if (customers.length === 0) {
      throw new Error("No customers found for export");
    }

    // Define headers
    const headers = [
      "Customer Name",
      "Address",
      ...(params.customerType === "gst"
        ? [
            "GST Number",
            "State",
            "State Code",
          ]
        : []),
      "Created Date",
    ];

    // Transform data for CSV
    const csvData = customers.map((customer) => {
      if (params.customerType === "gst") {
        const gstCustomer = customer as FilteredCustomerData;
        return [
          gstCustomer.customerName,
          gstCustomer.address,
          gstCustomer.gstIn,
          gstCustomer.state,
          gstCustomer.stateCode,
          format(gstCustomer.createdAt, "dd/MM/yyyy"),
        ];
      } else {
        const localCustomer = customer as FilteredLocalCustomerData;
        return [
          localCustomer.customerName,
          localCustomer.address,
          format(localCustomer.createdAt, "dd/MM/yyyy"),
        ];
      }
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `customers_${params.customerType}_${timestamp}.csv`;

    return {
      content: csvContent,
      filename,
      contentType: "text/csv",
    };
  } catch (error) {
    console.error("Error exporting customers to CSV:", error);
    throw new Error("Failed to export customers");
  }
};

// Export products to XLSX
export const exportProductsToXLSX = async (params: ProductFilterParams) => {
  try {
    // Get all filtered products without pagination
    const { products } = await filterProducts({
      ...params,
      page: 1,
      pageSize: 10000, // Large number to get all results
    });

    if (products.length === 0) {
      throw new Error("No products found for export");
    }

    // Transform data for export
    const exportData = products.map((product) => {
      if (params.productType === "gst") {
        const gstProduct = product as FilteredProductData;
        return {
          "Product Name": gstProduct.productName,
          "HSN Code": gstProduct.hsnCode,
          "CGST Rate": gstProduct.cgstRate,
          "SGST Rate": gstProduct.sgstRate,
          "Total GST Rate": gstProduct.cgstRate + gstProduct.sgstRate,
          "Created Date": format(gstProduct.createdAt, "dd/MM/yyyy"),
        };
      } else {
        const localProduct = product as FilteredLocalProductData;
        return {
          "Product Name": localProduct.productName,
          "Created Date": format(localProduct.createdAt, "dd/MM/yyyy"),
        };
      }
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Product Name
      ...(params.productType === "gst"
        ? [
            { wch: 12 }, // HSN Code
            { wch: 12 }, // CGST Rate
            { wch: 12 }, // SGST Rate
            { wch: 15 }, // Total GST Rate
          ]
        : []),
      { wch: 15 }, // Created Date
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `products_${params.productType}_${timestamp}.xlsx`;

    return {
      buffer,
      filename,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } catch (error) {
    console.error("Error exporting products to XLSX:", error);
    throw new Error("Failed to export products");
  }
};

// Export products to CSV
export const exportProductsToCSV = async (params: ProductFilterParams) => {
  try {
    // Get all filtered products without pagination
    const { products } = await filterProducts({
      ...params,
      page: 1,
      pageSize: 10000, // Large number to get all results
    });

    if (products.length === 0) {
      throw new Error("No products found for export");
    }

    // Define headers
    const headers = params.productType === "gst" ? [
      "Product Name",
      "HSN Code",
      "CGST Rate",
      "SGST Rate",
      "Total GST Rate",
      "Created Date",
    ] : [
      "Product Name",
      "Created Date",
    ];

    // Transform data for CSV
    const csvData = products.map((product) => {
      if (params.productType === "gst") {
        const gstProduct = product as FilteredProductData;
        return [
          gstProduct.productName,
          gstProduct.hsnCode,
          gstProduct.cgstRate,
          gstProduct.sgstRate,
          gstProduct.cgstRate + gstProduct.sgstRate,
          format(gstProduct.createdAt, "dd/MM/yyyy"),
        ];
      } else {
        const localProduct = product as FilteredLocalProductData;
        return [
          localProduct.productName,
          format(localProduct.createdAt, "dd/MM/yyyy"),
        ];
      }
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `products_${params.productType}_${timestamp}.csv`;

    return {
      content: csvContent,
      filename,
      contentType: "text/csv",
    };
  } catch (error) {
    console.error("Error exporting products to CSV:", error);
    throw new Error("Failed to export products");
  }
};
