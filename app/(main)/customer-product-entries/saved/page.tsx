import { auth } from "@/auth";
import prisma from "@/lib/db";
import { SavedCustomerProductEntries } from "@/components/customer-product-entry/saved-customer-product-entries";

export default async function SavedCustomerProductEntriesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <p className="text-muted-foreground text-sm">
        Sign in to view saved customer and product entries.
      </p>
    );
  }

  const [
    gstCustomers,
    localCustomers,
    gstProducts,
    localProducts,
    plantCustomers,
    plantProducts,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: { userId },
      orderBy: { customerName: "asc" },
    }),
    prisma.localCustomer.findMany({
      where: { userId },
      orderBy: { customerName: "asc" },
    }),
    prisma.product.findMany({
      where: { userId },
      orderBy: { productName: "asc" },
    }),
    prisma.localProduct.findMany({
      where: { userId },
      orderBy: { productName: "asc" },
    }),
    prisma.plantCustomer.findMany({
      where: { userId },
      orderBy: { customerName: "asc" },
    }),
    prisma.plantProduct.findMany({
      where: { userId },
      orderBy: { productName: "asc" },
    }),
  ]);

  return (
    <SavedCustomerProductEntries
      gstCustomers={gstCustomers}
      localCustomers={localCustomers}
      gstProducts={gstProducts}
      localProducts={localProducts}
      plantCustomers={plantCustomers}
      plantProducts={plantProducts}
    />
  );
}
