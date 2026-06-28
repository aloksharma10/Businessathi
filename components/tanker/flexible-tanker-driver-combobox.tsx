"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  ensureTankerDriver,
  type TankerDriverOption,
} from "@/action/tanker";

function norm(s: string) {
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

function normPhone(s: string) {
  return s.trim().replace(/\D/g, "");
}

export function FlexibleTankerDriverCombobox({
  drivers,
  value,
  driverPhone,
  onChange,
  onSelectDriver,
  onDriversChange,
  disabled,
}: {
  drivers: TankerDriverOption[];
  value: string;
  driverPhone: string;
  onChange: (id: string) => void;
  onSelectDriver: (driver: TankerDriverOption) => void;
  onDriversChange?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);

  const nameById = useMemo(
    () => Object.fromEntries(drivers.map((d) => [d.id, d.driverName])),
    [drivers]
  );

  const selectedLabel = value ? (nameById[value] ?? "") : "";

  const q = norm(search);
  const filtered = useMemo(() => {
    if (!q) return drivers;
    return drivers.filter(
      (d) =>
        norm(d.driverName).includes(q) || d.driverPhone.includes(normPhone(search))
    );
  }, [drivers, q, search]);

  const phoneDigits = normPhone(driverPhone);
  const exactMatch = useMemo(
    () =>
      drivers.some(
        (d) => norm(d.driverName) === q && d.driverPhone === phoneDigits
      ),
    [drivers, q, phoneDigits]
  );

  const canCreate = Boolean(q && phoneDigits.length >= 10 && !exactMatch);

  const handleCreate = async () => {
    if (!search.trim()) return;
    if (phoneDigits.length < 10) {
      toast.error("Enter a 10-digit phone number first.");
      return;
    }
    setPending(true);
    try {
      const result = await ensureTankerDriver(search, driverPhone);
      onSelectDriver({
        id: result.id,
        driverName: result.driverName,
        driverPhone: result.driverPhone,
      });
      onChange(result.id);
      onDriversChange?.();
      setOpen(false);
      setSearch("");
      if (result.created) {
        toast.success(`Driver ${result.driverName} created.`);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not create driver."
      );
    } finally {
      setPending(false);
    }
  };

  const selectExisting = (driver: TankerDriverOption) => {
    onSelectDriver(driver);
    onChange(driver.id);
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
            "h-11 w-full justify-between border-2 text-base shadow",
            !selectedLabel && "text-muted-foreground"
          )}
        >
          <span className="truncate uppercase">
            {selectedLabel || "Type or pick a driver…"}
          </span>
          {pending ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,28rem)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type a new name…"
            value={search}
            onValueChange={setSearch}
            className="h-11 text-base"
          />
          <CommandList>
            <ScrollArea className="h-48 rounded-md border-0 pr-2">
              <CommandEmpty>
                {canCreate ? (
                  <button
                    type="button"
                    className="w-full rounded-sm px-2 py-3 text-left text-sm hover:bg-accent"
                    onClick={() => void handleCreate()}
                    disabled={pending}
                  >
                    Create &amp; use &quot;{search.trim().toUpperCase()}&quot;
                  </button>
                ) : q ? (
                  <span className="text-muted-foreground px-2 text-sm">
                    {phoneDigits.length < 10
                      ? "Enter phone below, then create."
                      : "No match found."}
                  </span>
                ) : (
                  <span className="text-muted-foreground px-2 text-sm">
                    Type a driver name to search or create.
                  </span>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`${d.driverName} ${d.driverPhone} ${d.id}`}
                    onSelect={() => selectExisting(d)}
                    className="py-3"
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === d.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="uppercase">{d.driverName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {d.driverPhone}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
        {canCreate && (
          <div className="border-t p-2">
            <Button
              type="button"
              size="lg"
              className="h-11 w-full text-base"
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
