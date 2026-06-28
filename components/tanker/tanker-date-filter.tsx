"use client";

import * as React from "react";
import {
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  subDays,
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

export type TankerDatePreset = "today" | "last7" | "last30" | "custom";

function todayRange(): DateRange {
  const n = new Date();
  return { from: startOfDay(n), to: endOfDay(n) };
}

function last7Range(): DateRange {
  return {
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  };
}

function last30Range(): DateRange {
  return {
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  };
}

function rangesMatch(a: DateRange | undefined, b: DateRange): boolean {
  if (!a?.from || !a?.to || !b.from || !b.to) return false;
  return (
    startOfDay(a.from).getTime() === startOfDay(b.from).getTime() &&
    endOfDay(a.to).getTime() === endOfDay(b.to).getTime()
  );
}

export function detectTankerPreset(
  range: DateRange | undefined
): TankerDatePreset {
  if (rangesMatch(range, todayRange())) return "today";
  if (rangesMatch(range, last7Range())) return "last7";
  if (rangesMatch(range, last30Range())) return "last30";
  return "custom";
}

export function formatTankerRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) return "Pick dates";
  if (!range.to || isSameDay(range.from, range.to)) {
    return format(range.from, "dd MMM");
  }
  return `${format(range.from, "dd MMM")} – ${format(range.to, "dd MMM")}`;
}

const PRESETS: {
  id: TankerDatePreset;
  label: string;
  getRange: () => DateRange;
}[] = [
  { id: "today", label: "Today", getRange: todayRange },
  { id: "last7", label: "Last 7 Days", getRange: last7Range },
  { id: "last30", label: "Last 30 Days", getRange: last30Range },
];

type TankerDateFilterProps = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
  variant?: "mobile" | "desktop";
};

export function TankerDateFilter({
  value,
  onChange,
  className,
  variant = "mobile",
}: TankerDateFilterProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const activePreset = detectTankerPreset(value);

  const rangeLabel = formatTankerRangeLabel(value);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    onChange(preset.getRange());
  };

  if (variant === "desktop") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={activePreset === p.id ? "default" : "outline"}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </Button>
          ))}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={activePreset === "custom" ? "default" : "outline"}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Custom range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from ?? new Date()}
                selected={value}
                onSelect={(range) => {
                  onChange(range);
                  if (range?.from && range?.to) setCalendarOpen(false);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-sm text-muted-foreground">{rangeLabel}</p>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Fleet Overview
        </h1>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>{rangeLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="end"
            sideOffset={8}
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from ?? new Date()}
              selected={value}
              onSelect={(range) => {
                onChange(range);
                if (range?.from && range?.to) setCalendarOpen(false);
              }}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-hide">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activePreset === p.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activePreset === "custom"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground"
          )}
        >
          Custom Range
        </button>
      </div>
    </div>
  );
}
