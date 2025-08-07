"use client";

import { useModal } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/gst/product/product-form";

export const EditProductModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "editProduct";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MUKESH TRADERS</DialogTitle>
          <DialogDescription>Edit Product</DialogDescription>
        </DialogHeader>
        <ProductForm productData={data.product} />
      </DialogContent>
    </Dialog>
  );
};
