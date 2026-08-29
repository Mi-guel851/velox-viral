import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 font-semibold",
        apple:
          "bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] backdrop-blur-sm",
        gradient:
          "bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 font-semibold border border-amber-400/30",
        destructive:
          "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25",
        outline:
          "border border-white/[0.08] bg-transparent hover:bg-white/[0.04] text-zinc-300 hover:text-white",
        secondary:
          "bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-200 border border-zinc-700/30",
        ghost:
          "hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100",
        link:
          "text-amber-500 underline-offset-4 hover:underline",
        glass:
          "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] backdrop-blur-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-sm",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
