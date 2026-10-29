import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-500/20 text-blue-700 border-blue-500/30",
        secondary:
          "border-transparent bg-slate-50 text-slate-600",
        destructive:
          "border-transparent bg-rose-500/20 text-rose-300 border-rose-500/30",
        outline:
          "text-slate-600 border-slate-200",
        success:
          "border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
        warning:
          "border-blue-500/30 bg-blue-500/20 text-blue-700",
        purple:
          "border-blue-500/30 bg-blue-500/20 text-blue-700",
        cyan:
          "border-blue-500/30 bg-blue-500/20 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
