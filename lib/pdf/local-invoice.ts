import type { Prisma, Users } from "@prisma/client";
import { format, isValid, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type {
  Content,
  TableCell,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import { formatCurrencyForIndia } from "../utils";
import { amountInWords, num, text } from "./format";
import {
  blankRow,
  INNER,
  labelledValue,
  NONE,
  OUTER,
  ruledLayout,
} from "./layout";

export type LocalInvoiceForPdf = Prisma.LocalInvoiceGetPayload<{
  include: { customer: true; pricedProducts: { include: { product: true } } };
}>;

const TIMEZONE = "Asia/Kolkata";
/** The cash-memo layout keeps the goods table a fixed height; pad short invoices. */
const MIN_ITEM_ROWS = 29;
const ROW_HEIGHT = 10.5;
const ITEM_WIDTHS = [30, "*", 48, 48, 66];

const centered = (value: string, bold = false): TableCell => ({
  text: value,
  alignment: "center",
  bold,
});

/** "August 2025" → "Aug 2025"; falls back to the raw values if unparsable. */
const monthLabel = (monthOf: string, yearOf: string): string => {
  const parsed = parse(`${monthOf} ${yearOf}`, "MMMM yyyy", new Date());
  return isValid(parsed) ? format(parsed, "MMM yyyy") : `${monthOf} ${yearOf}`;
};

export function localInvoiceDocument(
  invoices: LocalInvoiceForPdf[],
  company: Users
): TDocumentDefinitions {
  return {
    pageSize: "A5",
    pageMargins: [27, 18, 27, 18],
    defaultStyle: { font: "Roboto", fontSize: 8, lineHeight: 1.0 },
    info: {
      title:
        invoices.length === 1
          ? `Invoice ${invoices[0].localInvoiceNo}`
          : "Invoices",
      author: text(company.localCompanyName),
      creator: "Businessathi",
      producer: "Businessathi",
    },
    content: invoices.map((invoice, index) => ({
      stack: localInvoiceContent(invoice, company),
      pageBreak: index > 0 ? "before" : undefined,
    })),
  };
}

export function localInvoiceContent(
  invoice: LocalInvoiceForPdf,
  company: Users
): Content[] {
  return [
    {
      text: "BILL/CASH MEMO",
      bold: true,
      alignment: "center",
      margin: [0, 0, 0, 4],
    },
    partiesSection(invoice, company),
    itemsSection(invoice),
    amountInWordsSection(invoice),
    signatureSection(company),
  ];
}

function partiesSection(
  invoice: LocalInvoiceForPdf,
  company: Users
): Content {
  const contact = [company.contactNo, company.additionalContactNo]
    .filter(Boolean)
    .join(", ");
  const seller: Content = {
    stack: [
      { text: text(company.localCompanyName), bold: true },
      ...(company.localTagLine ? [{ text: `(${company.localTagLine})` }] : []),
      { text: text(company.localAddress) },
      { text: `Mob : ${contact}` },
    ],
  };
  const buyer: Content = {
    stack: [
      { text: "Buyer (Bill to)" },
      { text: invoice.customer.customerName, bold: true },
      { text: invoice.customer.address },
    ],
  };
  const invoiceDate = format(
    toZonedTime(invoice.localInvoiceDate, TIMEZONE),
    "dd-MM-yyyy"
  );

  return {
    table: {
      widths: ["65%", "35%"],
      body: [
        [
          {
            table: { widths: ["*"], body: [[seller], [buyer]] },
            layout: ruledLayout({ h: INNER, v: NONE }),
          },
          {
            table: {
              widths: ["50%", "50%"],
              heights: [24, 24, "auto"],
              body: [
                [
                  labelledValue("Invoice No.", invoice.localInvoiceNo),
                  labelledValue("Dated", invoiceDate),
                ],
                [
                  labelledValue(
                    "Month",
                    monthLabel(invoice.monthOf, invoice.yearOf)
                  ),
                  labelledValue("References"),
                ],
                [{ text: "Terms of Delivery", colSpan: 2 }, {}],
              ],
            },
            layout: ruledLayout({ h: INNER, v: INNER, padX: 2 }),
          },
        ],
      ],
    },
    layout: ruledLayout({ padX: 0, padY: 0 }),
  };
}

function itemsSection(invoice: LocalInvoiceForPdf): Content {
  const items = invoice.pricedProducts;
  const header: TableCell[] = [
    "Sl No.",
    "Description of Goods",
    "Quantity",
    "Rate",
    "Amount",
  ].map((label) => centered(label));

  const rows: TableCell[][] = items.map((item, i) => [
    centered(String(i + 1)),
    { text: item.product.productName, bold: true },
    centered(String(item.qty)),
    centered(item.rate.toFixed(2)),
    centered(item.productTotalValue),
  ]);

  const fillers = Array.from(
    { length: Math.max(0, MIN_ITEM_ROWS - items.length) },
    () => blankRow(ITEM_WIDTHS.length)
  );

  const totalRow: TableCell[] = [
    { text: "" },
    { text: "Total", alignment: "right" },
    { text: "" },
    { text: "" },
    centered(formatCurrencyForIndia(num(invoice.localTotalInvoiceValue)), true),
  ];

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: ITEM_WIDTHS,
      heights: () => ROW_HEIGHT,
      body: [header, ...rows, ...fillers, totalRow],
    },
    // Rules under the header, above the total and at the bottom only.
    layout: ruledLayout({
      h: (i, n) => i === 1 || i === n - 1 || i === n,
      padY: 0.75,
    }),
  };
}

const amountInWordsSection = (invoice: LocalInvoiceForPdf): Content => ({
  table: {
    widths: ["*"],
    body: [
      [
        {
          stack: [
            { text: "Amount Chargeable (in words)" },
            {
              text: `INR ${amountInWords(invoice.localTotalInvoiceValue)}`,
              bold: true,
            },
          ],
        },
      ],
    ],
  },
  layout: ruledLayout({ h: NONE, v: OUTER }),
});

const signatureSection = (company: Users): Content => ({
  table: {
    widths: ["70%", "30%"],
    body: [
      [
        {
          stack: [
            { text: "E. & O.E.", italics: true },
            {
              text: "We certify that the prices and details in this invoice are true and correct.",
            },
          ],
        },
        {
          stack: [
            {
              text: `for ${text(company.localCompanyName)}`,
              bold: true,
              alignment: "right",
            },
            {
              text: "Authorised Signatory",
              alignment: "right",
              margin: [0, 14, 0, 0],
            },
          ],
        },
      ],
    ],
  },
  layout: ruledLayout({ h: OUTER, v: OUTER }),
});
