"use client";

import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModal } from "@/store/store";
import { CreateCompanyProfile } from "@/action/user";
import { useState, useEffect } from "react";

const FormSchemaCompanyDetails = z
  .object({
    companyType: z.enum(["gst", "local"], {
      required_error: "Please select a company type",
    }),
    // GST Company fields
    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    gstNo: z.string().optional(),
    state: z.string().optional(),
    stateCode: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNo: z.string().optional(),
    bankBranch: z.string().optional(),
    bankIfscCode: z.string().optional(),
    // Local Company fields
    localCompanyName: z.string().optional(),
    localAddress: z.string().optional(),
    localTagLine: z.string().optional(),
    contactNo: z.string().optional(),
    additionalContactNo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.companyType === "gst") {
        return (
          data.companyName &&
          data.companyAddress &&
          data.gstNo &&
          data.state &&
          data.stateCode &&
          data.bankName &&
          data.bankAccountNo &&
          data.bankBranch &&
          data.bankIfscCode
        );
      }
      return true;
    },
    {
      message: "All GST company fields are required",
      path: ["companyType"],
    }
  )
  .refine(
    (data) => {
      if (data.companyType === "local") {
        return data.localCompanyName && data.localAddress && data.contactNo;
      }
      return true;
    },
    {
      message: "Local company name and address are required",
      path: ["companyType"],
    }
  )
  .refine(
    (data) => {
      if (data.companyType === "gst" && data.gstNo) {
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          data.gstNo
        );
      }
      return true;
    },
    {
      message: "Invalid GST number format",
      path: ["gstNo"],
    }
  )
  .refine(
    (data) => {
      if (data.companyType === "gst" && data.stateCode) {
        return /^\d{2}$/.test(data.stateCode);
      }
      return true;
    },
    {
      message: "State code must be a 2-digit number",
      path: ["stateCode"],
    }
  )
  .refine(
    (data) => {
      if (data.companyType === "gst" && data.bankAccountNo) {
        return /^\d{9,18}$/.test(data.bankAccountNo);
      }
      return true;
    },
    {
      message: "Bank account number must be between 9 and 18 digits",
      path: ["bankAccountNo"],
    }
  )
  .refine(
    (data) => {
      if (data.companyType === "gst" && data.bankIfscCode) {
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bankIfscCode);
      }
      return true;
    },
    {
      message: "Invalid IFSC code format",
      path: ["bankIfscCode"],
    }
  );

export const CompanyProfileForm = () => {
  const session = useSession();
  const [companyType, setCompanyType] = useState<string>("");
  const user = session?.data?.user;

  const form = useForm<z.infer<typeof FormSchemaCompanyDetails>>({
    resolver: zodResolver(FormSchemaCompanyDetails),
    defaultValues: {
      companyType: undefined,
      companyName: "",
      companyAddress: "",
      gstNo: "",
      state: "",
      stateCode: "",
      bankName: "",
      bankAccountNo: "",
      bankBranch: "",
      bankIfscCode: "",
      localCompanyName: "",
      localAddress: "",
      localTagLine: "",
      contactNo: "",
      additionalContactNo: "",
    },
  });

  const { onClose } = useModal();

  // Pre-populate form with existing data
  useEffect(() => {
    if (user) {
      const hasGSTData = user.companyName || user.gstNo;
      const hasLocalData = user.localCompanyName || user.localAddress;

      let defaultCompanyType: "gst" | "local" | undefined;

      if (hasGSTData && !hasLocalData) {
        defaultCompanyType = "gst";
      } else if (hasLocalData && !hasGSTData) {
        defaultCompanyType = "local";
      } else if (hasGSTData && hasLocalData) {
        // If both exist, default to GST for editing
        defaultCompanyType = "gst";
      }

      if (defaultCompanyType) {
        setCompanyType(defaultCompanyType);
        form.setValue("companyType", defaultCompanyType);
      }

      // Set existing values
      if (user.companyName) form.setValue("companyName", user.companyName);
      if (user.companyAddress)
        form.setValue("companyAddress", user.companyAddress);
      if (user.gstNo) form.setValue("gstNo", user.gstNo);
      if (user.state) form.setValue("state", user.state);
      if (user.stateCode) form.setValue("stateCode", user.stateCode.toString());
      if (user.bankName) form.setValue("bankName", user.bankName);
      if (user.bankAccountNo)
        form.setValue("bankAccountNo", user.bankAccountNo);
      if (user.bankBranch) form.setValue("bankBranch", user.bankBranch);
      if (user.bankIfscCode) form.setValue("bankIfscCode", user.bankIfscCode);
      if (user.localCompanyName)
        form.setValue("localCompanyName", user.localCompanyName);
      if (user.localAddress) form.setValue("localAddress", user.localAddress);
      if (user.localTagLine) form.setValue("localTagLine", user.localTagLine);
      if (user.contactNo) form.setValue("contactNo", user.contactNo);
      if (user.additionalContactNo)
        form.setValue("additionalContactNo", user.additionalContactNo);
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof FormSchemaCompanyDetails>) {
    try {
      const onSuccess = await CreateCompanyProfile(
        values,
        session.data?.user?.id || ""
      );
      if (onSuccess) {
        toast.success("Company profile updated successfully.");
        onClose();
      }
    } catch (error) {
      toast.error("Failed to update Company profile.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 py-2 lg:pt-4"
      >
        <FormField
          control={form.control}
          name="companyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setCompanyType(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="gst">GST Company</SelectItem>
                  <SelectItem value="local">Local Company</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {companyType === "gst" && (
          <>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your company's registered legal name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Office Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full official address of your company"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gstNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company GST Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your 15-digit GSTIN as per government records"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full flex items-center gap-8">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the state where your company is registered"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stateCode"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>State Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your registered state (e.g., 07 for Delhi)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-8">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the full name of your bank (e.g., State Bank of India)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccountNo"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Bank Account Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your company's bank account number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-8">
              <FormField
                control={form.control}
                name="bankBranch"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Branch Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Specify the bank branch associated with your account"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankIfscCode"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>IFSC Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the IFSC code (e.g., SBIN0001234)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {companyType === "local" && (
          <>
            <FormField
              control={form.control}
              name="localCompanyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Company Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your local company name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="localAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your local company address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="localTagLine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Line (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your company tag line"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your company contact number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalContactNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Contact Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your company additional contact number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="mt-10 w-full md:w-auto">
          {user?.companyName || user?.localCompanyName ? "Update" : "Save"}
        </Button>
      </form>
    </Form>
  );
};
