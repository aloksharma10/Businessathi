"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format, subDays, endOfDay, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagBadge } from "@/components/ui/tag-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Customer,
  LocalCustomer,
  LocalProduct,
  PlantCustomer,
  PlantProduct,
  Product,
} from "@prisma/client";
import {
  listCustomerProductEntries,
  CustomerProductEntryListRow,
} from "@/action/customer-product-entry";
import { SavedEntriesDateRangePicker } from "@/components/customer-product-entry/saved-entries-date-range";

function defaultDateRange(): DateRange {
  return {
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  };
}

export function SavedCustomerProductEntries({
  gstCustomers,
  localCustomers,
  gstProducts,
  localProducts,
  plantCustomers,
  plantProducts,
}: {
  gstCustomers: Customer[];
  localCustomers: LocalCustomer[];
  gstProducts: Product[];
  localProducts: LocalProduct[];
  plantCustomers: PlantCustomer[];
  plantProducts: PlantProduct[];
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultDateRange
  );
  const [savedTagFilter, setSavedTagFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<CustomerProductEntryListRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const allTagOptions = useMemo(() => {
    const s = new Set<string>();
    const add = (tags: string[] | undefined) => {
      for (const t of tags ?? []) {
        if (t?.trim()) s.add(t.trim().toUpperCase());
      }
    };
    for (const c of gstCustomers) add(c.tags);
    for (const p of gstProducts) add(p.tags);
    for (const c of localCustomers) add(c.tags);
    for (const p of localProducts) add(p.tags);
    for (const c of plantCustomers) add(c.tags);
    for (const p of plantProducts) add(p.tags);
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [
    gstCustomers,
    gstProducts,
    localCustomers,
    localProducts,
    plantCustomers,
    plantProducts,
  ]);

  const filterCustomerOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [];
    for (const c of gstCustomers) {
      opts.push({ id: c.id, label: `[GST] ${c.customerName}` });
    }
    for (const c of localCustomers) {
      opts.push({ id: c.id, label: `[General] ${c.customerName}` });
    }
    for (const c of plantCustomers) {
      opts.push({ id: c.id, label: `[Plant] ${c.customerName}` });
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [gstCustomers, localCustomers, plantCustomers]);

  const loadEntries = useCallback(async () => {
    if (!userId) return;
    setLoadingEntries(true);
    try {
      const res = await listCustomerProductEntries({
        userId,
        customerId: filterCustomerId || undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
        tagFilter:
          savedTagFilter.length > 0 ? savedTagFilter : undefined,
        page,
        pageSize,
      });
      setRows(res.rows);
      setTotalCount(res.totalCount);
      setPageCount(res.pageCount);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load entries.");
    } finally {
      setLoadingEntries(false);
    }
  }, [
    userId,
    filterCustomerId,
    dateRange?.from,
    dateRange?.to,
    savedTagFilter,
    page,
    pageSize,
  ]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleExportXlsx = async () => {
    try {
      const res = await fetch("/api/customer-product-entries/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: filterCustomerId || undefined,
          dateFrom: dateRange?.from
            ? dateRange.from.toISOString()
            : undefined,
          dateTo: dateRange?.to ? dateRange.to.toISOString() : undefined,
          tagFilter:
            savedTagFilter.length > 0 ? savedTagFilter : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "export.xlsx";
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Could not export. Try again."
      );
    }
  };

  return (
    <div className="max-w-6xl">
      <Card className="border-2 shadow-lg">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Saved entries</CardTitle>
            <CardDescription>
              Filter by customer, tags, and/or date range (matches entry date
              when set, otherwise saved time for older rows), then export to
              Excel.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2 shrink-0"
            onClick={handleExportXlsx}
          >
            <Download className="h-4 w-4" />
            Export XLSX
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:items-end">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1 min-w-0">
                <label className="text-sm font-medium">Customer (optional)</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={filterCustomerId}
                  onChange={(e) => {
                    setFilterCustomerId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All customers</option>
                  {filterCustomerOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <SavedEntriesDateRangePicker
                className="sm:col-span-2"
                value={dateRange}
                onChange={(r) => {
                  setDateRange(r);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Filter by tags (optional)
              </label>
              {allTagOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add tags on customers or products to filter saved rows here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {allTagOptions.map((t) => (
                    <TagBadge
                      key={t}
                      tag={t}
                      mode={
                        savedTagFilter.includes(t) ? "selected" : "outline"
                      }
                      className="cursor-pointer font-normal"
                      onClick={() => {
                        setSavedTagFilter((prev) =>
                          prev.includes(t)
                            ? prev.filter((x) => x !== t)
                            : [...prev, t]
                        );
                        setPage(1);
                      }}
                    >
                      {t}
                    </TagBadge>
                  ))}
                </div>
              )}
              {savedTagFilter.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing entries whose customer or any line product has at least
                  one selected tag.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEntries ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(
                          r.entryDate ?? r.createdAt,
                          "dd/MM/yyyy HH:mm"
                        )}
                      </TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell className="max-w-[280px] text-sm">
                        {r.productNames}
                      </TableCell>
                      <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                        {r.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalCount > pageSize && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {totalCount} total · page {page} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
        </CardContent>
      </Card>
    </div>
  );
}
