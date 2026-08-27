"use client";

import React, { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Field-level validation message. Also wires up aria-invalid/describedby. */
  error?: string;
  hint?: string;
  /** Rendered inside the field on the right (e.g. a show/hide password toggle). */
  trailing?: React.ReactNode;
}

/**
 * Labelled input with accessible error wiring, matching the app's glass styling.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  trailing,
  className,
  id,
  ...props
}) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block text-xs font-semibold text-zinc-300 tracking-wide"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error && errorId, hint && !error && hintId) || undefined}
          className={cn(
            "w-full rounded-2xl bg-zinc-950/70 border px-4 py-3 text-sm text-zinc-100",
            "placeholder:text-zinc-600 transition-all backdrop-blur-md",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            trailing && "pr-12",
            error
              ? "border-rose-500/50 focus:ring-rose-500/40 focus:border-rose-500/50"
              : "border-white/10",
            className
          )}
          {...props}
        />

        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-[11px] font-medium text-rose-400"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
