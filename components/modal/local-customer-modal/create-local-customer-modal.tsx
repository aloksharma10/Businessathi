"use client";

import { LocalCustomerForm } from "@/components/local/customer/local-customer-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModal } from "@/store/store";

export const CreateLocalCustomerModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createLocalCustomer";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MUKESH TRADERS</DialogTitle>
          <DialogDescription>Create Local Customer</DialogDescription>
        </DialogHeader>
        <LocalCustomerForm />
      </DialogContent>
    </Dialog>
  );
};
