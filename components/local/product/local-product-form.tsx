"use client";

import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CreateLocalProduct, UpdateLocalProduct } from "@/action/product";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/store/store";
import { LocalProduct } from "@prisma/client";
import { useEffect } from "react";

const FormSchemaLocalProduct = z.object({
  productName: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
});

export const LocalProductForm = ({
  localProductData
}: {
  localProductData?: LocalProduct;
}) => {
  const session = useSession();
  const { onClose, triggerRefresh } = useModal();

  const form = useForm<z.infer<typeof FormSchemaLocalProduct>>({
    resolver: zodResolver(FormSchemaLocalProduct),
    defaultValues: {
      productName: "",
    },
  });

  useEffect(() => {
    if (localProductData) {
      form.setValue("productName", localProductData.productName);
    }
  }, [localProductData, form]);

  async function onSubmit(data: z.infer<typeof FormSchemaLocalProduct>) {
    try {
      const isSuccess = localProductData
        ? (await UpdateLocalProduct(localProductData.id, data),
          toast.success("Local product updated successfully."))
        : (await CreateLocalProduct(
          { values: data },
          session.data?.user?.id || ""
        ),
          toast.success("Local product created successfully."));
      if (isSuccess) {
        form.reset();
        onClose();
        // Trigger refresh for product tables
        triggerRefresh("gst-products");
        triggerRefresh("local-products");
      }
    } catch (error) {
      toast.error("Failed to create local Product.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input className="uppercase" placeholder="Product Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{localProductData
          ? "Update Local Product"
          : "Create Local Product"}</Button>
      </form>
    </Form>
  );
};
