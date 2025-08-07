"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/store/store";
import { LocalProductForm } from "../../local/product/local-product-form";

export const CreateLocalProductModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createLocalProduct";

  const handleClose = () => {
    onClose();
  };
  return (
    <>
      <Dialog open={isOpenModel} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MUKESH TRADERS</DialogTitle>
            <DialogDescription>Create Local Product</DialogDescription>
          </DialogHeader>
          <LocalProductForm />
        </DialogContent>
      </Dialog>
    </>
  );
};
