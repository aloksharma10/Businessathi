"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
import { TagBadge } from "@/components/ui/tag-badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Customer,
  LocalCustomer,
  LocalProduct,
  PlantCustomer,
  PlantProduct,
  Product,
} from "@prisma/client";
import {
  createCustomerProductEntry,
  getLinesFromLastCustomerProductEntry,
  type EntryKind,
} from "@/action/customer-product-entry";
import { ProductLinesEditor } from "@/components/customer-product-entry/product-lines-editor";
import { FlexiblePlantCustomerCombobox } from "@/components/customer-product-entry/flexible-plant-customer-combobox";
import { FlexiblePlantProductLinesEditor } from "@/components/customer-product-entry/flexible-plant-product-lines-editor";

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

  const filteredLocalCustomers = useMemo(() => {
    if (tagFilter.length === 0) return localCustomersRows;
    return localCustomersRows.filter((c) => {
      const tags = localCustomers.find((x) => x.id === c.id)?.tags ?? [];
      return tagFilter.some((t) => tags.includes(t));
    });
  }, [localCustomers, localCustomersRows, tagFilter]);

  const filteredLocalProducts = useMemo(() => {
    if (tagFilter.length === 0) return localProducts;
    return localProducts.filter((p) =>
      tagFilter.some((t) => (p.tags ?? []).includes(t))
    );
  }, [localProducts, tagFilter]);

  const plantCustomersRows: CustomerRow[] = useMemo(
    () =>
      plantCustomers.map((c) => ({
        id: c.id,
        customerName: c.customerName,
        address: c.address,
      })),
    [plantCustomers]
  );

  const filteredPlantCustomers = useMemo(() => {
    if (tagFilter.length === 0) return plantCustomersRows;
    return plantCustomersRows.filter((c) => {
      const tags = plantCustomers.find((x) => x.id === c.id)?.tags ?? [];
      return tagFilter.some((t) => tags.includes(t));
    });
  }, [plantCustomers, plantCustomersRows, tagFilter]);

  const filteredPlantProducts = useMemo(() => {
    if (tagFilter.length === 0) return plantProducts;
    return plantProducts.filter((p) =>
      tagFilter.some((t) => (p.tags ?? []).includes(t))
    );
  }, [plantProducts, tagFilter]);

  const customersList =
    entryKind === "gst"
      ? filteredGstCustomers
      : entryKind === "local"
        ? filteredLocalCustomers
        : filteredPlantCustomers;

  const productsList =
    entryKind === "gst"
      ? filteredGstProducts.map((p) => ({
          id: p.id,
          productName: p.productName,
        }))
      : entryKind === "local"
        ? filteredLocalProducts.map((p) => ({
            id: p.id,
            productName: p.productName,
          }))
        : filteredPlantProducts.map((p) => ({
            id: p.id,
            productName: p.productName,
          }));

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
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save entry.");
    }
  };

  const currCustomer = customersList.find((c) => c.id === customerId);

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Customer &amp; product entry</CardTitle>
          <CardDescription>
            GST, General (local), and Plant entry types. Tags can be set on any
            customer or product and used to narrow the pick lists below.
            Defaults come from the last saved entry for that customer.{" "}
            <Link
              href="/customer-product-entries/saved"
              className="text-primary underline underline-offset-2 font-medium"
            >
              View saved entries
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitEntry)}
              onSubmitCapture={(e) => {
                const formEl = e.currentTarget;
                if (!(formEl instanceof HTMLFormElement)) return;
                const active = document.activeElement;
                if (
                  active instanceof HTMLInputElement &&
                  active.hasAttribute("data-qty-line") &&
                  formEl.contains(active)
                ) {
                  active.blur();
                }
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <FormLabel>Customer type</FormLabel>
                <ToggleGroup
                  type="single"
                  value={entryKind}
                  onValueChange={(v) => {
                    if (v === "gst" || v === "local" || v === "plant")
                      setEntryKind(v);
                  }}
                  className="justify-start flex-wrap"
                >
                  <ToggleGroupItem value="gst" aria-label="GST">
                    GST
                  </ToggleGroupItem>
                  <ToggleGroupItem value="local" aria-label="General">
                    General
                  </ToggleGroupItem>
                  <ToggleGroupItem value="plant" aria-label="Plant">
                    Plant
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground">
                  GST uses registered GST masters; General uses local customers
                  and products; Plant lets you type names and auto-creates
                  records when needed.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Filter by tags (optional)
                </label>
                {allTagOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add tags on customers or products (any type) to enable
                    filtering here.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {allTagOptions.map((t) => (
                      <TagBadge
                        key={t}
                        tag={t}
                        mode={tagFilter.includes(t) ? "selected" : "outline"}
                        className="cursor-pointer font-bold"
                        onClick={() =>
                          setTagFilter((prev) =>
                            prev.includes(t)
                              ? prev.filter((x) => x !== t)
                              : [...prev, t]
                          )
                        }
                      >
                        {t}
                      </TagBadge>
                    ))}
                  </div>
                )}
                {tagFilter.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Showing customers and products for this type that match at
                    least one selected tag.
                  </p>
                )}
              </div>

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
                render={({ field }) =>
                  entryKind === "plant" ? (
                    <FormItem className="flex flex-col w-full">
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <FlexiblePlantCustomerCombobox
                          userId={userId}
                          customers={
                            tagFilter.length === 0
                              ? plantCustomers
                              : plantCustomers.filter((c) =>
                                  tagFilter.some((t) =>
                                    (c.tags ?? []).includes(t)
                                  )
                                )
                          }
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : (
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
                                      : "No general customers match the tag filter."
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
                  )
                }
              />

              <FormField
                control={form.control}
                name="lineItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Products &amp; quantities</FormLabel>
                    <FormControl>
                      {entryKind === "plant" ? (
                        <FlexiblePlantProductLinesEditor
                          userId={userId}
                          products={
                            tagFilter.length === 0
                              ? plantProducts
                              : plantProducts.filter((p) =>
                                  tagFilter.some((t) =>
                                    (p.tags ?? []).includes(t)
                                  )
                                )
                          }
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      ) : (
                        <ProductLinesEditor
                          products={productsList}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      )}
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
    </div>
  );
}
