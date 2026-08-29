"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  PenTool,
  Eye,
  Repeat2,
  CalendarClock,
  BarChart3,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: PenTool,
    title: "One composer, seven channels",
    body:
      "Write a master draft and override any platform individually. Character limits, hashtag caps and media rules are validated per platform before anything is sent.",
    color: "amber",
  },
  {
    icon: Eye,
    title: "Pixel-accurate previews",
    body:
      "See exactly how a post renders on each network — phone, tablet and desktop, light and dark — before it goes out.",
    color: "zinc",
  },
  {
    icon: Repeat2,
    title: "1-to-7 repurposing",
    body:
      "Paste an article, transcript or set of notes. Get a native format for every channel: a thread, a carousel caption, a short-form script, a discussion prompt.",
    color: "amber",
  },
  {
    icon: CalendarClock,
    title: "Server-side scheduling",
    body:
      "Queue a post and close your laptop. Publishing happens on our servers with retries and per-platform status.",
    color: "zinc",
  },
  {
    icon: BarChart3,
    title: "Real analytics, not estimates",
    body:
      "Impressions, reach, saves, clicks and follower growth pulled straight from each platform's API. Never estimated.",
    color: "amber",
  },
  {
    icon: Bell,
    title: "Backend-confirmed events",
    body:
      "Notifications fire on real events: published, partially published, failed, token expiring. A success means the platform confirmed it.",
    color: "zinc",
  },
];

export const MotionFeatures: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
      {FEATURES.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.5,
            delay: index * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={reduceMotion ? undefined : { backgroundColor: "rgba(255,255,255,0.015)" }}
          className="bg-[#0b0d13] p-7 sm:p-8 space-y-4 cursor-default"
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.1, rotate: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                feature.color === "amber"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-white/[0.04] text-zinc-400"
              )}
            >
              <feature.icon className="w-4.5 h-4.5" />
            </motion.div>
            <h3 className="font-display text-[15px] font-semibold text-white">
              {feature.title}
            </h3>
          </div>
          <p className="text-[13px] text-zinc-400 leading-relaxed">
            {feature.body}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
