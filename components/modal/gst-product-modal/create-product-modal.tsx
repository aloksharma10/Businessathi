"use client";

import { ProductForm } from "@/components/gst/product/product-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/store/store";

export const CreateProductModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createProduct";

  const handleClose = () => {
    onClose();
  };
  return (
    <>
      <Dialog open={isOpenModel} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MUKESH TRADERS</DialogTitle>
            <DialogDescription>Create Product</DialogDescription>
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>
    </>
  );
};
