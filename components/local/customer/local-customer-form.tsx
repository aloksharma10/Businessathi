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

const FormSchemaLocalCustomer = z.object({
  customerName: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  address: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
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
    },
  });

  useEffect(() => {
    if (localCustomerData) {
      form.setValue("customerName", localCustomerData.customerName);
      form.setValue("address", localCustomerData.address);
    }
  }, [localCustomerData, form]);

  async function onSubmit(data: z.infer<typeof FormSchemaLocalCustomer>) {
    try {
      const isSuccess = localCustomerData
        ? (await UpdateLocalCustomer(localCustomerData.id, data),
          toast.success("Local customer updated successfully."))
        : (await CreateLocalCustomer(
          { values: data },
          session.data?.user?.id || ""
        ),
          toast.success("Local customer created successfully."));
      if (isSuccess) {
        form.reset();
        onClose();
        // Trigger refresh for customer tables
        triggerRefresh("gst-customers");
        triggerRefresh("local-customers");
      }
    } catch (error) {
      toast.error("Failed to create local customer.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <Button type="submit">
          {localCustomerData
            ? "Update Local Customer"
            : "Create Local Customer"}
        </Button>
      </form>
    </Form>
  );
};
