import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

interface ActionTooltipProps {
  side?: "left" | "right" | "top" | "bottom";
  align?: "start" | "center" | "end";
  label: string;
  children: React.ReactNode;
}
const ActionTooltip = ({
  side,
  align,
  label,
  children,
}: ActionTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align}>
          <p className={cn("font-semibold text-sm capitalize")}>{label.toLowerCase()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ActionTooltip;
