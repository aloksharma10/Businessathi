"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEffect, useState } from "react";
import { LocalCustomer, LocalInvoice } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import MultipleSelector from "@/components/ui/multi-selector";
import { useSession } from "next-auth/react";
import { useModal } from "@/store/store";
import { CreateLocalInvoice, updateLocalInvoice } from "@/action/invoice";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { getLastLocalInvoiceNo } from "@/lib/db-utils";

const FormSchemaLocalInvoice = z.object({
  localInvoiceNo: z
    .string()
    .min(2, "Customer name must be at least 2 characters."),
  localInvoiceDate: z.date(),
  monthOf: z.string().min(1, "Please select a month."),
  yearOf: z.string().min(1, "Please select a year."),
  customerId: z.string().min(2, "Please select a customer."),
  localTotalInvoiceValue: z
    .number()
    .min(1, "Total invoice value must be at least 1."),
});

export function LocalInvoiceForm({
  userId,
  customers,
  productDetails,
  products,
  localInvoiceData,
  mode= "create",
  customerId,
  onSuccess
}: {
  userId: string;
  customers: LocalCustomer[];
  products: any[];
  productDetails?: string;
  localInvoiceData?: LocalInvoice;
  mode?: "create" | "edit";
  customerId?: string;
  onSuccess?: () => void;
}) {
  const [productPrices, setProductPrices] = useState<any[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [lastInvoiceNo, setLastInvoiceNo] = useState<number>(2001);
  const [isLoadingInvoiceNo, setIsLoadingInvoiceNo] = useState(true);

  const allProducts = products?.map((product) => ({
    label: product.productName,
    value: product.id,
    ...product,
  }));

  const currDate = new Date();
  const lastMonth = new Date(
    currDate.setMonth(currDate.getMonth() - 1)
  ).toLocaleString("en-US", { month: "long" });

  const getLastInvoice = async (userId: string): Promise<any> => {
    try {
      const response = await getLastLocalInvoiceNo(userId);
      return (Number(response) + 1).toString();
    } catch (error) {
      console.error("Error fetching last invoice number:", error);
      return 2001;
    }
  };

  const fetchLastInvoiceNo = async () => {
    if (!userId) return;

    setIsLoadingInvoiceNo(true);
    try {
      const invoiceNo = await getLastInvoice(userId);
      setLastInvoiceNo(invoiceNo);
      form.setValue("localInvoiceNo", invoiceNo.toString());
    } catch (error) {
      console.error("Error fetching last invoice number:", error);
      toast.error("Failed to fetch invoice number");
    } finally {
      setIsLoadingInvoiceNo(false);
    }
  };

  useEffect(() => {
    if (mode === "create") {
      fetchLastInvoiceNo();
    }
  }, [userId, mode]);

  const form = useForm({
    resolver: zodResolver(FormSchemaLocalInvoice),
    defaultValues: {
      localInvoiceNo: mode === "edit" && localInvoiceData ? localInvoiceData.localInvoiceNo : "",
      monthOf: lastMonth,
      yearOf: currDate.getFullYear().toString(),
      localInvoiceDate: new Date(),
      customerId: customerId || "",
      address: "",
      productDetails: [],
      localTotalInvoiceValue: 0,
    },
  });

  const currLocalCustomerId = form.watch("customerId");
  const selectProduct = form.watch("productDetails");

  const currLocalCustomer = customers.find(
    (customer: any) => customer.id === currLocalCustomerId
  );

  useEffect(() => {
    if (mode === "edit" && localInvoiceData) {
      // Set basic form values
      form.setValue("localInvoiceNo", localInvoiceData.localInvoiceNo);
      form.setValue("localInvoiceDate", new Date(localInvoiceData.localInvoiceDate));
      form.setValue("monthOf", localInvoiceData.monthOf);
      form.setValue("yearOf", localInvoiceData.yearOf);
      form.setValue("customerId", localInvoiceData.customerId);
      form.setValue("localTotalInvoiceValue", Number(localInvoiceData.localTotalInvoiceValue));

      // Map products from localInvoiceData.pricedProducts (if available)
      const pricedProducts = (localInvoiceData as any).pricedProducts;
      if (pricedProducts && pricedProducts.length > 0) {
        const mappedProducts = pricedProducts.map((pricedProduct: any) => {
          const product = products.find((p: any) => p.id === pricedProduct.productId);
          return {
            id: pricedProduct.productId,
            label: product?.productName || "",
            value: pricedProduct.productId,
            productName: product?.productName || "",
            qty: pricedProduct.qty,
            rate: pricedProduct.rate,
            productTotalValue: Number(pricedProduct.productTotalValue),
            ...product,
          };
        });

        // Set product details for the multi-selector
        form.setValue("productDetails", mappedProducts);
        
        // Set product prices for calculations
        setProductPrices(mappedProducts);
      }
    }
  }, [localInvoiceData, form, mode, products]);

  // Handle product selection changes
  useEffect(() => {
    if (mode === "create" || !localInvoiceData) {
      // In create mode, map selected products to productPrices
      const newSelectedProducts = selectProduct.map((product: any) => {
        const productInfo = productPrices.find((p) => p.id === product.value);
        return productInfo ? { ...product, ...productInfo } : product;
      });
      // Only update if the selection has actually changed
      if (JSON.stringify(newSelectedProducts.sort((a: any, b: any) => a.value.localeCompare(b.value))) !== JSON.stringify(productPrices.sort((a: any, b: any) => a.value.localeCompare(b.value)))) {
        setProductPrices(newSelectedProducts);
      }
    } else {
      // In edit mode, only update if products are actually changed
      const currentProductIds = productPrices.map(p => p.id);
      const selectedProductIds = selectProduct.map((p: any) => p.value);
      
      // Only update if the selection has actually changed
      if (JSON.stringify(currentProductIds.sort()) !== JSON.stringify(selectedProductIds.sort())) {
        const newSelectedProducts = selectProduct.map((product: any) => {
          const productInfo = productPrices.find((p) => p.id === product.value);
          return productInfo ? { ...product, ...productInfo } : product;
        });
        setProductPrices(newSelectedProducts);
      }
    }
  }, [selectProduct, mode, localInvoiceData]);

  useEffect(() => {
    const totalTaxableValue = productPrices.reduce(
      (acc, product) => acc + Number(product.productTotalValue || 0),
      0
    );
    form.setValue("localTotalInvoiceValue", Number(totalTaxableValue));
  }, [productPrices, form]);

  const handleProductInfoChange = (
    name: string,
    value: any,
    id: string,
    item: any
  ) => {
    const updatedProductInfos = productPrices.map((product) => {
      if (product.id !== id) return product;

      let productTotalValue = 0;
      const newProduct = { ...product, [name]: Number(value) };

      if (name === "rate") {
        productTotalValue = Number(value) * (product.qty || 0);
      } else if (name === "qty") {
        productTotalValue = Number(value) * (product.rate || 0);
      }

      return {
        ...newProduct,
        productTotalValue: productTotalValue,
      };
    });

    const productExists = updatedProductInfos.some(
      (product) => product.id === id
    );

    if (!productExists && mode === "create") {
      // Only add new products in create mode
      const newProduct = {
        id,
        [name]: Number(value),
        productTotalValue: 0,
        qty: name === "qty" ? Number(value) : 0,
        rate: name === "rate" ? Number(value) : 0,
      };
      setProductPrices([...productPrices, newProduct]);
    } else {
      setProductPrices(updatedProductInfos);
    }
  };

  const {
    formState: { isSubmitting },
  } = form;

  const session = useSession();
  const { onClose, triggerRefresh } = useModal();

  useEffect(() => {
    if (localInvoiceData && mode === "edit") {
      // Set basic form values
      form.setValue("localInvoiceNo", localInvoiceData.localInvoiceNo);
      form.setValue("localInvoiceDate", new Date(localInvoiceData.localInvoiceDate));
      form.setValue("monthOf", localInvoiceData.monthOf);
      form.setValue("yearOf", localInvoiceData.yearOf);
      form.setValue("customerId", localInvoiceData.customerId);
      form.setValue("localTotalInvoiceValue", Number(localInvoiceData.localTotalInvoiceValue));

      // Map products from localInvoiceData.pricedProducts (if available)
      const pricedProducts = (localInvoiceData as any).pricedProducts;
      if (pricedProducts && pricedProducts.length > 0) {
        const mappedProducts = pricedProducts.map((pricedProduct: any) => {
          const product = products.find((p: any) => p.id === pricedProduct.productId);
          return {
            id: pricedProduct.productId,
            label: product?.productName || "",
            value: pricedProduct.productId,
            productName: product?.productName || "",
            qty: pricedProduct.qty,
            rate: pricedProduct.rate,
            productTotalValue: Number(pricedProduct.productTotalValue),
            ...product,
          };
        });

        // Set product details for the multi-selector
        form.setValue("productDetails", mappedProducts);
        
        // Set product prices for calculations
        setProductPrices(mappedProducts);
      }
    }
  }, [localInvoiceData, form, mode, products]);

  async function onSubmit(values: z.infer<typeof FormSchemaLocalInvoice>) {
    try {
      const isSuccess = localInvoiceData
        ? (await updateLocalInvoice(localInvoiceData.id, { values, productPrices }),
          toast.success("Local invoice updated successfully"))
        : (await CreateLocalInvoice(
            { values, productPrices },
            session.data?.user?.id || ""
          ),
          toast.success("Local invoice created successfully"));
      if (isSuccess) {
        form.reset();
        if (mode === "create") {
          await fetchLastInvoiceNo();
        }
        onClose();
        // Trigger refresh for invoice tables
        triggerRefresh("local-invoices");
        triggerRefresh("gst-invoices");
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    }
  }

  // if (isLoadingInvoiceNo && mode === "create") {
  //   return <Spinner size={"lg"} />
  // }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:space-y-4 px-2 space-y-8"
        >
          <div className="lg:flex justify-center gap-5 w-full lg:space-y-0 space-y-8">
            <FormField
              control={form.control}
              name="localInvoiceNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl className="border-2 shadow">
                    <Input
                      disabled
                      className="uppercase"
                      placeholder="Invoice Number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthOf"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Select Month</FormLabel>
                  <FormControl className="border-2 shadow">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger id="month" className="border-2 shadow">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="January">January</SelectItem>
                        <SelectItem value="February">February</SelectItem>
                        <SelectItem value="March">March</SelectItem>
                        <SelectItem value="April">April</SelectItem>
                        <SelectItem value="May">May</SelectItem>
                        <SelectItem value="June">June</SelectItem>
                        <SelectItem value="July">July</SelectItem>
                        <SelectItem value="August">August</SelectItem>
                        <SelectItem value="September">September</SelectItem>
                        <SelectItem value="October">October</SelectItem>
                        <SelectItem value="November">November</SelectItem>
                        <SelectItem value="December">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearOf"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Select Year</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger id="year" className="border-2 shadow">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => (
                          <SelectItem
                            key={i}
                            value={`${new Date().getFullYear() - i}`}
                          >
                            {new Date().getFullYear() - i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="localInvoiceDate"
              render={({ field }) => (
                <FormItem className="flex flex-col flex-1">
                  <FormLabel>Date of Invoice</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl className="border-2 shadow">
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="flex flex-col w-full">
                <FormLabel>Customer</FormLabel>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl className="border-2 shadow">
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full max-w-screen-2xl overflow-ellipsis overflow-clip justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        onClick={() => setPopoverOpen(!popoverOpen)}
                      >
                        {currLocalCustomer
                          ? `${currLocalCustomer?.customerName}`
                          : "Select Customer"}
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Command className="max-w-screen-2xl">
                      <CommandInput placeholder="Search Customer..." />
                      <CommandList>
                        <ScrollArea className="h-48 lg:h-[300px] w-80 lg:w-full rounded-md border pr-3">
                          <CommandEmpty>No Customer found.</CommandEmpty>
                          <CommandGroup>
                            {customers?.map((customer) => (
                              <CommandItem
                                value={`${customer?.customerName} - ${customer?.address}`}
                                key={customer.id}
                                onSelect={() => {
                                  form.setValue("customerId", customer.id);
                                  setPopoverOpen(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    customer.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {`${customer?.customerName} - ${customer?.address}`}
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

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              className="border-2 shadow"
              id="address"
              disabled
              value={currLocalCustomer?.address || ""}
              placeholder="address"
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="productDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Products</FormLabel>
                  <FormControl className="border-2 shadow">
                    <MultipleSelector
                      {...field}
                      defaultOptions={allProducts || []}
                      commandProps={{
                        className: "border",
                      }}
                      placeholder="Select Products..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {productPrices.map((product) => {
            return (
              <div
                key={product.id}
                className="mt-3 lg:flex gap-5 lg:space-y-0 space-y-2"
              >
                <div className="flex-1">
                  <Label>Product Name</Label>
                  <Input
                    disabled
                    value={product.productName || product.label || ""}
                    placeholder="product"
                  />
                </div>
                <div className="flex gap-5">
                  <div className="flex-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="0"
                      value={product.qty || ""}
                      onChange={(e) =>
                        handleProductInfoChange(
                          "qty",
                          e.target.value,
                          product.id,
                          product
                        )
                      }
                      placeholder="Quantity"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.rate || ""}
                      onChange={(e) =>
                        handleProductInfoChange(
                          "rate",
                          e.target.value,
                          product.id,
                          product
                        )
                      }
                      placeholder="Rate"
                    />
                  </div>
                </div>

                <div className="">
                  <Label>Product Total Value</Label>
                  <Input
                    disabled
                    value={product.productTotalValue || 0}
                    placeholder="Product Total Value"
                  />
                </div>
              </div>
            );
          })}

          <FormField
            control={form.control}
            name="localTotalInvoiceValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Invoice Value</FormLabel>
                <FormControl>
                  <Input
                    disabled
                    placeholder="Total Invoice Value"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full lg:w-auto"
          >
            {localInvoiceData ? "Update local invoice" : "Create local invoice"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
