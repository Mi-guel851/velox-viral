"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Flame,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { ViralScoreBreakdown, Platform } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface ViralScoreCardProps {
  score?: ViralScoreBreakdown;
  platform?: Platform;
  onApplyOptimized?: () => Promise<void> | void;
  onReanalyze?: () => void;
  compact?: boolean;
}

export const ViralScoreCard: React.FC<ViralScoreCardProps> = ({
  score,
  platform = "twitter",
  onApplyOptimized,
  onReanalyze,
  compact = false,
}) => {
  if (!score || score.overall === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center border border-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
        <div className="relative z-10 flex flex-col items-center justify-center py-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mb-3 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">AI Viral Score Engine</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Type your caption or prompt to analyze real-time viral probability, hook power, readability, and algorithmic fit.
          </p>
        </div>
      </div>
    );
  }

  const getScoreColor = (val: number) => {
    if (val >= 90) return "text-emerald-700";
    if (val >= 80) return "text-blue-600";
    if (val >= 70) return "text-blue-600";
    if (val >= 55) return "text-blue-600";
    return "text-rose-600";
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "S":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
      case "A":
        return "bg-blue-500/20 text-blue-700 border-blue-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
      case "B":
        return "bg-blue-500/20 text-blue-700 border-blue-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]";
      case "C":
        return "bg-blue-500/20 text-blue-700 border-blue-500/40";
      default:
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    }
  };

  const [isBoosting, setIsBoosting] = useState(false);

  const handleBoostClick = async () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#6366f1", "#ec4899", "#06b6d4", "#10b981"],
    });
    if (onApplyOptimized) {
      setIsBoosting(true);
      try {
        await onApplyOptimized();
      } finally {
        setIsBoosting(false);
      }
    }
  };

  const metrics = [
    { label: "Hook Power", value: score.hookScore, icon: Flame, tooltip: "First 3-second retention" },
    { label: "Emotional Resonance", value: score.emotionScore, icon: Sparkles, tooltip: "High-arousal power words" },
    { label: "Mobile Readability", value: score.readabilityScore, icon: TrendingUp, tooltip: "Line breaks & pacing" },
    { label: "CTA Conversion", value: score.ctaScore, icon: ArrowUpRight, tooltip: "Saves & replies prompt" },
    { label: "Platform Fit", value: score.platformFitScore, icon: Zap, tooltip: "Algorithm optimization" },
    { label: "Hashtag Power", value: score.hashtagScore, icon: CheckCircle2, tooltip: "Niche tag density" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-panel rounded-3xl p-5 sm:p-6 border border-slate-200 relative overflow-hidden",
        compact ? "p-4" : "p-6"
      )}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header with Circular Score */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {/* Radial Score Meter */}
          <div className="relative flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-900/10"
                fill="transparent"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="4"
                className={getScoreColor(score.overall)}
                fill="transparent"
                strokeDasharray="163.36"
                initial={{ strokeDashoffset: 163.36 }}
                animate={{
                  strokeDashoffset: 163.36 - (163.36 * score.overall) / 100,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {score.overall}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">AI Viral Score</span>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded-lg border",
                  getGradeBadge(score.grade)
                )}
              >
                Grade {score.grade}
              </span>
            </div>
            <p className="text-xs text-blue-700 font-medium mt-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600 fill-blue-400" />
              {score.estimatedReachMultiplier}
            </p>
          </div>
        </div>

        {onReanalyze && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onReanalyze}
            className="text-slate-500 hover:text-slate-900"
            title="Re-analyze post"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 6 Sub-Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 flex items-center gap-1 font-medium text-[11px]">
                <m.icon className="w-3 h-3 text-slate-500" />
                {m.label}
              </span>
              <span className={cn("font-semibold text-xs", getScoreColor(m.value))}>
                {m.value}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  m.value >= 85
                    ? "bg-gradient-to-r from-emerald-500 to-blue-400"
                    : m.value >= 70
                    ? "bg-gradient-to-r from-blue-500 to-blue-500"
                    : "bg-gradient-to-r from-blue-500 to-rose-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Actionable Insights */}
      {score.highlights && score.highlights.length > 0 && (
        <div className="space-y-2 my-4">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Optimization Insights
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {score.highlights.map((h, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs p-2.5 rounded-xl border flex items-start gap-2 leading-relaxed",
                  h.type === "positive"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                    : h.type === "warning"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-700"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-700"
                )}
              >
                {h.type === "positive" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : h.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span>{h.message}</span>
                  {h.fix && (
                    <span className="block mt-1 text-[11px] font-mono text-slate-600 opacity-90">
                      💡 Fix: {h.fix}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1-Click Auto Boost Button */}
      {score.overall < 95 && onApplyOptimized && (
        <div className="pt-2">
          <Button
            onClick={handleBoostClick}
            variant="gradient"
            disabled={isBoosting}
            className="w-full h-11 text-xs sm:text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 group"
          >
            {isBoosting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
            )}
            <span>{isBoosting ? "AI is rewriting your post..." : "\u26A1 1-Click Auto-Fix & Boost (Rewrites to 95+ Score)"}</span>
          </Button>
        </div>
      )}
    </motion.div>
  );
};
