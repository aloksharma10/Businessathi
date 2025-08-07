"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/store/store";

export const LocalCustomerFormModal = () => {
  const { onOpen } = useModal();
  return (
    <Button onClick={() => onOpen("createLocalCustomer")}>
      Add Local Customer
    </Button>
  );
};
