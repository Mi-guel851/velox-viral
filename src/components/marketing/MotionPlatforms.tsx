"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";

export const MotionPlatforms: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0 sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible">
      {ALL_PLATFORMS.map((platform, index) => {
        const config = PLATFORMS[platform];
        return (
          <motion.div
            key={platform}
            initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.95 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.45,
              delay: index * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -2,
                    boxShadow: "0 8px 24px -4px rgba(251,191,36,0.08)",
                  }
            }
            className="surface-card rounded-xl px-4 py-3.5 flex items-center gap-3 min-w-[140px] sm:min-w-0 sm:flex-col sm:items-center sm:gap-2 sm:text-center sm:px-3 cursor-default"
          >
            <PlatformIcon platform={platform} className="w-5 h-5 text-zinc-300 shrink-0" />
            <div className="sm:space-y-0.5">
              <span className="text-[11px] font-semibold text-zinc-200 leading-tight block">
                {config.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-600 block">
                {config.maxCharacters.toLocaleString("en-US")} chars
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
