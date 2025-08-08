"use client";

import { useModal } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/gst/customer/customer-form";
import { useSession } from "next-auth/react";

export const CreateCustomerModal = () => {
  const session = useSession();
  const { type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createCustomer";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session.data?.user.companyName}</DialogTitle>
          <DialogDescription>
            Enter details to create a new customer.
          </DialogDescription>
        </DialogHeader>
        <CustomerForm />
      </DialogContent>
    </Dialog>
  );
};
