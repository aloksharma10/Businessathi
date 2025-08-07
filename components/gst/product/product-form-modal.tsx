"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/store/store";

export const ProductFormModal = () => {
  const { onOpen } = useModal();
  return (
    <Button onClick={() => onOpen("createProduct")}>Add GST Product</Button>
  );
};
