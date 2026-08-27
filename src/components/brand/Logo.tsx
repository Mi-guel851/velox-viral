import React from "react";
import { Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Hides the wordmark, leaving only the gradient mark. */
  iconOnly?: boolean;
  /** Adds the "Social Operating System" descender line. */
  withTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const MARK_SIZES = {
  sm: "w-8 h-8 rounded-xl",
  md: "w-10 h-10 rounded-2xl",
  lg: "w-12 h-12 rounded-2xl",
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

/**
 * The Velox Viral wordmark. Extracted so the sidebar, auth screens, landing page
 * and emails all render an identical mark.
 */
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
          "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 shrink-0",
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
                "font-extrabold tracking-tight text-white font-sans truncate",
                TEXT_SIZES[size]
              )}
            >
              {BRAND.name}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              {BRAND.mark}
            </span>
          </div>
          {withTagline && (
            <span className="text-[10px] text-zinc-400 block font-medium truncate">
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
