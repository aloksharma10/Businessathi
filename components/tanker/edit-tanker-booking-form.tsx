"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parse } from "date-fns";
import { CheckIcon, ChevronsUpDownIcon, LoaderCircle } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  updateTankerBooking,
  type TankerBookingRow,
  type TankerDriverOption,
} from "@/action/tanker";

const schema = z.object({
  bookingDate: z.string().min(1, "Pick a booking date."),
  driverId: z.string().min(1, "Select a driver."),
  waterLiters: z.coerce.number().min(1, "Water liters must be at least 1."),
  amount: z.coerce.number().min(1, "Amount must be greater than zero."),
});

type FormValues = z.infer<typeof schema>;

const inputClass = "h-11 text-base";

export function EditTankerBookingForm({
  booking,
  drivers,
  onSuccess,
  onCancel,
}: {
  booking: TankerBookingRow;
  drivers: TankerDriverOption[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bookingDate: format(new Date(booking.tankerDate), "yyyy-MM-dd"),
      driverId: booking.driverId,
      waterLiters: booking.waterLiters,
      amount: parseFloat(booking.amount),
    },
  });

  useEffect(() => {
    form.reset({
      bookingDate: format(new Date(booking.tankerDate), "yyyy-MM-dd"),
      driverId: booking.driverId,
      waterLiters: booking.waterLiters,
      amount: parseFloat(booking.amount),
    });
  }, [booking, form]);

  const driverId = form.watch("driverId");
  const selectedDriver = drivers.find((d) => d.id === driverId);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await updateTankerBooking(booking.id, {
        bookingDate: parse(values.bookingDate, "yyyy-MM-dd", new Date()),
        driverId: values.driverId,
        waterLiters: values.waterLiters,
        amount: String(values.amount),
      });
      toast.success("Booking updated.");
      onSuccess();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not update booking."
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
              <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      disabled={submitting}
                      className={cn(
                        "h-11 w-full justify-between text-base font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selectedDriver?.driverName ?? "Select driver"}
                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[min(100vw-2rem,28rem)] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search driver…" />
                    <CommandList>
                      <ScrollArea className="h-48 pr-2">
                        <CommandEmpty>No driver found.</CommandEmpty>
                        <CommandGroup>
                          {drivers.map((d) => (
                            <CommandItem
                              key={d.id}
                              value={`${d.driverName} ${d.driverPhone}`}
                              onSelect={() => {
                                field.onChange(d.id);
                                setDriverOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  d.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="uppercase">{d.driverName}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {d.driverPhone}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </ScrollArea>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                    className={inputClass}
                    {...field}
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
                    className={inputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
