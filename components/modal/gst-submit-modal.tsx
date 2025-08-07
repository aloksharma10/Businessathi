"use client";

import { useModal } from "@/store/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { exportToExcel } from "@/lib/utils";


export const GSTSubmitModal = () => {
  const { data, type, onClose, isOpen } = useModal();

  const isOpenModel = isOpen && type === "gstSubmit";

  const handleClose = () => {
    onClose();
  };

  const FormSchemaCustomxlsxName = z.object({
    CustomxlsxName: z.string().min(2, {
      message: "Name name must be at least 2 characters.",
    }),
  });

  const form = useForm<z.infer<typeof FormSchemaCustomxlsxName>>({
    resolver: zodResolver(FormSchemaCustomxlsxName),
    defaultValues: {
      CustomxlsxName: "",
    },
  });

  const watchedName = form.watch("CustomxlsxName");

  async function onSubmit(values: z.infer<typeof FormSchemaCustomxlsxName>) {
    try {
      form.reset();
    } catch (error) { }
  }

  const xlsxData = data?.xlsxDataForGST || [];

  return (
    <Dialog open={isOpenModel} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export for GST Filing</DialogTitle>
          <DialogDescription>
            Download your Invoice data in xlsx format for GST submission.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-end gap-4 w-full">
              <FormField
                control={form.control}
                name="CustomxlsxName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Excel File Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="filename"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button onClick={() => exportToExcel(xlsxData, watchedName, onClose)}>Download Excel</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
