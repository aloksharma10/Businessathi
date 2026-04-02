"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { PlantProduct } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ensurePlantProduct } from "@/action/plant-entities";
import type { ProductLineValue } from "@/components/customer-product-entry/product-lines-editor";

function norm(s: string) {
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

export function FlexiblePlantProductLinesEditor({
  userId,
  products,
  value,
  onChange,
  disabled,
}: {
  userId: string;
  products: PlantProduct[];
  value: ProductLineValue[];
  onChange: (v: ProductLineValue[]) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  /** Raw qty while typing (allows empty / partial digits before blur). */
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});

  const nameById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.productName])),
    [products]
  );

  const selected = useMemo(
    () => new Set(value.map((v) => v.productId)),
    [value]
  );

  const q = norm(search);
  const filteredPick = useMemo(() => {
    const avail = products.filter((p) => !selected.has(p.id));
    if (!q) return avail;
    return avail.filter((p) => norm(p.productName).includes(q));
  }, [products, selected, q]);

  const exactMatch = useMemo(
    () => products.some((p) => norm(p.productName) === q),
    [products, q]
  );

  const setLineQty = (productId: string, qty: number) => {
    const next = Math.max(1, Math.floor(Number.isFinite(qty) ? qty : 1));
    onChange(
      value.map((line) =>
        line.productId === productId ? { ...line, qty: next } : line
      )
    );
  };

  const bumpQty = (productId: string, delta: number) => {
    const line = value.find((l) => l.productId === productId);
    if (!line) return;
    const draftRaw = qtyDraft[productId];
    let base = line.qty;
    if (draftRaw !== undefined && draftRaw !== "") {
      const n = parseInt(draftRaw, 10);
      if (!Number.isNaN(n) && n >= 1) base = n;
    }
    setQtyDraft((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    setLineQty(productId, Math.max(1, base + delta));
  };

  /** Only update local draft while typing — avoids RHF re-renders fighting the input. */
  const onQtyChange = (productId: string, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setQtyDraft((prev) => ({ ...prev, [productId]: raw }));
  };

  const commitQtyDraft = (productId: string, raw: string) => {
    const n = parseInt(raw, 10);
    const next =
      raw === "" || Number.isNaN(n) || n < 1 ? 1 : Math.floor(n);
    setLineQty(productId, next);
  };

  const onQtyBlur = (productId: string, e: FocusEvent<HTMLInputElement>) => {
    const raw =
      qtyDraft[productId] !== undefined
        ? qtyDraft[productId]
        : e.target.value.replace(/\D/g, "");
    setQtyDraft((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    commitQtyDraft(productId, raw);
  };

  const removeLine = (productId: string) => {
    onChange(value.filter((l) => l.productId !== productId));
  };

  const addProduct = (productId: string) => {
    if (selected.has(productId)) return;
    onChange([...value, { productId, qty: 1 }]);
    setAddOpen(false);
    setSearch("");
  };

  const handleCreateProduct = async () => {
    if (!search.trim() || !userId) return;
    setPending(true);
    try {
      const { id } = await ensurePlantProduct(userId, search);
      router.refresh();
      addProduct(id);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add products below. When you pick a plant customer, lines default to
          their last saved entry here with quantities. Type a new product name
          to create it automatically.
        </p>
      )}

      {value.map((line) => {
        const draftRaw = qtyDraft[line.productId];
        const effectiveQty =
          draftRaw !== undefined && draftRaw !== ""
            ? Math.max(1, parseInt(draftRaw, 10) || 1)
            : line.qty;
        return (
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
              disabled={disabled || effectiveQty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Quantity"
              data-qty-line
              disabled={disabled}
              className={cn(
                "h-8 w-[3.25rem] shrink-0 rounded-md border-0 bg-transparent px-1 text-center text-sm font-medium tabular-nums shadow-none outline-none",
                "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              )}
              value={qtyDraft[line.productId] ?? String(line.qty)}
              onChange={(e) => onQtyChange(line.productId, e)}
              onBlur={(e) => onQtyBlur(line.productId, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            />
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
        );
      })}

      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || pending}
            className="w-full sm:w-auto"
          >
            Add product
            {pending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,24rem)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or type a new product…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <ScrollArea className="h-48 rounded-md border-0">
                <CommandEmpty>
                  {q && !exactMatch ? (
                    <button
                      type="button"
                      className="w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => void handleCreateProduct()}
                      disabled={pending}
                    >
                      Create &amp; add &quot;{search.trim().toUpperCase()}&quot;
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-sm px-2">
                      Type a product name to search or create.
                    </span>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredPick.map((p) => (
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
          {q && !exactMatch && (
            <div className="border-t p-2">
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={pending}
                onClick={() => void handleCreateProduct()}
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Create &amp; add &quot;{search.trim().toUpperCase()}&quot;
                  </>
                )}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
