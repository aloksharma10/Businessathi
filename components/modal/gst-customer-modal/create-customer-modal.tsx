"use client";

import { useModal } from "@/store/store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/gst/customer/customer-form";

export const CreateCustomerModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createCustomer";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MUKESH TRADERS</DialogTitle>
          <DialogDescription>Create Customer</DialogDescription>
        </DialogHeader>
        <CustomerForm />
      </DialogContent>
    </Dialog>
  );
};
