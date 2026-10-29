import React from "react";
import { Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  iconOnly?: boolean;
  withTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const MARK_SIZES = {
  sm: "w-8 h-8 rounded-lg",
  md: "w-10 h-10 rounded-xl",
  lg: "w-12 h-12 rounded-xl",
} as const;

const ICON_SIZES = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
} as const;

const TEXT_SIZES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
} as const;

export const Logo: React.FC<LogoProps> = ({
  iconOnly = false,
  withTagline = false,
  size = "md",
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "bg-blue-500 flex items-center justify-center text-slate-50 shrink-0",
          MARK_SIZES[size]
        )}
      >
        <Zap className={cn("fill-white", ICON_SIZES[size])} />
      </div>

      {!iconOnly && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-display font-bold tracking-tight text-slate-900 truncate",
                TEXT_SIZES[size]
              )}
            >
              {BRAND.name}
            </span>
          </div>
          {withTagline && (
            <span className="text-[10px] text-slate-500 block font-medium truncate tracking-wide uppercase">
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
