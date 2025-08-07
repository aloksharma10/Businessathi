"use client";

import { useModal } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalProductForm } from "@/components/local/product/local-product-form";

export const EditLocalProductModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "editLocalProduct";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MUKESH TRADERS</DialogTitle>
          <DialogDescription>Edit Local Product</DialogDescription>
        </DialogHeader>
        <LocalProductForm localProductData={data.localProduct} />
      </DialogContent>
    </Dialog>
  );
};
