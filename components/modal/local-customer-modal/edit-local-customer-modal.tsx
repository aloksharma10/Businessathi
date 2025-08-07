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

export const EditLocalCustomerModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "editLocalCustomer";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MUKESH TRADERS</DialogTitle>
          <DialogDescription>Edit Local Customer</DialogDescription>
        </DialogHeader>
        <LocalCustomerForm localCustomerData={data.localCustomer} />
      </DialogContent>
    </Dialog>
  );
};
