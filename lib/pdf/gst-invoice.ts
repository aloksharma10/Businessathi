import type { Prisma, Users } from "@prisma/client";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type {
  Content,
  TableCell,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import { formatCurrencyForIndia } from "../utils";
import { amountInWords, fixed2, num, stateCode, text } from "./format";
import {
  blankRow,
  INNER,
  labelledValue,
  NO_TOP,
  NONE,
  OUTER,
  ruledLayout,
} from "./layout";

export type GstInvoiceForPdf = Prisma.InvoiceGetPayload<{
  include: { customer: true; pricedProducts: { include: { product: true } } };
}>;

type Item = GstInvoiceForPdf["pricedProducts"][number];

const TIMEZONE = "Asia/Kolkata";
/** The Tally-style layout keeps the goods table a fixed height; pad short invoices. */
const MIN_ITEM_ROWS = 17;
const ROW_HEIGHT = 11;
const ITEM_WIDTHS = [28, "*", 52, 55, 55, 85];

const centered = (
  value: string,
  opts: { bold?: boolean; rowSpan?: number; colSpan?: number } = {}
): TableCell => ({ text: value, alignment: "center", ...opts });

/** Rates on the priced line win; fall back to the product's current rate. */
const rates = (item: Item) => ({
  cgst: item.cgstRate ?? item.product.cgstRate,
  sgst: item.sgstRate ?? item.product.sgstRate,
});

export function gstInvoiceDocument(
  invoices: GstInvoiceForPdf[],
  company: Users
): TDocumentDefinitions {
  return {
    pageSize: "A4",
    pageMargins: [36, 24, 36, 24],
    defaultStyle: { font: "Roboto", fontSize: 8, lineHeight: 1.1 },
    info: {
      title:
        invoices.length === 1
          ? `Invoice ${invoices[0].invoiceNo}`
          : "GST Invoices",
      author: text(company.companyName),
      creator: "Businessathi",
      producer: "Businessathi",
    },
    content: invoices.map((invoice, index) => ({
      stack: gstInvoiceContent(invoice, company),
      pageBreak: index > 0 ? "before" : undefined,
    })),
  };
}

export function gstInvoiceContent(
  invoice: GstInvoiceForPdf,
  company: Users
): Content[] {
  const totalCgst = invoice.pricedProducts.reduce(
    (sum, item) => sum + num(item.cgstAmt),
    0
  );
  const totalSgst = invoice.pricedProducts.reduce(
    (sum, item) => sum + num(item.sgstAmt),
    0
  );

  return [
    heading(),
    partiesSection(invoice, company),
    itemsSection(invoice, totalCgst, totalSgst),
    amountInWordsSection(invoice),
    hsnSummarySection(invoice, totalCgst, totalSgst),
    bankAndDeclarationSection(invoice, company),
    {
      text: "This is a Computer Generated Invoice",
      alignment: "center",
      margin: [0, 4, 0, 0],
    },
  ];
}

const heading = (): Content => ({
  columns: [
    { width: "*", text: "" },
    { width: "auto", text: "TAX INVOICE", bold: true, fontSize: 11 },
    {
      width: "*",
      text: "(ORIGINAL FOR RECIPIENT)",
      italics: true,
      alignment: "right",
      margin: [0, 3, 0, 0],
    },
  ],
  margin: [0, 0, 0, 4],
});

function partiesSection(invoice: GstInvoiceForPdf, company: Users): Content {
  const seller: Content = {
    stack: [
      { text: text(company.companyName).toUpperCase(), bold: true },
      { text: text(company.companyAddress).toUpperCase() },
      { text: `GSTIN/UIN : ${text(company.gstNo)}` },
      {
        text: `State Name : ${text(company.state)}, Code : ${stateCode(
          company.stateCode
        )}`,
      },
    ],
  };
  const buyer: Content = {
    stack: [
      { text: "Buyer (Bill to)" },
      { text: invoice.customer.customerName, bold: true },
      { text: invoice.customer.address },
      { text: `GSTIN/UIN : ${invoice.customer.gstIn}` },
      {
        text: `State Name : ${invoice.customer.state}, Code : ${stateCode(
          invoice.customer.stateCode
        )}`,
      },
    ],
  };
  const invoiceDate = format(
    toZonedTime(invoice.invoiceDate, TIMEZONE),
    "dd-MM-yyyy"
  );

  return {
    table: {
      widths: ["57%", "43%"],
      body: [
        [
          {
            table: { widths: ["*"], body: [[seller], [buyer]] },
            layout: ruledLayout({ h: INNER, v: NONE }),
          },
          {
            table: {
              widths: ["50%", "50%"],
              heights: [27, 27, 27, "auto"],
              body: [
                [
                  labelledValue("Invoice No.", invoice.invoiceNo),
                  labelledValue("Dated", invoiceDate),
                ],
                [
                  labelledValue(
                    "Month",
                    `${invoice.monthOf}, ${invoice.yearOf}`
                  ),
                  labelledValue("Mode/Terms of Payment"),
                ],
                [
                  labelledValue("Reference No. & Date"),
                  labelledValue("Other References"),
                ],
                [{ text: "Terms of Delivery", colSpan: 2 }, {}],
              ],
            },
            layout: ruledLayout({ h: INNER, v: INNER }),
          },
        ],
      ],
    },
    layout: ruledLayout({ padX: 0, padY: 0 }),
  };
}

function itemsSection(
  invoice: GstInvoiceForPdf,
  totalCgst: number,
  totalSgst: number
): Content {
  const items = invoice.pricedProducts;
  const header: TableCell[] = [
    "Sl No.",
    "Description of Goods",
    "HSN/SAC",
    "Quantity",
    "Rate",
    "Amount",
  ].map((label) => centered(label));

  const rows: TableCell[][] = items.map((item, i) => [
    centered(String(i + 1)),
    { text: item.product.productName, bold: true },
    centered(String(item.product.hsnCode)),
    centered(String(item.qty)),
    centered(item.rate.toFixed(2)),
    { text: item.taxableValue, alignment: "right" },
  ]);

  const fillers = Array.from(
    { length: Math.max(0, MIN_ITEM_ROWS - items.length) },
    () => blankRow(ITEM_WIDTHS.length)
  );

  const taxRow = (label: string, amount: number): TableCell[] => [
    { text: "" },
    { text: label, alignment: "right", italics: true, bold: true },
    { text: "" },
    { text: "" },
    { text: "" },
    { text: fixed2(amount), alignment: "right" },
  ];
  const taxRows = invoice.isOutsideDelhiInvoice
    ? [taxRow("IGST %", totalCgst + totalSgst)]
    : [taxRow("CGST %", totalCgst), taxRow("SGST %", totalSgst)];

  const totalRow: TableCell[] = [
    { text: "" },
    { text: "Total", alignment: "right" },
    { text: "" },
    { text: "" },
    { text: "" },
    {
      text: formatCurrencyForIndia(num(invoice.totalInvoiceValue)),
      alignment: "right",
      bold: true,
    },
  ];

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: ITEM_WIDTHS,
      heights: () => ROW_HEIGHT,
      body: [header, ...rows, ...fillers, ...taxRows, totalRow],
    },
    // Rules under the header, above the total and at the bottom only.
    layout: ruledLayout({ h: (i, n) => i === 1 || i === n - 1 || i === n }),
  };
}

const amountInWordsSection = (invoice: GstInvoiceForPdf): Content => ({
  table: {
    widths: ["*", "auto"],
    body: [
      [
        {
          stack: [
            { text: "Amount Chargeable (in words)" },
            {
              text: `INR ${amountInWords(invoice.totalInvoiceValue)}`,
              bold: true,
            },
          ],
        },
        { text: "E. & O.E", italics: true, alignment: "right" },
      ],
    ],
  },
  layout: ruledLayout({ h: (i, n) => i === n, v: OUTER }),
});

function hsnSummarySection(
  invoice: GstInvoiceForPdf,
  totalCgst: number,
  totalSgst: number
): Content {
  const items = invoice.pricedProducts;
  const totalTax = totalCgst + totalSgst;
  const hsn = (item: Item): TableCell => ({
    text: String(item.product.hsnCode),
  });

  let widths: (string | number)[];
  let header: TableCell[][];
  let rows: TableCell[][];
  let totalRow: TableCell[];

  if (invoice.isOutsideDelhiInvoice) {
    widths = ["*", 62, 40, 60, 78];
    header = [
      [
        centered("HSN/SAC", { rowSpan: 2 }),
        centered("Taxable Value", { rowSpan: 2 }),
        centered("IGST", { colSpan: 2 }),
        {},
        centered("Total Tax Amount", { rowSpan: 2 }),
      ],
      [{}, {}, centered("Rate"), centered("Amount"), {}],
    ];
    rows = items.map((item) => {
      const { cgst, sgst } = rates(item);
      const amount = fixed2(num(item.cgstAmt) + num(item.sgstAmt));
      return [
        hsn(item),
        centered(item.taxableValue),
        centered(`${cgst + sgst}%`),
        centered(amount),
        centered(amount),
      ];
    });
    totalRow = [
      { text: "Total", alignment: "right" },
      centered(fixed2(invoice.totalTaxableValue), { bold: true }),
      centered(""),
      centered(fixed2(totalTax), { bold: true }),
      centered(fixed2(totalTax), { bold: true }),
    ];
  } else {
    widths = ["*", 62, 34, 50, 34, 50, 78];
    header = [
      [
        centered("HSN/SAC", { rowSpan: 2 }),
        centered("Taxable Value", { rowSpan: 2 }),
        centered("Central Tax", { colSpan: 2 }),
        {},
        centered("State Tax", { colSpan: 2 }),
        {},
        centered("Total Tax Amount", { rowSpan: 2 }),
      ],
      [
        {},
        {},
        centered("Rate"),
        centered("Amount"),
        centered("Rate"),
        centered("Amount"),
        {},
      ],
    ];
    rows = items.map((item) => {
      const { cgst, sgst } = rates(item);
      return [
        hsn(item),
        centered(item.taxableValue),
        centered(`${cgst}%`),
        centered(fixed2(item.cgstAmt)),
        centered(`${sgst}%`),
        centered(fixed2(item.sgstAmt)),
        centered(fixed2(num(item.cgstAmt) + num(item.sgstAmt))),
      ];
    });
    totalRow = [
      { text: "Total", alignment: "right" },
      centered(fixed2(invoice.totalTaxableValue), { bold: true }),
      centered(""),
      centered(fixed2(totalCgst), { bold: true }),
      centered(""),
      centered(fixed2(totalSgst), { bold: true }),
      centered(fixed2(totalTax), { bold: true }),
    ];
  }

  return {
    table: {
      headerRows: 2,
      dontBreakRows: true,
      widths,
      body: [...header, ...rows, totalRow],
    },
    layout: ruledLayout({ h: NO_TOP }),
  };
}

function bankAndDeclarationSection(
  invoice: GstInvoiceForPdf,
  company: Users
): Content {
  const bankDetails: Content = {
    stack: [
      { text: "Company's Bank Details" },
      {
        table: {
          widths: ["auto", "auto"],
          body: [
            [
              { text: "Bank Name" },
              { text: `: ${text(company.bankName)}`, bold: true },
            ],
            [
              { text: "A/c No." },
              { text: `: ${text(company.bankAccountNo)}`, bold: true },
            ],
            [
              { text: "Branch & IFSC Code" },
              {
                text: `: ${text(company.bankBranch)} & ${text(
                  company.bankIfscCode
                )}`,
                bold: true,
              },
            ],
          ],
        },
        layout: ruledLayout({ h: NONE, v: NONE, padX: 1, padY: 0.5 }),
      },
    ],
  };

  return {
    table: {
      widths: ["50%", "50%"],
      body: [
        [
          {
            text: [
              "Tax Amount (in words) : ",
              {
                text: `INR ${amountInWords(invoice.totalTaxGST)}`,
                bold: true,
              },
            ],
            colSpan: 2,
            border: [true, false, true, false],
          },
          {},
        ],
        [
          { text: "", border: [true, false, false, false] },
          { ...bankDetails, border: [false, false, true, false] },
        ],
        [
          {
            stack: [
              { text: "Declaration :" },
              {
                text: "We declare that this invoice shows the actual price of the goods described and that all the particulars are true & correct.",
              },
            ],
            border: [true, false, false, true],
          },
          {
            stack: [
              {
                text: `for ${text(company.companyName)}`,
                bold: true,
                alignment: "right",
              },
              {
                text: "Authorised Signatory",
                alignment: "right",
                margin: [0, 22, 0, 0],
              },
            ],
            border: [true, true, true, true],
          },
        ],
      ],
    },
    layout: ruledLayout({ defaultBorder: false }),
  };
}
