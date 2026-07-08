"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
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
import { FlexibleTankerDriverCombobox } from "@/components/tanker/flexible-tanker-driver-combobox";
import {
  createTankerBooking,
  ensureTankerDriver,
  type TankerDriverOption,
} from "@/action/tanker";
import { bookingDateFromInput } from "@/lib/tanker-date";

function todayInputDate() {
  return format(new Date(), "yyyy-MM-dd");
}

const phoneSchema = z
  .string()
  .min(1, "Phone is required.")
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 10, "Enter a valid 10-digit phone number.");

const entryFormSchema = z.object({
  bookingDate: z.string().min(1, "Pick a booking date."),
  driverId: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: phoneSchema,
  waterLiters: z.coerce.number().min(1, "Water liters must be at least 1."),
  amount: z.coerce.number().min(1, "Amount must be greater than zero."),
});

type EntryFormValues = z.infer<typeof entryFormSchema>;

const inputClass = "h-11 text-base";

export function TankerEntryForm({
  drivers,
  onSuccess,
  onDriversChange,
}: {
  drivers: TankerDriverOption[];
  onSuccess: () => void;
  onDriversChange?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      bookingDate: todayInputDate(),
      driverId: "",
      driverName: "",
      driverPhone: "",
      waterLiters: undefined,
      amount: undefined,
    },
  });

  const driverId = form.watch("driverId");
  const driverPhone = form.watch("driverPhone");

  const onSubmit = async (values: EntryFormValues) => {
    setSubmitting(true);
    try {
      let resolvedDriverId = values.driverId;

      if (!resolvedDriverId && values.driverName?.trim()) {
        const ensured = await ensureTankerDriver(
          values.driverName,
          values.driverPhone
        );
        resolvedDriverId = ensured.id;
        onDriversChange?.();
      }

      if (!resolvedDriverId) {
        toast.error("Select or create a driver first.");
        return;
      }

      await createTankerBooking({
        bookingDate: bookingDateFromInput(values.bookingDate),
        driverId: resolvedDriverId,
        waterLiters: values.waterLiters,
        amount: String(values.amount),
      });
      toast.success("Tanker booking saved.");
      form.reset({
        bookingDate: values.bookingDate,
        driverId: "",
        driverName: "",
        driverPhone: "",
        waterLiters: undefined,
        amount: undefined,
      });
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Could not save booking. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="bookingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking date</FormLabel>
              <FormControl>
                <Input type="date" className={inputClass} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="driverId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Driver</FormLabel>
              <FormControl>
                <FlexibleTankerDriverCombobox
                  drivers={drivers}
                  value={field.value ?? ""}
                  driverPhone={driverPhone}
                  disabled={submitting}
                  onChange={(id) => {
                    field.onChange(id);
                    const driver = drivers.find((d) => d.id === id);
                    if (driver) {
                      form.setValue("driverName", driver.driverName);
                      form.setValue("driverPhone", driver.driverPhone, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  onSelectDriver={(driver) => {
                    form.setValue("driverId", driver.id);
                    form.setValue("driverName", driver.driverName);
                    form.setValue("driverPhone", driver.driverPhone, {
                      shouldValidate: true,
                    });
                  }}
                  onDriversChange={onDriversChange}
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
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  className={inputClass}
                  disabled={Boolean(driverId)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="waterLiters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Water (liters)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="e.g. 4000"
                    className={inputClass}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step="0.01"
                    placeholder="e.g. 2000"
                    className={inputClass}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-base"
          disabled={submitting}
        >
          {submitting && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save booking
        </Button>
      </form>
    </Form>
  );
}
