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
import { CreateCustomer, UpdateCustomer } from "@/action/customer";
import { useEffect } from "react";
import { Customer } from "@prisma/client";
import { TagsInput } from "@/components/tags-input";
import { useSession } from "next-auth/react";
import { useModal } from "@/store/store";
import { toast } from "sonner";

const FormSchemaCustomer = z.object({
  customerName: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  address: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
  gstIn: z.string().min(2, {
    message: "GSTIN/UIN must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  stateCode: z.string().min(1, {
    message: "State code must be at least 2 characters.",
  }),
  tags: z.array(z.string()),
});

export function CustomerForm({ 
  customerData, 
  onSuccess 
}: { 
  customerData?: Customer;
  onSuccess?: () => void;
}) {
  const form = useForm<z.infer<typeof FormSchemaCustomer>>({
    resolver: zodResolver(FormSchemaCustomer),
    defaultValues: {
      customerName: "",
      address: "",
      gstIn: "",
      state: "",
      stateCode: "",
      tags: [],
    },
  });

  const {formState: { isSubmitting },} = form;
  const { onClose, triggerRefresh } = useModal();

  const session = useSession();

  useEffect(() => {
    if (!customerData) return;
    form.reset({
      customerName: customerData.customerName,
      address: customerData.address,
      gstIn: customerData.gstIn,
      state: customerData.state,
      stateCode: customerData.stateCode?.toString() ?? "",
      tags: customerData.tags ?? [],
    });
    // Only re-sync when switching to another customer (modal remounts per open via key)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid resetting tags while user edits
  }, [customerData?.id]);

  async function onSubmit(data: z.infer<typeof FormSchemaCustomer>) {
    try {
      if (customerData) {
        await UpdateCustomer(customerData.id, data);
        toast.success("Customer updated successfully");
      } else {
        await CreateCustomer({ values: data }, session.data?.user?.id || "");
        toast.success("Customer created successfully");
      }
      form.reset();
      onClose();
      triggerRefresh("gst-customers");
      triggerRefresh("local-customers");
      onSuccess?.();
    } catch (error) {
      customerData
        ? toast.error("Failed to update customer")
        : toast.error("Failed to create customer");
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
          name="gstIn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GSTIN/UIN</FormLabel>
              <FormControl>
                <Input
                  className="uppercase"
                  placeholder="GSTIN/UIN"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input placeholder="State" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stateCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State Code</FormLabel>
              <FormControl>
                <Input placeholder="State Code" {...field} />
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
                  scope="customer"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button isLoading={isSubmitting} disabled={isSubmitting} type="submit">
          {customerData ? "Update Customer" : "Create Customer"}
        </Button>
      </form>
    </Form>
  );
}
