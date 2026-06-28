"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DrawerComponent } from "@/components/ui/drawer";
import { TankerEntryForm } from "@/components/tanker/tanker-entry-form";
import type { TankerDriverOption } from "@/action/tanker";

export function TankerBookingModal({
  open,
  onOpenChange,
  drivers,
  onSuccess,
  onDriversChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drivers: TankerDriverOption[];
  onSuccess: () => void;
  onDriversChange: () => void;
}) {
  const isMobile = useIsMobile();

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const form = (
    <TankerEntryForm
      drivers={drivers}
      onSuccess={handleSuccess}
      onDriversChange={onDriversChange}
    />
  );

  if (isMobile) {
    return (
      <DrawerComponent
        open={open}
        onOpenChange={onOpenChange}
        side="bottom"
        size="full"
      >
        <div className="flex flex-col gap-4 p-4 pb-8">
          <DrawerComponent.Title>Add tanker booking</DrawerComponent.Title>
          <DrawerComponent.Description className="text-sm text-muted-foreground">
            Record water liters and amount. New drivers are created automatically.
          </DrawerComponent.Description>
          {form}
        </div>
      </DrawerComponent>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-md overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add tanker booking</DialogTitle>
          <DialogDescription>
            Record water liters and amount. New drivers are created automatically
            when you type a name and phone.
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
