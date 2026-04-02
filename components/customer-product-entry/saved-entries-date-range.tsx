"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const presets: {
  label: string;
  getRange: () => DateRange;
}[] = [
  {
    label: "Today",
    getRange: () => {
      const n = new Date();
      return { from: startOfDay(n), to: endOfDay(n) };
    },
  },
  {
    label: "Yesterday",
    getRange: () => {
      const y = subDays(new Date(), 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    },
  },
  {
    label: "Last 7 days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Month to date",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last month",
    getRange: () => {
      const n = new Date();
      const ref = subMonths(n, 1);
      return { from: startOfMonth(ref), to: endOfMonth(ref) };
    },
  },
  {
    label: "Year to date",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last year",
    getRange: () => {
      const y = subYears(new Date(), 1);
      return { from: startOfYear(y), to: endOfYear(y) };
    },
  },
];

export function SavedEntriesDateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const label = React.useMemo(() => {
    if (!value?.from) return "All dates";
    if (!value.to) return format(value.from, "dd/MM/yyyy");
    return `${format(value.from, "dd/MM/yyyy")} – ${format(value.to, "dd/MM/yyyy")}`;
  }, [value]);

  return (
    <div className={cn("grid gap-2", className)}>
      <label className="text-sm font-medium">Date range</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full min-w-[220px] justify-start text-left font-normal h-9",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex max-sm:flex-col">
            <div className="flex flex-col gap-0 border-b sm:border-b-0 sm:border-r p-2 min-w-[148px]">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start font-normal px-2"
                  onClick={() => {
                    onChange(p.getRange());
                  }}
                >
                  {p.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 justify-start font-normal px-2 text-muted-foreground"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                All dates
              </Button>
            </div>
            <div className="p-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from ?? new Date()}
                selected={value}
                onSelect={(range) => {
                  onChange(range);
                }}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
