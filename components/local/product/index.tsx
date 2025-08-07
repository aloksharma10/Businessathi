"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocalProductFormModal } from "./local-product-form-modal";
import { LocalProductTable } from "./local-product-table";

export const LocalProduct = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Management</CardTitle>
        <CardDescription>Manage your products</CardDescription>
        <div>
          <LocalProductFormModal />
        </div>
      </CardHeader>
      <CardContent>
        <LocalProductTable />
      </CardContent>
    </Card>
  );
};
