"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Layers, Sparkles } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import { cn } from "@/lib/utils";

const MASTER_DRAFT =
  "Most creators don't have a content problem. They have a distribution problem.\n\nHere's the flywheel that fixes it:";

/**
 * Hero product illustration: one master draft fanning out into seven
 * platform-native variants.
 *
 * This is a stylised diagram of the product's core mechanic, not a data
 * readout — the only numbers shown are each platform's real published character
 * limit, pulled from the same PLATFORMS table the composer validates against.
 */
export const FlywheelVisual: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative">
      {/* Ambient glow behind the panel */}
      <div
        aria-hidden
        className="absolute -inset-8 bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-cyan-500/20 blur-3xl rounded-[3rem] pointer-events-none"
      />

      <div className="relative glass-panel rounded-[2rem] border border-white/10 p-4 sm:p-5 shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-[10px] font-semibold text-zinc-500 font-mono tracking-wider uppercase">
            Multi-platform composer
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-4">
          {/* Master draft */}
          <div className="md:col-span-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-semibold">
                <Layers className="w-3 h-3" />
                Master draft
              </span>
              <span className="text-[10px] text-zinc-500">write it once</span>
            </div>

            <div className="rounded-2xl bg-zinc-950/80 border border-white/10 p-3.5 min-h-[112px]">
              <p className="text-[11px] sm:text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                {MASTER_DRAFT}
                {!reduceMotion && (
                  <motion.span
                    className="inline-block w-[2px] h-3 bg-indigo-400 ml-0.5 align-middle"
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
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
                  initial={reduceMotion ? undefined : { opacity: 0, x: 12 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.25 + index * 0.09,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl",
                    "bg-white/[0.03] border border-white/[0.07]"
                  )}
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
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
