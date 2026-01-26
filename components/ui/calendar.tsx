'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import {
  addDays,
  startOfDay,
  endOfDay,
  startOfToday,
  startOfYesterday,
  endOfYesterday,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';

export type DateRangePreset = {
  name: string;
  range: { from: Date; to?: Date };
};

export const defaultDateRangePresets: DateRangePreset[] = [
  {
    name: 'Today',
    range: {
      from: startOfToday(),
      to: endOfDay(new Date()),
    },
  },
  {
    name: 'Yesterday',
    range: {
      from: startOfYesterday(),
      to: endOfYesterday(),
    },
  },
  {
    name: 'Last 7 days',
    range: {
      from: startOfDay(addDays(new Date(), -6)),
      to: endOfDay(new Date()),
    },
  },
  {
    name: 'Last 30 days',
    range: {
      from: startOfDay(addDays(new Date(), -29)),
      to: endOfDay(new Date()),
    },
  },
  {
    name: 'Month to date',
    range: {
      from: startOfMonth(new Date()),
      to: endOfDay(new Date()),
    },
  },
  {
    name: 'Last month',
    range: {
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    },
  },
  {
    name: 'Year to date',
    range: {
      from: startOfYear(new Date()),
      to: endOfDay(new Date()),
    },
  },
  {
    name: 'Last year',
    range: {
      from: startOfYear(subYears(new Date(), 1)),
      to: endOfYear(subYears(new Date(), 1)),
    },
  },
];

// Utility to check if a date is valid
const isValidDate = (date: Date | undefined | null): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Validate presets on initialization
defaultDateRangePresets.forEach((preset, index) => {
  if (!isValidDate(preset.range.from)) {
    console.warn(`Invalid from date in preset "${preset.name}" at index ${index}:`, preset.range.from);
  }
  if (preset.range.to && !isValidDate(preset.range.to)) {
    console.warn(`Invalid to date in preset "${preset.name}" at index ${index}:`, preset.range.to);
  }
});

export interface CalendarProps {
  className?: string;
  classNames?: any;
  showOutsideDays?: boolean;
  mode?: 'single' | 'range' | 'multiple';
  presets?: DateRangePreset[];
  onSelectPreset?: (preset: DateRangePreset) => void;
  selected?: Date | { from?: Date; to?: Date } | undefined;
  onSelect?: (date: Date | undefined | { from?: Date; to?: Date }) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  numberOfMonths?: number;
  defaultMonth?: Date;
  fromYear?: number;
  toYear?: number;
  fromMonth?: Date;
  toMonth?: Date;
  [key: string]: any;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  presets = defaultDateRangePresets,
  onSelectPreset,
  mode = 'range',
  selected,
  onSelect,
  disabled,
  ...props
}: CalendarProps) {
  return (
    <div className="flex flex-row gap-0 rounded-md border">
      {/* Preset column */}
      {presets.length > 0 && onSelectPreset && mode === 'range' && (
        <div className="hidden min-w-[150px] border-r p-4 lg:flex lg:flex-col">
          {presets.map((preset) => (
            <Button
              key={preset.name}
              variant="ghost"
              size="sm"
              onClick={() => onSelectPreset(preset)}
              className="hover:bg-accent hover:text-accent-foreground justify-start px-2 font-normal"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      )}

      {/* Calendar column */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn('p-4', className)}
        mode={mode}
        selected={selected as any} // Use the full range object
        onSelect={(_selected: any, date: any) => {
          if (onSelect) {
            if (mode === 'range') {
              onSelect(date);
            } else if (mode === 'single') {
              onSelect(date instanceof Date ? date : undefined);
            }
          }
        }}
        disabled={disabled}
        classNames={{
          months: 'flex flex-col sm:flex-row gap-2',
          month: 'flex flex-col gap-4',
          caption: 'flex justify-center pt-1 relative items-center w-full',
          caption_label: 'text-sm font-medium',
          nav: 'flex items-center gap-1',
          nav_button: cn(buttonVariants({ variant: 'outline' }), 'size-7 bg-transparent p-0 opacity-50 hover:opacity-100'),
          nav_button_previous: 'absolute left-1',
          nav_button_next: 'absolute right-1',
          table: 'w-full border-collapse space-x-1',
          head_row: 'flex',
          head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
          row: 'flex w-full mt-2',
          cell: cn(
            'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md',
            mode === 'range' || mode === 'single'
              ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
              : '[&:has([aria-selected])]:rounded-md'
          ),
          day: cn(buttonVariants({ variant: 'ghost' }), 'size-8 p-0 font-normal aria-selected:opacity-100'),
          day_range_start: 'day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground',
          day_range_end: 'day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground',
          day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
          day_today: 'bg-accent text-accent-foreground',
          day_outside: 'day-outside text-muted-foreground aria-selected:text-muted-foreground',
          day_disabled: 'text-muted-foreground opacity-50',
          day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
          day_hidden: 'invisible',
          ...classNames,
        }}
        components={{
          IconLeft: ({ className, ...props }) => <ChevronLeft className={cn('size-4', className)} {...props} />,
          IconRight: ({ className, ...props }) => <ChevronRight className={cn('size-4', className)} {...props} />,
        }}
        {...props}
      />
    </div>
  );
}

export { Calendar };
