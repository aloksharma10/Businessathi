"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getDistinctTagsForScope } from "@/action/tag-suggestions";

function normalizeOne(raw: string): string {
  return raw.trim().toUpperCase();
}

export function TagsInput({
  value,
  onChange,
  userId,
  scope,
  placeholder = "Type and press Enter or pick a suggestion…",
  disabled,
  className,
  id,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  userId: string;
  scope: "customer" | "product";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [pool, setPool] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getDistinctTagsForScope(userId, scope).then((tags) => {
      if (!cancelled) setPool(tags);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, scope]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const poolCombined = useMemo(() => {
    const s = new Set<string>(pool);
    for (const v of value) s.add(v);
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [pool, value]);

  const filteredSuggestions = useMemo(() => {
    const q = normalizeOne(input);
    return poolCombined.filter(
      (t) =>
        !selectedSet.has(t) &&
        (q.length === 0 || t.includes(q) || t.startsWith(q))
    );
  }, [poolCombined, input, selectedSet]);

  const addTag = useCallback(
    (raw: string) => {
      const t = normalizeOne(raw);
      if (!t || selectedSet.has(t)) return;
      onChange([...value, t]);
      setInput("");
      setOpen(false);
    },
    [onChange, value, selectedSet]
  );

  const commitInput = useCallback(() => {
    const parts = input
      .split(/[,;]/)
      .map((p) => normalizeOne(p))
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    const set = new Set(next);
    for (const p of parts) {
      if (!set.has(p)) {
        next.push(p);
        set.add(p);
      }
    }
    if (next.length !== value.length) {
      onChange(next);
    }
    setInput("");
    setOpen(false);
  }, [input, onChange, value]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((x) => x !== tag));
    },
    [onChange, value]
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1 font-normal"
          >
            {tag}
            <button
              type="button"
              className="rounded-sm hover:bg-muted p-0.5"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitInput();
            }
            if (e.key === ",") {
              e.preventDefault();
              commitInput();
            }
            if (e.key === "Backspace" && !input && value.length) {
              removeTag(value[value.length - 1]);
            }
          }}
          className="uppercase"
        />
        {open && filteredSuggestions.length > 0 && (
          <ul
            className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
            role="listbox"
          >
            {filteredSuggestions.slice(0, 12).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => addTag(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Suggestions come from tags you already use. Duplicates are skipped.
      </p>
    </div>
  );
}
