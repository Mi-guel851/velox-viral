"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Layers, Sparkles } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import { cn } from "@/lib/utils";

const MASTER_DRAFT =
  "Most creators don't have a content problem. They have a distribution problem.\n\nHere's the flywheel that fixes it:";

export const FlywheelVisual: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative"
      initial={reduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.97 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Ambient glow behind the panel */}
      <motion.div
        aria-hidden
        className="absolute -inset-8 blur-3xl rounded-[3rem] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 60% 40%, rgba(251,191,36,0.12), rgba(251,191,36,0.02), transparent 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative surface-elevated rounded-2xl border border-white/[0.06] p-4 sm:p-5">
        {/* Window chrome */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <span className="text-[10px] font-semibold text-zinc-500 font-mono tracking-wider uppercase">
            Multi-platform composer
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-4">
          {/* Master draft */}
          <div className="md:col-span-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 text-[10px] font-bold">
                <Layers className="w-3 h-3" />
                Master draft
              </span>
              <span className="text-[10px] text-zinc-500">write it once</span>
            </div>

            <div className="rounded-xl bg-zinc-950/80 border border-white/[0.06] p-3.5 min-h-[112px]">
              <p className="text-[11px] sm:text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                {MASTER_DRAFT}
                {!reduceMotion && (
                  <motion.span
                    className="inline-block w-[2px] h-3 bg-amber-400 ml-0.5 align-middle"
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Adapting for 7 channels
              </span>
            </div>
          </div>

          {/* Platform fan-out */}
          <div className="md:col-span-2 space-y-1.5">
            {ALL_PLATFORMS.map((platform, index) => {
              const config = PLATFORMS[platform];
              return (
                <motion.div
                  key={platform}
                  initial={reduceMotion ? undefined : { opacity: 0, x: 16 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.5 + index * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-white/[0.05]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PlatformIcon platform={platform} className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span className="text-[10px] font-medium text-zinc-300 truncate">
                      {config.shortName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono text-zinc-500">
                      {config.maxCharacters.toLocaleString("en-US")}
                    </span>
                    <motion.div
                      initial={reduceMotion ? undefined : { scale: 0 }}
                      animate={reduceMotion ? undefined : { scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.08, type: "spring", stiffness: 400 }}
                    >
                      <Check className="w-3 h-3 text-amber-400" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
