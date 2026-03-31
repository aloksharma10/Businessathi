"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";

export type ProductLinePick = { id: string; productName: string };
export type ProductLineValue = { productId: string; qty: number };

export function ProductLinesEditor({
  products,
  value,
  onChange,
  disabled,
}: {
  products: ProductLinePick[];
  value: ProductLineValue[];
  onChange: (v: ProductLineValue[]) => void;
  disabled?: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);

  const nameById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.productName])),
    [products]
  );

  const selected = useMemo(() => new Set(value.map((v) => v.productId)), [value]);

  const available = useMemo(
    () => products.filter((p) => !selected.has(p.id)),
    [products, selected]
  );

  const bumpQty = (productId: string, delta: number) => {
    onChange(
      value.map((line) =>
        line.productId === productId
          ? { ...line, qty: Math.max(1, line.qty + delta) }
          : line
      )
    );
  };

  const removeLine = (productId: string) => {
    onChange(value.filter((l) => l.productId !== productId));
  };

  const addProduct = (productId: string) => {
    if (selected.has(productId)) return;
    onChange([...value, { productId, qty: 1 }]);
    setAddOpen(false);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add products below. When you pick a customer, lines default to their
          last saved entry here with quantities.
        </p>
      )}

      {value.map((line) => (
        <div
          key={line.productId}
          className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background/50 px-3 py-2"
        >
          <span className="min-w-0 flex-1 font-medium text-sm uppercase truncate">
            {nameById[line.productId] ?? line.productId}
          </span>
          <div className="flex items-center gap-0.5 rounded-md border bg-muted/40">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => bumpQty(line.productId, -1)}
              disabled={disabled || line.qty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[2rem] text-center tabular-nums text-sm font-medium">
              {line.qty}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => bumpQty(line.productId, 1)}
              disabled={disabled}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={() => removeLine(line.productId)}
            disabled={disabled}
            aria-label="Remove product"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {available.length > 0 && (
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="w-full sm:w-auto"
            >
              Add product
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,24rem)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search product…" />
              <CommandList>
                <ScrollArea className="h-48 rounded-md border-0">
                  <CommandEmpty>No product found.</CommandEmpty>
                  <CommandGroup>
                    {available.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.productName} ${p.id}`}
                        onSelect={() => addProduct(p.id)}
                      >
                        <CheckIcon className="mr-2 h-4 w-4 opacity-0" />
                        <span className="uppercase">{p.productName}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
