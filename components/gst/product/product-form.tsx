"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateProduct, UpdateProduct } from "@/action/product";
import { useSession } from "next-auth/react";
import { Product } from "@prisma/client";
import { useEffect } from "react";
import { TagsInput } from "@/components/tags-input";
import { useModal } from "@/store/store";
import { toast } from "sonner";

const FormSchemaProduct = z.object({
  productName: z.string().min(2, {
    message: "Product name name must be at least 2 characters.",
  }),
  hsnCode: z.string().min(2, {
    message: "Hsn code must be at least 2 characters.",
  }),
  cgstRate: z.string(),
  sgstRate: z.string(),
  tags: z.array(z.string()),
});

export function ProductForm({ 
  productData, 
  onSuccess 
}: { 
  productData?: Product;
  onSuccess?: () => void;
}) {
  const form = useForm<z.infer<typeof FormSchemaProduct>>({
    resolver: zodResolver(FormSchemaProduct),
    defaultValues: {
      productName: "",
      hsnCode: "",
      cgstRate: "",
      sgstRate: "",
      tags: [],
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const { onClose, triggerRefresh } = useModal();

  useEffect(() => {
    if (!productData) return;
    form.reset({
      productName: productData.productName,
      hsnCode: productData.hsnCode?.toString() ?? "",
      cgstRate: productData.cgstRate?.toString() ?? "",
      sgstRate: productData.sgstRate?.toString() ?? "",
      tags: productData.tags ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid resetting tags while user edits
  }, [productData?.id]);

  const session = useSession();

  async function onSubmit(data: z.infer<typeof FormSchemaProduct>) {
    try {
      if (productData) {
        await UpdateProduct(productData.id, data);
        toast.success("Product updated successfully");
      } else {
        await CreateProduct({ values: data }, session.data?.user?.id || "");
        toast.success("Product created successfully");
      }
      form.reset();
      onClose();
      triggerRefresh("gst-products");
      triggerRefresh("local-products");
      onSuccess?.();
    } catch (error) {
      productData
        ? toast.error("Failed to update product")
        : toast.error("Failed to create product");
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-6"
          onSubmitCapture={() => {
            const el = document.activeElement;
            if (el instanceof HTMLInputElement) {
              const typ = (el.type || "").toLowerCase();
              if (
                typ !== "submit" &&
                typ !== "button" &&
                typ !== "checkbox" &&
                typ !== "radio" &&
                typ !== "file" &&
                typ !== "hidden"
              ) {
                el.blur();
              }
            }
          }}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input
                    className="uppercase"
                    placeholder="Product Name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hsnCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HSN Code</FormLabel>
                <FormControl>
                  <Input placeholder="22011010" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cgstRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CGST Rate</FormLabel>
                <FormControl>
                  <Input placeholder="CGST Rate" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sgstRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SGST Rate</FormLabel>
                <FormControl>
                  <Input placeholder="SGST Rate" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagsInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    userId={session.data?.user?.id ?? ""}
                    scope="product"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">
            {productData ? "Update Product" : "Create Product"}
          </Button>
        </form>
      </Form>
    </>
  );
}
