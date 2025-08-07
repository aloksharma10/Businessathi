import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomerTable } from "./customer-table";
import { CustomerFormModal } from "./customer-form-modal";

export const Customer = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
        <CardDescription>Manage your customers</CardDescription>
        <div>
          <CustomerFormModal />
        </div>
      </CardHeader>
      <CardContent>
        <CustomerTable />
      </CardContent>
    </Card>
  );
};
