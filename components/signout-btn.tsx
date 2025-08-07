"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react"
import { DropdownMenuItem } from "./ui/dropdown-menu";

export const SignoutBtn = () => {
  return (
    <DropdownMenuItem
    className="cursor-pointer"
      onClick={() => {
        signOut();
      }}
    >
      <LogOut size={15} className="mr-1" />
      Log out
    </DropdownMenuItem>
  );
};
