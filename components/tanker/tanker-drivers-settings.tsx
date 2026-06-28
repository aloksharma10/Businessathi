"use client";

import { useState } from "react";
import { Pencil, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditTankerDriverForm } from "@/components/tanker/edit-tanker-driver-form";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TankerDriverOption } from "@/action/tanker";

export function TankerDriversSettings({
  drivers,
  open,
  onOpenChange,
  onDriversChange,
}: {
  drivers: TankerDriverOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDriversChange: () => void;
}) {
  const isMobile = useIsMobile();
  const [editingDriver, setEditingDriver] = useState<TankerDriverOption | null>(
    null
  );

  const handleEditSuccess = () => {
    setEditingDriver(null);
    onDriversChange();
  };

  const listContent = (
    <ScrollArea className="max-h-[60vh] pr-2">
      {drivers.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No drivers yet. Add a booking to create one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {drivers.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{d.driverName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {d.driverPhone}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                aria-label={`Edit ${d.driverName}`}
                onClick={() => setEditingDriver(d)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </ScrollArea>
  );

  const editForm = editingDriver ? (
    <EditTankerDriverForm
      driver={editingDriver}
      onSuccess={handleEditSuccess}
      onCancel={() => setEditingDriver(null)}
    />
  ) : null;

  if (isMobile) {
    return (
      <>
        <Sheet
          open={open}
          onOpenChange={(v) => {
            if (!v) setEditingDriver(null);
            onOpenChange(v);
          }}
        >
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader>
              <SheetTitle>
                {editingDriver ? "Edit driver" : "Manage drivers"}
              </SheetTitle>
              <SheetDescription>
                {editingDriver
                  ? "Update driver name and phone number."
                  : "All saved drivers. Tap edit to change details."}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {editingDriver ? editForm : listContent}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setEditingDriver(null);
          onOpenChange(v);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1rem)] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? "Edit driver" : "Manage drivers"}
            </DialogTitle>
            <DialogDescription>
              {editingDriver
                ? "Update driver name and phone number."
                : "All saved drivers. Click edit to change details."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {editingDriver ? editForm : listContent}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TankerDriversSettingsButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className ?? "h-9 w-9 shrink-0"}
      aria-label="Manage drivers"
      onClick={onClick}
    >
      <Settings className="h-5 w-5" />
    </Button>
  );
}
