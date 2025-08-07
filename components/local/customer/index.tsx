"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocalCustomerFormModal } from "./local-customer-form-modal";
import { LocalCustomerTable } from "./local-customer-table";

export const LocalCustomer = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
        <CardDescription>Manage your customers</CardDescription>
        <div>
          <LocalCustomerFormModal />
        </div>
      </CardHeader>
      <CardContent>
        <LocalCustomerTable />
      </CardContent>
    </Card>
  );
};
