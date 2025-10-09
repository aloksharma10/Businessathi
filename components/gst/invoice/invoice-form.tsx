"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateInvoice, UpdateInvoice } from "@/action/invoice";
import { useParams } from "next/navigation";
import { Customer } from "@prisma/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import MultipleSelector from "@/components/ui/multi-selector";
import { getLastGSTInvoiceNo } from "@/lib/db-utils";
import { useLoading } from "@/components/providers/loading-provider";

const formSchemaInvoice = z.object({
  invoiceNo: z.string().min(1, "Invoice number is required."),
  invoiceDate: z.date(),
  monthOf: z.string().min(1, "Please select a month."),
  yearOf: z.string().min(1, "Please select a year."),
  customerId: z.string().min(1, "Please select a Customer."),
  totalInvoiceValue: z.number().min(1, "Total Invoice Value is required."),
  totalTaxGST: z.number().optional(),
  totalTaxableValue: z.number().min(1, "Total Taxable Value is required."),
});

export const InvoiceForm = ({
  isEdit,
  invoiceInfo,
  customers,
  products,
  lastInvoiceNo,
  lastInvoiceDate,
}: {
  isEdit: boolean;
  invoiceInfo?: any;
  customers: Customer[];
  products: any[];
  lastInvoiceNo: string;
  lastInvoiceDate: Date;
}) => {
  const productsOpt = products?.map((product) => ({
    label: product.productName,
    value: product.id,
    ...product,
  }));

  const [productPrices, setProductPrices] = useState<any[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isLoadingInvoiceNo, setIsLoadingInvoiceNo] = useState(true);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState(lastInvoiceNo);
  const { isLoading, setIsLoading } = useLoading();

  const params = useParams();
  const session = useSession();

  const currDate = new Date();
  const lastMonth = new Date(
    currDate.setMonth(currDate.getMonth() - 1)
  ).toLocaleString("en-US", { month: "long" });

  const fetchLastInvoiceNo = async () => {
    if (!session.data?.user?.id) return;

    setIsLoadingInvoiceNo(true);
    try {
      const invoiceNo = await getLastGSTInvoiceNo(session.data.user.id);
      const nextInvoiceNo = (Number(invoiceNo) + 1).toString();
      setCurrentInvoiceNo(nextInvoiceNo);
      form.setValue(
        "invoiceNo",
        isEdit ? invoiceInfo?.invoiceNo : nextInvoiceNo
      );
    } catch (error) {
      console.error("Error fetching last invoice number:", error);
      toast.error("Failed to fetch invoice number");
      setCurrentInvoiceNo((Number(lastInvoiceNo) + 1).toString());
    } finally {
      setIsLoadingInvoiceNo(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchemaInvoice),
    defaultValues: {
      invoiceNo: isEdit
        ? lastInvoiceNo
        : (lastInvoiceNo ? Number(lastInvoiceNo) + 1 : 2001).toString(),
      invoiceDate: lastInvoiceDate,
      monthOf: lastMonth,
      yearOf: currDate.getFullYear().toString(),
      customerId: "",
      productDetails: [],
      totalInvoiceValue: 0,
      totalTaxGST: 0,
      totalTaxableValue: 0,
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const currCustomerId = form.watch("customerId");
  const selectProduct = form.watch("productDetails");

  const currCustomer = customers.find(
    (customer) => customer.id === currCustomerId
  );
  const isOutsideDelhiInvoice =
    !["delhi"].includes((currCustomer?.state ?? "").toLowerCase().trim()) ||
    false;

  useEffect(() => {
    fetchLastInvoiceNo();
  }, [session.data?.user?.id]);

  useEffect(() => {
    const newSelecctedProducts = selectProduct.map((product: any) => {
      const productInfo = productPrices.find((p) => p.id === product.value);
      return productInfo ? { ...product, ...productInfo } : product;
    });
    setProductPrices(newSelecctedProducts);
  }, [selectProduct]);

  useEffect(() => {
    const totalTaxableValue = productPrices.reduce(
      (acc, product) => acc + Number(product.taxableValue),
      0
    );
    const totalTaxGST = productPrices.reduce(
      (acc, product) =>
        acc + Number(Number(product.cgstAmt) + Number(product.sgstAmt)),
      0
    );
    const totalInvoiceValue = Number(totalTaxableValue + totalTaxGST).toFixed(
      2
    );

    form.setValue("totalTaxableValue", Number(totalTaxableValue.toFixed(2)));
    form.setValue("totalTaxGST", Number(totalTaxGST.toFixed(2)));
    form.setValue("totalInvoiceValue", Number(totalInvoiceValue));
  }, [productPrices]);

  const handleProductInfoChange = (
    name: string,
    value: any,
    id: string,
    item: any
  ) => {
    const updatedProductInfos = productPrices.map((product) => {
      let taxableValue = 0;
      if (name === "rate") {
        taxableValue = value * product.qty;
      } else {
        taxableValue = value * product.rate;
      }
      const cgstAmt = (taxableValue * item.cgstRate) / 100;
      const sgstAmt = (taxableValue * item.sgstRate) / 100;
      const productTotalValue = cgstAmt + sgstAmt + taxableValue;

      return product.id === id
        ? {
            ...product,
            [name]: value,
            taxableValue: taxableValue.toFixed(2),
            cgstAmt: cgstAmt.toFixed(2),
            sgstAmt: sgstAmt.toFixed(2),
            productTotalValue: productTotalValue.toFixed(2),
          }
        : product;
    });

    const productExists = updatedProductInfos.some(
      (product) => product.id === id
    );

    if (!productExists) {
      setProductPrices([...productPrices, { id, [name]: value }]);
    } else {
      setProductPrices(updatedProductInfos);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchemaInvoice>) => {
    try {
      const isSuccess = isEdit
        ? await UpdateInvoice({
            id: params.id,
            values,
            isOutsideDelhiInvoice,
            productPrices,
          })
        : await CreateInvoice(
            {
              values,
              isOutsideDelhiInvoice,
              productPrices,
            },
            session.data?.user?.id || ""
          );

      if (isSuccess) {
        toast.success(
          isEdit
            ? "Invoice updated successfully"
            : "Invoice created successfully"
        );
        form.reset();
        await fetchLastInvoiceNo(); // Refresh invoice number after successful submission
      }
    } catch (error) {
      toast.error("Failed to create invoice");
      console.log(error, "Error in creating invoice");
    }
  };

  useEffect(() => {
    if (isEdit) {
      form.setValue("invoiceNo", invoiceInfo?.invoiceNo);
      form.setValue("invoiceDate", invoiceInfo?.invoiceDate);
      form.setValue("monthOf", invoiceInfo?.monthOf);
      form.setValue("yearOf", invoiceInfo?.yearOf);
      form.setValue("customerId", invoiceInfo?.customerId);
    }
  }, [isEdit, form]);

  // if (isLoading) {
  //   return <Spinner size={"lg"} />;
  // }

  useEffect(() => {
    setIsLoading(isLoadingInvoiceNo || isSubmitting);
  }, [isLoadingInvoiceNo, isSubmitting]);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:space-y-4 px-2 space-y-8"
        >
          <div className="lg:flex gap-5 w-full justify-center items-center lg:space-y-0 space-y-8">
            <FormField
              control={form.control}
              name="invoiceNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl className="border-2 shadow">
                    <Input
                      disabled
                      placeholder="Invoice Number"
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
              name="invoiceDate"
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
                        disableBefore={true}
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
                        {currCustomer
                          ? `${currCustomer?.customerName}`
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
            <Label htmlFor="customerAddress">Address</Label>
            <Input
              className="border-2 shadow"
              id="customerAddress"
              disabled
              value={currCustomer?.address || ""}
              placeholder="address"
            />
          </div>
          <div className="flex gap-5 w-full">
            <div className="flex-1">
              <Label htmlFor="customerGST">GST</Label>
              <Input
                className="border-2 shadow"
                id="customerGST"
                value={currCustomer?.gstIn || ""}
                disabled
                placeholder="GST"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="customerState">State</Label>
              <Input
                className="border-2 shadow"
                id="customerState"
                value={currCustomer?.state || ""}
                disabled
                placeholder="State"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="customerStateCode">State Code</Label>
              <Input
                className="border-2 shadow"
                id="customerStateCode"
                value={currCustomer?.stateCode || ""}
                disabled
                placeholder="State Code"
              />
            </div>
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
                      defaultOptions={productsOpt || []}
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

          {productPrices?.map((product: any) => {
            return (
              <div
                key={product.id}
                className="mt-3 lg:flex gap-5 lg:space-y-0 space-y-2"
              >
                <div className="grid grid-cols-2 lg:flex gap-3">
                  <div className="col-span-2 lg:flex-1">
                    <Label>Product Name</Label>
                    <Input
                      disabled
                      value={product.label}
                      placeholder="Product Name"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      value={product.qty}
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
                      value={product.rate}
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
                <div className="grid grid-cols-2 lg:flex gap-3">
                  <div className="col-span-2 lg:flex-1">
                    <Label>Taxable Value</Label>
                    <Input
                      disabled
                      value={product.taxableValue}
                      placeholder="Taxable Value"
                    />
                  </div>
                  {isOutsideDelhiInvoice ? (
                    <>
                      <div className="flex-1">
                        <Label>IGST Rate</Label>
                        <Input
                          disabled
                          value={
                            Number(product.cgstRate) + Number(product.sgstRate)
                          }
                          placeholder="cgstRate"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>IGST Amt</Label>
                        <Input
                          disabled
                          value={
                            Number(product.cgstAmt) + Number(product.sgstAmt)
                          }
                          placeholder="sgstAmt"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <Label>Cgst Rate</Label>
                        <Input
                          disabled
                          value={product.cgstRate}
                          placeholder="cgstRate"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Sgst Rate</Label>
                        <Input
                          disabled
                          value={product.sgstRate}
                          placeholder="sgstRate"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Cgst Amt</Label>
                        <Input
                          disabled
                          value={product.cgstAmt}
                          placeholder="cgstAmt"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Sgst Amt</Label>
                        <Input
                          disabled
                          value={product.sgstAmt}
                          placeholder="sgstAmt"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className=" lg:flex">
                  <div className="flex-1">
                    <Label>Product Total Value</Label>
                    <Input
                      disabled
                      value={product.productTotalValue}
                      placeholder="productTotalValue"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <FormField
            control={form.control}
            name="totalTaxableValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Taxable Value</FormLabel>
                <FormControl className="border-2 shadow">
                  <Input
                    disabled
                    placeholder="Total Taxable Value"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalTaxGST"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Tax Value</FormLabel>
                <FormControl className="border-2 shadow">
                  <Input disabled placeholder="Total Tax Value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalInvoiceValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Invoice Value</FormLabel>
                <FormControl className="border-2 shadow">
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
          <Button type="submit" disabled={isLoading || isSubmitting} className="w-full lg:w-auto">
            {isEdit ? "Update Invoice" : "Create Invoice"}
          </Button>
        </form>
      </Form>
    </>
  );
};
