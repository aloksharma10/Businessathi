"use client";

import type { CSSProperties } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { hueFromTag, tagHueStyle } from "@/lib/tag-colors";

export type TagBadgeMode = "pill" | "outline" | "selected";

const MODE_CLASSES: Record<TagBadgeMode, string> = {
  pill: cn(
    "border-transparent shadow-none",
    "bg-[hsl(var(--tag-h)_52%_88%)] text-[hsl(var(--tag-h)_45%_20%)]",
    "dark:bg-[hsl(var(--tag-h)_40%_32%)] dark:text-[hsl(var(--tag-h)_30%_92%)]"
  ),
  outline: cn(
    "bg-transparent text-[hsl(var(--tag-h)_45%_28%)] border-[hsl(var(--tag-h)_42%_58%)]",
    "dark:text-[hsl(var(--tag-h)_35%_85%)] dark:border-[hsl(var(--tag-h)_35%_45%)]"
  ),
  selected: cn(
    "border-transparent",
    "bg-[hsl(var(--tag-h)_55%_42%)] text-[hsl(var(--tag-h)_40%_98%)]",
    "dark:bg-[hsl(var(--tag-h)_50%_48%)] dark:text-[hsl(var(--tag-h)_40%_98%)]"
  ),
};

export function TagBadge({
  tag,
  mode,
  className,
  style,
  ...props
}: BadgeProps & { tag: string; mode: TagBadgeMode }) {
  const hue = hueFromTag(tag);
  return (
    <Badge
      variant="outline"
      className={cn(MODE_CLASSES[mode], className)}
      style={{ ...tagHueStyle(hue), ...style }}
      {...props}
    />
  );
}
