"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateLocalCustomer, UpdateLocalCustomer } from "@/action/customer";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/store/store";
import { useSession } from "next-auth/react";
import { LocalCustomer } from "@prisma/client";
import { useEffect } from "react";
import { TagsInput } from "@/components/tags-input";

const FormSchemaLocalCustomer = z.object({
  customerName: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  address: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
  tags: z.array(z.string()),
});

export const LocalCustomerForm = ({
  localCustomerData,
}: {
  localCustomerData?: LocalCustomer;
}) => {
  const session = useSession();
  const { onClose, triggerRefresh } = useModal();

  const form = useForm<z.infer<typeof FormSchemaLocalCustomer>>({
    resolver: zodResolver(FormSchemaLocalCustomer),
    defaultValues: {
      customerName: "",
      address: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (!localCustomerData) return;
    form.reset({
      customerName: localCustomerData.customerName,
      address: localCustomerData.address,
      tags: localCustomerData.tags ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCustomerData?.id]);

  async function onSubmit(data: z.infer<typeof FormSchemaLocalCustomer>) {
    try {
      if (localCustomerData) {
        await UpdateLocalCustomer(localCustomerData.id, data);
        toast.success("Local customer updated successfully.");
      } else {
        await CreateLocalCustomer(
          { values: data },
          session.data?.user?.id || ""
        );
        toast.success("Local customer created successfully.");
      }
      form.reset();
      onClose();
      triggerRefresh("gst-customers");
      triggerRefresh("local-customers");
    } catch (error) {
      toast.error(
        localCustomerData
          ? "Failed to update local customer."
          : "Failed to create local customer."
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
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input
                  className="uppercase"
                  placeholder="Customer Name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input className="uppercase" placeholder="Address" {...field} />
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
                  suggestionPool="all"
                  scope="localCustomer"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {localCustomerData
            ? "Update Local Customer"
            : "Create Local Customer"}
        </Button>
      </form>
    </Form>
  );
};
