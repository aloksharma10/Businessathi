import { IndianRupee, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChartGraph } from "./pie-chart";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function SectionCards() {
  const session = await auth();
  const userId = session?.user?.id;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: userId,
    },
  });

  const generalInvoices = await prisma.localInvoice.findMany({
    where: {
      userId: userId,
    },
  });

  const customers = await prisma.customer.findMany({
    where: {
      userId: userId,
    },
  });

  const invoicesGroupBy = await prisma.invoice.groupBy({
    where: {
      invoiceDate: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
      userId: userId,
    },
    by: ["customerId"],
    _count: {
      id: true,
    },
  });

  const invoicesGroupByLocal = await prisma.localInvoice.groupBy({
    where: {
      localInvoiceDate: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
      userId: userId,
    },
    by: ["customerId"],
    _count: {
      id: true,
    },
  });

  const getRandomRGB = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const pieChartData = invoicesGroupBy.map((invoice) => {
    const customer = customers.find(
      (customer) => customer.id === invoice.customerId
    );
    return {
      customerName: customer?.customerName,
      invoiceCount: invoice._count.id,
      fill: getRandomRGB(),
    };
  });
  const pieChartDataLocal = invoicesGroupByLocal.map((invoice) => {
    const customer = customers.find(
      (customer) => customer.id === invoice.customerId
    );
    return {
      customerName: customer?.customerName,
      invoiceCount: invoice._count.id,
      fill: getRandomRGB(),
    };
  });

  const gstGrossRevenue = invoices
    .reduce((acc, invoice) => {
      return acc + Number(invoice.totalInvoiceValue);
    }, 0)
    .toFixed(2);

  const generalGrossRevenue = generalInvoices
    .reduce((acc, invoice) => {
      return acc + Number(invoice.localTotalInvoiceValue);
    }, 0)
    .toFixed(2);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-4">
      <div className="flex flex-col items-center justify-center gap-4 flex-1 w-full">
        <div className="flex w-full flex-col lg:flex-row items-center gap-4">
          <Card className="w-full">
            <CardHeader className="relative">
              <CardDescription>GST Gross Revenue</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums flex items-center">
                <IndianRupee className="mt-1 size-5" />
                {gstGrossRevenue}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <Badge
                  variant="outline"
                  className="flex gap-1 rounded-lg text-xs"
                >
                  <TrendingUpIcon className="size-3" />
                  +12.5%
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Trending up this month <TrendingUpIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Showing total gst gross sales
              </div>
            </CardFooter>
          </Card>
        </div>
        <Card className="w-full">
          <CardHeader className="relative">
            <CardDescription>General Gross Revenue</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums flex items-center">
              <IndianRupee className="mt-1 size-5" />
              {generalGrossRevenue}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className="flex gap-1 rounded-lg text-xs"
              >
                <TrendingUpIcon className="size-3" />
                +12.5%
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Trending up this month <TrendingUpIcon className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Showing total general gross sales
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="w-full lg:w-auto">
        <PieChartGraph
          chartData={pieChartData}
          title="Monthly GST Billing Overview"
          centerText="GST Bills"
        />
      </div>
      <div className="w-full lg:w-auto">
        <PieChartGraph
          chartData={pieChartDataLocal}
          title="Monthly General Billing Overview"
          centerText="General Bills"
        />
      </div>
    </div>
  );
}
