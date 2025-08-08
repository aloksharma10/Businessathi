"use client";

import { useModal } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Customer } from "@prisma/client";
import { CustomerForm } from "@/components/gst/customer/customer-form";
import { useSession } from "next-auth/react";

export const EditCustomerModal = () => {
  const session = useSession();

  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "editCustomer";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session.data?.user.companyName}</DialogTitle>
          <DialogDescription>
            Update the customer&apos;s information as needed.
          </DialogDescription>
        </DialogHeader>
        <CustomerForm customerData={data.customer as Customer} />
      </DialogContent>
    </Dialog>
  );
};
