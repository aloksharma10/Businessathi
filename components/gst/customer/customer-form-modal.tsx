"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/store/store";

export const CustomerFormModal = () => {
  const { onOpen } = useModal();
  return <Button onClick={() => onOpen("createCustomer")}>Add GST Customer</Button>
};
