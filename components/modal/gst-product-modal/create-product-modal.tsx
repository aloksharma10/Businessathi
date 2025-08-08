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
import { useSession } from "next-auth/react";

export const CreateProductModal = () => {
  const session = useSession();
  const { type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createProduct";

  const handleClose = () => {
    onClose();
  };
  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session.data?.user.companyName}</DialogTitle>
          <DialogDescription>
            Enter details to create a new product.
          </DialogDescription>
        </DialogHeader>
        <ProductForm />
      </DialogContent>
    </Dialog>
  );
};
