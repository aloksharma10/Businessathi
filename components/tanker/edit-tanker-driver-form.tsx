"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

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
import { updateTankerDriver, type TankerDriverOption } from "@/action/tanker";

const schema = z.object({
  driverName: z.string().min(1, "Driver name is required."),
  driverPhone: z
    .string()
    .min(1, "Phone is required.")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10, "Enter a valid 10-digit phone number."),
});

type FormValues = z.infer<typeof schema>;

const inputClass = "h-11 text-base";

export function EditTankerDriverForm({
  driver,
  onSuccess,
  onCancel,
}: {
  driver: TankerDriverOption;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      driverName: driver.driverName,
      driverPhone: driver.driverPhone,
    },
  });

  useEffect(() => {
    form.reset({
      driverName: driver.driverName,
      driverPhone: driver.driverPhone,
    });
  }, [driver, form]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await updateTankerDriver(driver.id, {
        driverName: values.driverName,
        driverPhone: values.driverPhone,
      });
      toast.success("Driver updated.");
      onSuccess();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not update driver."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="driverName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Driver name</FormLabel>
              <FormControl>
                <Input
                  className={inputClass}
                  placeholder="Driver name"
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase())
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="driverPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Driver phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  className={inputClass}
                  placeholder="10-digit mobile number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={submitting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" className="h-11 flex-1" disabled={submitting}>
            {submitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
