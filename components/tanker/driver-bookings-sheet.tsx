"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyForIndia } from "@/lib/utils";
import {
  getDriverBookings,
  type DriverSummaryRow,
  type TankerBookingRow,
} from "@/action/tanker";

export function DriverBookingsSheet({
  open,
  onOpenChange,
  driver,
  dateRange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: DriverSummaryRow | null;
  dateRange: DateRange | undefined;
}) {
  const [bookings, setBookings] = useState<TankerBookingRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !driver) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await getDriverBookings({
          driverId: driver.driverId,
          dateFrom: dateRange?.from,
          dateTo: dateRange?.to,
        });
        if (!cancelled) setBookings(rows);
      } catch (e) {
        console.error(e);
        if (!cancelled) toast.error("Failed to load driver bookings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, driver, dateRange?.from, dateRange?.to]);

  const totalLiters = bookings.reduce((s, b) => s + b.waterLiters, 0);
  const totalAmount = bookings.reduce(
    (s, b) => s + parseFloat(b.amount || "0"),
    0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{driver?.driverName ?? "Driver"}</SheetTitle>
          <SheetDescription>
            {driver?.driverPhone} · {bookings.length} booking
            {bookings.length === 1 ? "" : "s"} in selected range
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
            <div>
              <p className="text-muted-foreground">Total water</p>
              <p className="font-semibold">{totalLiters.toLocaleString("en-IN")} L</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total amount</p>
              <p className="font-semibold">
                {formatCurrencyForIndia(totalAmount)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
              Loading bookings…
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No bookings found for this driver in the selected date range.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Liters</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        {format(new Date(b.tankerDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {b.waterLiters.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyForIndia(parseFloat(b.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
