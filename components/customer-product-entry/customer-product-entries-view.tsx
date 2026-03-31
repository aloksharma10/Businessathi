"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckIcon, ChevronsUpDownIcon, Download } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Customer, LocalCustomer, LocalProduct, Product } from "@prisma/client";
import {
  createCustomerProductEntry,
  getLinesFromLastCustomerProductEntry,
  listCustomerProductEntries,
  CustomerProductEntryListRow,
  type EntryKind,
} from "@/action/customer-product-entry";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductLinesEditor } from "@/components/customer-product-entry/product-lines-editor";

function todayInputDate() {
  return format(new Date(), "yyyy-MM-dd");
}

const entryFormSchema = z.object({
  entryDate: z.string().min(1, "Pick an entry date."),
  customerId: z.string().min(1, "Please select a customer."),
  lineItems: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().min(1).max(999999),
      })
    )
    .min(1, "Add at least one product."),
  notes: z.string().optional(),
});

type CustomerRow = { id: string; customerName: string; address: string };

export function CustomerProductEntriesView({
  gstCustomers,
  localCustomers,
  gstProducts,
  localProducts,
}: {
  gstCustomers: Customer[];
  localCustomers: LocalCustomer[];
  gstProducts: Product[];
  localProducts: LocalProduct[];
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const [entryKind, setEntryKind] = useState<EntryKind>("gst");
  const kindSwitchIsFirst = useRef(true);

  const form = useForm<z.infer<typeof entryFormSchema>>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      entryDate: todayInputDate(),
      customerId: "",
      lineItems: [],
      notes: "",
    },
  });

  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const allTagOptions = useMemo(() => {
    const s = new Set<string>();
    for (const c of gstCustomers) {
      for (const t of c.tags ?? []) {
        if (t?.trim()) s.add(t.trim().toUpperCase());
      }
    }
    for (const p of gstProducts) {
      for (const t of p.tags ?? []) {
        if (t?.trim()) s.add(t.trim().toUpperCase());
      }
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [gstCustomers, gstProducts]);

  const gstCustomersRows: CustomerRow[] = useMemo(
    () =>
      gstCustomers.map((c) => ({
        id: c.id,
        customerName: c.customerName,
        address: c.address,
      })),
    [gstCustomers]
  );

  const localCustomersRows: CustomerRow[] = useMemo(
    () =>
      localCustomers.map((c) => ({
        id: c.id,
        customerName: c.customerName,
        address: c.address,
      })),
    [localCustomers]
  );

  const filteredGstCustomers = useMemo(() => {
    if (tagFilter.length === 0) return gstCustomersRows;
    return gstCustomersRows.filter((c) => {
      const tags = gstCustomers.find((x) => x.id === c.id)?.tags ?? [];
      return tagFilter.some((t) => tags.includes(t));
    });
  }, [gstCustomers, gstCustomersRows, tagFilter]);

  const filteredGstProducts = useMemo(() => {
    if (tagFilter.length === 0) return gstProducts;
    return gstProducts.filter((p) =>
      tagFilter.some((t) => (p.tags ?? []).includes(t))
    );
  }, [gstProducts, tagFilter]);

  const customersList = entryKind === "gst" ? filteredGstCustomers : localCustomersRows;
  const productsList =
    entryKind === "gst"
      ? filteredGstProducts.map((p) => ({ id: p.id, productName: p.productName }))
      : localProducts.map((p) => ({ id: p.id, productName: p.productName }));

  const filteredProductsRef = useRef(productsList);
  filteredProductsRef.current = productsList;

  const [popoverOpen, setPopoverOpen] = useState(false);
  const customerId = form.watch("customerId");

  useEffect(() => {
    if (kindSwitchIsFirst.current) {
      kindSwitchIsFirst.current = false;
      return;
    }
    form.setValue("customerId", "");
    form.setValue("lineItems", []);
  }, [entryKind, form]);

  useEffect(() => {
    const id = form.getValues("customerId");
    if (!id) return;
    const ok = customersList.some((c) => c.id === id);
    if (!ok) {
      form.setValue("customerId", "");
      form.setValue("lineItems", []);
    }
  }, [customersList, form]);

  useEffect(() => {
    const lines = form.getValues("lineItems");
    const allowed = new Set(productsList.map((p) => p.id));
    const next = lines.filter((l) => allowed.has(l.productId));
    if (next.length !== lines.length) {
      form.setValue("lineItems", next);
    }
  }, [productsList, form]);

  useEffect(() => {
    if (!customerId || !userId) {
      form.setValue("lineItems", []);
      return;
    }
    let cancelled = false;
    (async () => {
      const lines = await getLinesFromLastCustomerProductEntry(
        userId,
        entryKind,
        customerId
      );
      if (cancelled) return;
      const allowed = new Set(filteredProductsRef.current.map((p) => p.id));
      form.setValue(
        "lineItems",
        lines.filter((l) => allowed.has(l.productId))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, userId, entryKind, form]);

  const {
    formState: { isSubmitting },
  } = form;

  const onSubmitEntry = async (data: z.infer<typeof entryFormSchema>) => {
    if (!userId) {
      toast.error("You must be signed in.");
      return;
    }
    try {
      await createCustomerProductEntry(userId, {
        kind: entryKind,
        customerId: data.customerId,
        productLines: data.lineItems,
        entryDate: parse(data.entryDate, "yyyy-MM-dd", new Date()),
        notes: data.notes,
      });
      toast.success("Entry saved.");
      form.reset({
        entryDate: todayInputDate(),
        customerId: "",
        lineItems: [],
        notes: "",
      });
      loadEntries();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save entry.");
    }
  };

  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<CustomerProductEntryListRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!userId) return;
    setLoadingEntries(true);
    try {
      const res = await listCustomerProductEntries({
        userId,
        customerId: filterCustomerId || undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
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
  }, [userId, filterCustomerId, dateFrom, dateTo, page, pageSize]);

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
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
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

  const currCustomer = customersList.find((c) => c.id === customerId);

  const filterCustomerOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [];
    for (const c of gstCustomers) {
      opts.push({ id: c.id, label: `[GST] ${c.customerName}` });
    }
    for (const c of localCustomers) {
      opts.push({ id: c.id, label: `[General] ${c.customerName}` });
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [gstCustomers, localCustomers]);

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Customer &amp; product entry</CardTitle>
          <CardDescription>
            Works for both GST and General (local) customers. Tag filters apply
            to GST only. Defaults come from the last saved entry for that
            customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitEntry)}
              className="space-y-6"
            >
              <div className="space-y-2">
                <FormLabel>Customer type</FormLabel>
                <ToggleGroup
                  type="single"
                  value={entryKind}
                  onValueChange={(v) => {
                    if (v === "gst" || v === "local") setEntryKind(v);
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="gst" aria-label="GST">
                    GST
                  </ToggleGroupItem>
                  <ToggleGroupItem value="local" aria-label="General">
                    General
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground">
                  Choose whether this row uses GST customers/products or General
                  (local) ones.
                </p>
              </div>

              {entryKind === "gst" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Filter by tags (optional)
                  </label>
                  {allTagOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Add tags on GST customers or products to enable filtering.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {allTagOptions.map((t) => (
                        <Badge
                          key={t}
                          variant={tagFilter.includes(t) ? "default" : "outline"}
                          className="cursor-pointer font-normal"
                          onClick={() =>
                            setTagFilter((prev) =>
                              prev.includes(t)
                                ? prev.filter((x) => x !== t)
                                : [...prev, t]
                            )
                          }
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {tagFilter.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Showing GST customers and products that match at least one
                      selected tag.
                    </p>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full">
                    <FormLabel>Customer</FormLabel>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between border-2 shadow",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {currCustomer
                              ? currCustomer.customerName
                              : "Select customer"}
                            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search customer…" />
                          <CommandList>
                            <ScrollArea className="h-48 rounded-md border pr-2">
                              <CommandEmpty>
                                {customersList.length === 0
                                  ? entryKind === "gst"
                                    ? "No customers match the tag filter."
                                    : "No general customers yet."
                                  : "No customer found."}
                              </CommandEmpty>
                              <CommandGroup>
                                {customersList.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={`${c.customerName} ${c.address}`}
                                    onSelect={() => {
                                      form.setValue("customerId", c.id);
                                      setPopoverOpen(false);
                                    }}
                                  >
                                    <CheckIcon
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        c.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {c.customerName}
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

              <FormField
                control={form.control}
                name="lineItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Products &amp; quantities</FormLabel>
                    <FormControl>
                      <ProductLinesEditor
                        products={productsList}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Optional notes for this entry"
                        className={cn(
                          "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
                          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting || !userId}>
                {isSubmitting ? "Saving…" : "Save entry"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-lg">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Saved entries</CardTitle>
            <CardDescription>
              Filter by customer and/or date range (matches entry date when set,
              otherwise saved time for older rows), then export to Excel.
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
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[88px]">Type</TableHead>
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
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-medium">
                        {r.kind === "gst" ? "GST" : "General"}
                      </TableCell>
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
