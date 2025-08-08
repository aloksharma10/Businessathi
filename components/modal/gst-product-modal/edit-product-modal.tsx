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
import { useSession } from "next-auth/react";

export const EditProductModal = () => {
  const session = useSession();

  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "editProduct";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session.data?.user.companyName}</DialogTitle>
          <DialogDescription>
            Update the product&apos;s information as needed.
          </DialogDescription>
        </DialogHeader>
        <ProductForm productData={data.product} />
      </DialogContent>
    </Dialog>
  );
};
