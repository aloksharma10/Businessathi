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
import { EditTankerBookingForm } from "@/components/tanker/edit-tanker-booking-form";
import type { TankerBookingRow, TankerDriverOption } from "@/action/tanker";

export function EditTankerBookingModal({
  open,
  onOpenChange,
  booking,
  drivers,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: TankerBookingRow | null;
  drivers: TankerDriverOption[];
  onSuccess: () => void;
}) {
  const isMobile = useIsMobile();

  if (!booking) return null;

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const form = (
    <EditTankerBookingForm
      booking={booking}
      drivers={drivers}
      onSuccess={handleSuccess}
      onCancel={() => onOpenChange(false)}
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
          <DrawerComponent.Title>Edit booking</DrawerComponent.Title>
          <DrawerComponent.Description className="text-sm text-muted-foreground">
            Update date, driver, water liters, or amount.
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
          <DialogTitle>Edit booking</DialogTitle>
          <DialogDescription>
            Update date, driver, water liters, or amount.
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
