"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TankerDateFilter } from "@/components/tanker/tanker-date-filter";
import { TankerMobileView } from "@/components/tanker/tanker-mobile-view";
import { TankerBookingModal } from "@/components/tanker/tanker-booking-modal";
import { DriverBookingsSheet } from "@/components/tanker/driver-bookings-sheet";
import {
  TankerDriversSettings,
  TankerDriversSettingsButton,
} from "@/components/tanker/tanker-drivers-settings";
import { EditTankerBookingModal } from "@/components/tanker/edit-tanker-booking-modal";
import { formatCurrencyForIndia } from "@/lib/utils";
import {
  formatBookingDate,
  toUtcDayStart,
  toUtcDayEnd,
} from "@/lib/tanker-date";
import {
  getDriverSummaries,
  getTankerDrivers,
  listTankerBookings,
  type DriverSummaryRow,
  type TankerBookingRow,
  type TankerDriverOption,
} from "@/action/tanker";

function defaultDateRange(): DateRange {
  const today = new Date();
  return { from: toUtcDayStart(today), to: toUtcDayEnd(today) };
}

export function Tanker({
  initialDrivers,
}: {
  initialDrivers: TankerDriverOption[];
}) {
  const [drivers, setDrivers] = useState(initialDrivers);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultDateRange
  );
  const [summaries, setSummaries] = useState<DriverSummaryRow[]>([]);
  const [bookings, setBookings] = useState<TankerBookingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<DriverSummaryRow | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [driversSettingsOpen, setDriversSettingsOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<TankerBookingRow | null>(
    null
  );
  const [editBookingOpen, setEditBookingOpen] = useState(false);

  const refreshDrivers = useCallback(async () => {
    try {
      const list = await getTankerDrivers();
      setDrivers(list);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoadingSummary(true);
    setLoadingBookings(true);
    try {
      const [summaryData, bookingData] = await Promise.all([
        getDriverSummaries({
          dateFrom: dateRange?.from,
          dateTo: dateRange?.to,
        }),
        listTankerBookings({
          dateFrom: dateRange?.from,
          dateTo: dateRange?.to,
          page,
          pageSize,
        }),
      ]);
      setSummaries(summaryData);
      setBookings(bookingData.rows);
      setTotalCount(bookingData.totalCount);
      setPageCount(bookingData.pageCount);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load tanker data.");
    } finally {
      setLoadingSummary(false);
      setLoadingBookings(false);
    }
  }, [dateRange?.from, dateRange?.to, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEntrySuccess = () => {
    refreshDrivers();
    setPage(1);
    loadData();
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const handleDriverClick = (driver: DriverSummaryRow) => {
    setSelectedDriver(driver);
    setSheetOpen(true);
  };

  const handleEditBooking = (booking: TankerBookingRow) => {
    setEditingBooking(booking);
    setEditBookingOpen(true);
  };

  const handleEditBookingSuccess = () => {
    setEditingBooking(null);
    loadData();
    refreshDrivers();
  };

  const grandTotals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        liters: acc.liters + s.totalWaterLiters,
        amount: acc.amount + s.totalAmount,
        bookings: acc.bookings + s.bookingCount,
      }),
      { liters: 0, amount: 0, bookings: 0 }
    );
  }, [summaries]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden">
      <TankerBookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        drivers={drivers}
        onSuccess={handleEntrySuccess}
        onDriversChange={refreshDrivers}
      />

      <TankerDriversSettings
        open={driversSettingsOpen}
        onOpenChange={setDriversSettingsOpen}
        drivers={drivers}
        onDriversChange={() => {
          refreshDrivers();
          loadData();
        }}
      />

      <EditTankerBookingModal
        open={editBookingOpen}
        onOpenChange={(open) => {
          setEditBookingOpen(open);
          if (!open) setEditingBooking(null);
        }}
        booking={editingBooking}
        drivers={drivers}
        onSuccess={handleEditBookingSuccess}
      />

      {/* Mobile */}
      <div className="md:hidden">
        <TankerMobileView
          dateRange={dateRange}
          onDateChange={handleDateChange}
          summaries={summaries}
          bookings={bookings}
          grandTotals={grandTotals}
          loadingSummary={loadingSummary}
          loadingBookings={loadingBookings}
          page={page}
          pageCount={pageCount}
          totalCount={totalCount}
          onDriverClick={handleDriverClick}
          onAddEntry={() => setBookingModalOpen(true)}
          onPrevPage={() => setPage((p) => p - 1)}
          onNextPage={() => setPage((p) => p + 1)}
          onOpenDriverSettings={() => setDriversSettingsOpen(true)}
          onEditBooking={handleEditBooking}
        />
      </div>

      {/* Desktop */}
      <div className="hidden flex-col gap-6 pb-6 md:flex">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Fleet Overview
              </CardTitle>
              <CardDescription>
                Track water bookings and driver totals by date.
              </CardDescription>
            </div>
            <Button
              type="button"
              className="h-11 shrink-0"
              onClick={() => setBookingModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add entry
            </Button>
          </CardHeader>
          <CardContent>
            <TankerDateFilter
              variant="desktop"
              value={dateRange}
              onChange={handleDateChange}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold">Driver Summary</CardTitle>
                <CardDescription>
                  Aggregated performance for the period.
                </CardDescription>
              </div>
              <TankerDriversSettingsButton
                onClick={() => setDriversSettingsOpen(true)}
              />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                  Loading summary…
                </div>
              ) : summaries.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No bookings in this date range.
                </p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {summaries.length} driver
                      {summaries.length === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="outline">
                      {grandTotals.bookings} booking
                      {grandTotals.bookings === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="outline">
                      {grandTotals.liters.toLocaleString("en-IN")} L
                    </Badge>
                    <Badge variant="outline" className="text-primary">
                      {formatCurrencyForIndia(grandTotals.amount)}
                    </Badge>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Driver</TableHead>
                          <TableHead className="text-right">Trips</TableHead>
                          <TableHead className="text-right">Water (L)</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summaries.map((s) => (
                          <TableRow key={s.driverId}>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => handleDriverClick(s)}
                                className="text-left font-semibold hover:underline"
                              >
                                {s.driverName}
                              </button>
                              <p className="text-xs text-muted-foreground">
                                {s.driverPhone}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              {s.bookingCount}
                            </TableCell>
                            <TableCell className="text-right">
                              {s.totalWaterLiters.toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrencyForIndia(s.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">All Bookings</CardTitle>
              <CardDescription>
                Individual tanker delivery logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                  Loading bookings…
                </div>
              ) : bookings.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No bookings in this date range.
                </p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead className="text-right">Liters</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>
                              {formatBookingDate(b.tankerDate)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {b.driverName}
                            </TableCell>
                            <TableCell className="text-right">
                              {b.waterLiters.toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              {formatCurrencyForIndia(parseFloat(b.amount))}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Edit booking"
                                onClick={() => handleEditBooking(b)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {pageCount > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Page {page} of {pageCount} · {totalCount} total
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={page >= pageCount}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DriverBookingsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        driver={selectedDriver}
        dateRange={dateRange}
      />
    </div>
  );
}
