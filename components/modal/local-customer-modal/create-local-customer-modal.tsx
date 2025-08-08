"use client";

import { LocalCustomerForm } from "@/components/local/customer/local-customer-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/store/store";
import { useSession } from "next-auth/react";

export const CreateLocalCustomerModal = () => {
  const session = useSession();
  const { type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createLocalCustomer";

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
        <LocalCustomerForm />
      </DialogContent>
    </Dialog>
  );
};
