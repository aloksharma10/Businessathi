import prisma from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocalInvoiceForm } from "./local-invoice-form";
import { auth } from "@/auth";

export const LocalInvoice = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  
  const localCustomers = await prisma.localCustomer.findMany({
    where: {
      userId: userId,
    },
  });
  const localProducts = await prisma.localProduct.findMany({
    where: {
      userId: userId,
    },
  });

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="px-5 lg:px-6">
        <CardTitle>{session?.user.companyName}</CardTitle>
        <CardDescription>Create Local Invoice</CardDescription>
      </CardHeader>
      <CardContent className="px-2 lg:px-6">
        <LocalInvoiceForm
          userId={userId || "1"}
          customers={localCustomers}
          products={localProducts}
        />
      </CardContent>
    </Card>
  );
};
