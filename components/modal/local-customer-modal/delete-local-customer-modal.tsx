"use client";

import { useModal } from "@/store/store";
import { DeleteLocalCustomer } from "@/action/customer";
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
import { toast } from "sonner";
export const DeleteLocalCustomerModal = () => {
  const { data, type, onClose, isOpen, triggerRefresh } = useModal();

  const isOpenModel = isOpen && type === "deleteLocalCustomer";

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    const onSuccess = await DeleteLocalCustomer(
      data.localCustomer?.id as string
    );
    if (onSuccess) {
      toast.success("Local customer deleted successfully.");
      onClose();
      // Trigger refresh for customer tables
      triggerRefresh("gst-customers");
      triggerRefresh("local-customers");
    }
  };

  return (
    <AlertDialog open={isOpenModel} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            local customer and remove your data from our servers.
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
