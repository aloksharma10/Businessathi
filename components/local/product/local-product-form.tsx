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
import { TagsInput } from "@/components/tags-input";

const FormSchemaLocalProduct = z.object({
  productName: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  tags: z.array(z.string()),
});

export const LocalProductForm = ({
  localProductData,
}: {
  localProductData?: LocalProduct;
}) => {
  const session = useSession();
  const { onClose, triggerRefresh } = useModal();

  const form = useForm<z.infer<typeof FormSchemaLocalProduct>>({
    resolver: zodResolver(FormSchemaLocalProduct),
    defaultValues: {
      productName: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (!localProductData) return;
    form.reset({
      productName: localProductData.productName,
      tags: localProductData.tags ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localProductData?.id]);

  async function onSubmit(data: z.infer<typeof FormSchemaLocalProduct>) {
    try {
      if (localProductData) {
        await UpdateLocalProduct(localProductData.id, data);
        toast.success("Local product updated successfully.");
      } else {
        await CreateLocalProduct(
          { values: data },
          session.data?.user?.id || ""
        );
        toast.success("Local product created successfully.");
      }
      form.reset();
      onClose();
      triggerRefresh("gst-products");
      triggerRefresh("local-products");
    } catch (error) {
      toast.error(
        localProductData
          ? "Failed to update local product."
          : "Failed to create local product."
      );
    }
  }

  return (
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
                  scope="localProduct"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {localProductData ? "Update Local Product" : "Create Local Product"}
        </Button>
      </form>
    </Form>
  );
};
