import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface HoverCardToolTipProps {
    side?: "left" | "right" | "top" | "bottom";
    align?: "start" | "center" | "end";
    label?: string;
    children: React.ReactNode;
    className?: string;
    Icon?: React.ReactNode;
}
const HoverCardToolTip = ({
    side,
    align,
    label,
    children,
    className,
    Icon,
}: HoverCardToolTipProps) => {
    return (
        <HoverCard openDelay={50}>
            <HoverCardTrigger
                className={cn("text-blue-900 dark:text-white cursor-pointer max-w-min text-nowrap capitalize",
                    !Icon && "border-dashed border-b border-blue-600 underline-offset-1"
                )}
            >
                {label}{Icon}
            </HoverCardTrigger>
            <HoverCardContent side={side} align={align} className={className}>
                {children}
            </HoverCardContent>
        </HoverCard>
    );
};

export default HoverCardToolTip;
