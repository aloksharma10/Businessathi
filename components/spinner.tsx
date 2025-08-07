import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

const spinnerVariants = cva("text-muted-foreground animate-spin", {
  variants: {
    size: {
      default: "h-4 w-4",
      lg: "h-10 w-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {}

export const Spinner = ({ size }: SpinnerProps) => {
  return (
    <div className="fixed h-screen w-screen inset-0 flex justify-center items-center dark:bg-gray-900/50 bg-gray-300/50 bg-opacity-25 cursor-not-allowed">
      <LoaderCircle className={cn(spinnerVariants({ size }))} />
    </div>
  );
};
