"use client";

import { useModal } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalCustomerForm } from "@/components/local/customer/local-customer-form";
import { useSession } from "next-auth/react";

export const EditLocalCustomerModal = () => {
  const session = useSession();
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "editLocalCustomer";

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
        <LocalCustomerForm localCustomerData={data.localCustomer} />
      </DialogContent>
    </Dialog>
  );
};
