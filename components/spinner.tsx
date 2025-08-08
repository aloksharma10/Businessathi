import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

const spinnerVariants = cva(
  "text-primary animate-spin",
  {
    variants: {
      size: {
        default: "h-8 w-8",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {}

export const Spinner = ({ size }: SpinnerProps) => {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-accent/5 backdrop-blur-[1px] z-50 cursor-not-allowed">
      <LoaderCircle className={cn(spinnerVariants({ size }))} />
    </div>
  );
};
