import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductTable } from "./product-table";
import { ProductFormModal } from "./product-form-modal";

export const Product = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Management</CardTitle>
        <CardDescription>Manage your products</CardDescription>
        <div>
          <ProductFormModal />
        </div>
      </CardHeader>
      <CardContent>
        <ProductTable />
      </CardContent>
    </Card>
  );
};
