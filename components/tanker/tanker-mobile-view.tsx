"use client";

import {
  ChevronRight,
  CircleCheck,
  Droplets,
  FlipVertical2Icon,
  LoaderCircle,
  Pencil,
  Plus,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TankerDateFilter } from "@/components/tanker/tanker-date-filter";
import { TankerDriversSettingsButton } from "@/components/tanker/tanker-drivers-settings";
import { formatCurrencyForIndia } from "@/lib/utils";
import { formatBookingDate } from "@/lib/tanker-date";
import type { DateRange } from "react-day-picker";
import type { DriverSummaryRow, TankerBookingRow } from "@/action/tanker";
import { Separator } from "../ui/separator";

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          highlight
            ? "mt-1 text-sm font-bold text-primary"
            : "mt-1 text-sm font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function TankerMobileView({
  dateRange,
  onDateChange,
  summaries,
  bookings,
  grandTotals,
  loadingSummary,
  loadingBookings,
  page,
  pageCount,
  totalCount,
  onDriverClick,
  onAddEntry,
  onPrevPage,
  onNextPage,
  onOpenDriverSettings,
  onEditBooking,
}: {
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  summaries: DriverSummaryRow[];
  bookings: TankerBookingRow[];
  grandTotals: { liters: number; amount: number; bookings: number };
  loadingSummary: boolean;
  loadingBookings: boolean;
  page: number;
  pageCount: number;
  totalCount: number;
  onDriverClick: (driver: DriverSummaryRow) => void;
  onAddEntry: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenDriverSettings: () => void;
  onEditBooking: (booking: TankerBookingRow) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5 pb-28">
      <TankerDateFilter value={dateRange} onChange={onDateChange} />

      {/* Driver Summary */}
      <section className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">Driver Summary</h2>
            <p className="text-sm text-muted-foreground">
              Aggregated performance for the period.
            </p>
          </div>
          <TankerDriversSettingsButton onClick={onOpenDriverSettings} />
        </div>

        {loadingSummary ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : summaries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No bookings in this date range.
          </p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <StatTile
                label="Drivers"
                value={`${summaries.length} driver${summaries.length === 1 ? "" : "s"}`}
              />
              <StatTile
                label="Bookings"
                value={`${grandTotals.bookings} booking${grandTotals.bookings === 1 ? "" : "s"}`}
              />
              <StatTile
                label="Total Volume"
                value={`${grandTotals.liters.toLocaleString("en-IN")} L`}
              />
              <StatTile
                label="Total Value"
                value={formatCurrencyForIndia(grandTotals.amount)}
                highlight
              />
            </div>

            <div className="flex flex-col gap-3">
              {summaries.map((s) => (
                <button
                  key={s.driverId}
                  type="button"
                  onClick={() => onDriverClick(s)}
                  className="w-full rounded-xl border bg-background p-4 text-left transition-colors active:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-base font-bold">
                        {s.driverName}
                      </span>
                      {/* <Badge
                        variant="secondary"
                        className="shrink-0 rounded-md bg-primary/10 px-2 py-0 text-[10px] font-bold uppercase tracking-wide text-primary hover:bg-primary/10"
                      >
                        Active
                      </Badge> */}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-foreground">
                        {formatCurrencyForIndia(s.totalAmount)}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Total Earned
                      </p>
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.driverPhone}
                  </p>

                  <div className="my-3 border-t" />

                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 shrink-0" />
                        {s.bookingCount} trip
                        {s.bookingCount === 1 ? "" : "s"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Droplets className="h-4 w-4 shrink-0 text-blue-500" />
                        {s.totalWaterLiters.toLocaleString("en-IN")} L
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* All Bookings */}
      <section className="min-w-0">
        <div className="mb-3">
          <h2 className="text-lg font-bold tracking-tight">All Bookings</h2>
          <p className="text-sm text-muted-foreground">
            Individual tanker delivery logs.
          </p>
        </div>

        {loadingBookings ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : bookings.length === 0 ? (
          <p className="rounded-2xl border bg-card py-8 text-center text-sm text-muted-foreground">
            No bookings in this date range.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-base font-bold text-foreground">
                        {b.driverName}
                      </p>
                      <p className="shrink-0 text-base font-bold">
                        {formatCurrencyForIndia(parseFloat(b.amount))}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        {formatBookingDate(b.tankerDate)} •{" "}
                        {b.waterLiters.toLocaleString("en-IN")} L
                      </p>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        <CircleCheck className="h-4 w-4" />
                        PAID
                        <button onClick={() => onEditBooking(b)} className="flex gap-1 items-center">
                        <Separator orientation="vertical" className="h-4 bg-gray-300"/>
                        <Pencil
                          size={14}
                          
                        />
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {pageCount > 1 && (
              <div className="mt-2 flex flex-col gap-3 rounded-xl border bg-card p-4">
                <p className="text-center text-sm text-muted-foreground">
                  Page {page} of {pageCount} · {totalCount} total
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1"
                    disabled={page <= 1}
                    onClick={onPrevPage}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1"
                    disabled={page >= pageCount}
                    onClick={onNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <Button
        type="button"
        size="lg"
        className="fixed bottom-6 right-4 z-40 h-14 rounded-full px-6 text-base font-semibold shadow-lg"
        onClick={onAddEntry}
      >
        <Plus className="mr-2 h-5 w-5" />
        Add entry
      </Button>
    </div>
  );
}
