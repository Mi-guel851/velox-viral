"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthAlertProps {
  variant: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}

const VARIANTS = {
  error: {
    wrapper: "bg-rose-500/10 border-rose-500/25 text-rose-200",
    icon: AlertCircle,
    iconColor: "text-rose-400",
    role: "alert" as const,
  },
  success: {
    wrapper: "bg-emerald-500/10 border-emerald-500/25 text-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    role: "status" as const,
  },
  info: {
    wrapper: "bg-indigo-500/10 border-indigo-500/25 text-indigo-200",
    icon: Info,
    iconColor: "text-indigo-400",
    role: "status" as const,
  },
};

/** Inline form-level banner for auth screens. */
export const AuthAlert: React.FC<AuthAlertProps> = ({ variant, children, className }) => {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2.5 p-3.5 rounded-2xl border text-xs leading-relaxed",
        config.wrapper,
        className
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0 mt-px", config.iconColor)} />
      <span>{children}</span>
    </div>
  );
};
