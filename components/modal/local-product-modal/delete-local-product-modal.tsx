"use client";

import { useModal } from "@/store/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeleteLocalProduct } from "@/action/product";
import { toast } from "sonner";

export const DeleteLocalProductModal = () => {
  const { data, type, onClose, isOpen, triggerRefresh } = useModal();

  const isOpenModel = isOpen && type === "deleteLocalProduct";

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    const onSuccess = await DeleteLocalProduct(data.localProduct?.id as string);
    if (onSuccess) {
      toast.success("Local product deleted successfully.");
      onClose();
      // Trigger refresh for product tables
      triggerRefresh("gst-products");
      triggerRefresh("local-products");
    }
  };

  return (
    <AlertDialog open={isOpenModel} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            local product and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
