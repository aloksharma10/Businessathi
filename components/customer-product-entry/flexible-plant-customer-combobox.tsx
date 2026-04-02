"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronsUpDownIcon, Loader2 } from "lucide-react";
import { PlantCustomer } from "@prisma/client";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { ensurePlantCustomer } from "@/action/plant-entities";

function norm(s: string) {
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

export function FlexiblePlantCustomerCombobox({
  userId,
  customers,
  value,
  onChange,
  disabled,
}: {
  userId: string;
  customers: PlantCustomer[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);

  const nameById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.customerName])),
    [customers]
  );

  const selectedLabel = value ? (nameById[value] ?? "") : "";

  const q = norm(search);
  const filtered = useMemo(() => {
    if (!q) return customers;
    return customers.filter((c) => norm(c.customerName).includes(q));
  }, [customers, q]);

  const exactMatch = useMemo(
    () => customers.some((c) => norm(c.customerName) === q),
    [customers, q]
  );

  const handleCreate = async () => {
    if (!search.trim() || !userId) return;
    setPending(true);
    try {
      const { id } = await ensurePlantCustomer(userId, search);
      router.refresh();
      onChange(id);
      setOpen(false);
      setSearch("");
    } finally {
      setPending(false);
    }
  };

  const selectExisting = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled || pending}
          className={cn(
            "w-full justify-between border-2 shadow",
            !selectedLabel && "text-muted-foreground"
          )}
        >
          <span className="truncate uppercase">
            {selectedLabel || "Type or pick a plant customer…"}
          </span>
          {pending ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,28rem)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type a new name…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <ScrollArea className="h-48 rounded-md border-0 pr-2">
              <CommandEmpty>
                {q && !exactMatch ? (
                  <button
                    type="button"
                    className="w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => void handleCreate()}
                    disabled={pending}
                  >
                    Create &amp; use &quot;{search.trim().toUpperCase()}&quot;
                  </button>
                ) : (
                  <span className="text-muted-foreground text-sm px-2">
                    No match. Type a name and press Create below.
                  </span>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.customerName} ${c.id}`}
                    onSelect={() => selectExisting(c.id)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === c.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="uppercase">{c.customerName}</span>
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
              onClick={() => void handleCreate()}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>Create &amp; use &quot;{search.trim().toUpperCase()}&quot;</>
              )}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
