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
import { useSession } from "next-auth/react";

export const EditLocalProductModal = () => {
  const session = useSession();
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "editLocalProduct";

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
        <LocalProductForm localProductData={data.localProduct} />
      </DialogContent>
    </Dialog>
  );
};
