"use client";

import { useModal } from "@/store/store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LocalInvoiceForm } from "../local/invoice/local-invoice-form";
import { LocalCustomer, LocalProduct } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getCustomers, getProducts } from "@/action/db-helper";

export const EditLocalInvoiceModal = () => {
  const { data, type, onClose, isOpen } = useModal();
  const [customers, setCustomers] = useState<
    LocalCustomer[] | null | undefined
  >([]);
  const [products, setProducts] = useState<LocalProduct[] | null | undefined>(
    []
  );

  const session = useSession();
  const userId = session.data?.user.id || "";

  const isOpenModel = isOpen && type === "editLocalInvoice";

  useEffect(() => {
    if (session?.data?.user?.id) {
      const fetchCustomers = async () => {
        const data = await getCustomers(session?.data?.user?.id);
        setCustomers(data);
      };

      const fetchProducts = async () => {
        const data = await getProducts(session?.data?.user?.id);
        setProducts(data);
      };

      fetchProducts();
      fetchCustomers();
    }
  }, [session?.data?.user?.id, isOpenModel]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Sheet open={isOpenModel} onOpenChange={handleClose}>
      <SheetContent className="md:min-w-[700px]">
        <SheetHeader>
          <SheetTitle>{session.data?.user.companyName}</SheetTitle>
          <SheetDescription>
            Update the invoice&apos;s information as needed.
          </SheetDescription>
          <LocalInvoiceForm
            mode={"edit"}
            userId={userId}
            localInvoiceData={data.localInvoice}
            customers={customers as LocalCustomer[]}
            products={products as any[]}
          />
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};
