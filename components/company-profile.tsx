"use client";

import { useModal } from "@/store/store";
import { DropdownMenuItem } from "./ui/dropdown-menu";

export const CompanyProfile = () => {
  const { onOpen } = useModal();

  return (
    <DropdownMenuItem onClick={() => onOpen("companyProfile")}>
      Company Profile
    </DropdownMenuItem>
  );
};
