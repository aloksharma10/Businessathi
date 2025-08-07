"use client";

import { useModal } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CompanyProfileForm } from "../company-profile-form";

export const CompanyProfileModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "companyProfile";

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent className="p-10 min-w-[800px]">
        <DialogHeader>
          <DialogTitle>Your Company Profile</DialogTitle>
          <DialogDescription>
            Set up your company profile to enable smooth invoicing.
          </DialogDescription>
        </DialogHeader>
        <CompanyProfileForm />
      </DialogContent>
    </Dialog>
  );
};
