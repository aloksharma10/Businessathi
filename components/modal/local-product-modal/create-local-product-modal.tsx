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
import { useSession } from "next-auth/react";

export const CreateLocalProductModal = () => {
  const session = useSession();
  const { type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "createLocalProduct";

  const handleClose = () => {
    onClose();
  };
  return (
    <>
      <Dialog open={isOpenModel} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{session.data?.user.companyName}</DialogTitle>
            <DialogDescription>
              Enter details to create a new product.
            </DialogDescription>
          </DialogHeader>
          <LocalProductForm />
        </DialogContent>
      </Dialog>
    </>
  );
};
