"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { passwordRuleResults, passwordStrength, PASSWORD_RULES } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  value: string;
  /** Hides the per-rule checklist, leaving only the meter. */
  meterOnly?: boolean;
}

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-slate-50",
  "bg-rose-500",
  "bg-blue-500",
  "bg-blue-500",
  "bg-emerald-500",
];
const STRENGTH_TEXT = [
  "text-slate-500",
  "text-rose-600",
  "text-blue-600",
  "text-blue-600",
  "text-emerald-700",
];

/**
 * Live password requirement feedback.
 *
 * Rules come from the same module the server action validates with, so the
 * checklist can never drift from what is actually enforced.
 */
export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  value,
  meterOnly = false,
}) => {
  const score = passwordStrength(value);
  const results = passwordRuleResults(value);
  const total = PASSWORD_RULES.length;

  if (!value) return null;

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1" aria-hidden>
          {Array.from({ length: total }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                index < score ? STRENGTH_COLORS[score] : "bg-slate-100/80"
              )}
            />
          ))}
        </div>
        <span
          className={cn("text-[10px] font-semibold shrink-0 w-16 text-right", STRENGTH_TEXT[score])}
          aria-live="polite"
        >
          {STRENGTH_LABELS[score]}
        </span>
      </div>

      {!meterOnly && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {results.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-[10px] transition-colors",
                rule.passed ? "text-emerald-700" : "text-slate-500"
              )}
            >
              {rule.passed ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <X className="w-3 h-3 shrink-0 opacity-50" />
              )}
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
