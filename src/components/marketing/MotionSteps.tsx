"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link2, Sparkles, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    title: "Connect your channels",
    body:
      "Authorise each network over OAuth. Tokens are encrypted before they touch the database and never exposed to the browser.",
  },
  {
    icon: Sparkles,
    title: "Compose and adapt",
    body:
      "Draft once, then let the AI studio generate hooks, captions and hashtags tuned to the platform you're targeting.",
  },
  {
    icon: Rocket,
    title: "Publish or queue",
    body:
      "Send immediately or schedule it. Track each platform's result independently and retry only what failed.",
  },
];

export const MotionSteps: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
      {/* Animated connecting line — desktop only */}
      {!reduceMotion && (
        <motion.div
          className="hidden md:block absolute top-[52px] left-[16.7%] right-[16.7%] h-px"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.15), transparent)",
            transformOrigin: "left",
          }}
        />
      )}

      {STEPS.map((step, index) => (
        <motion.div
          key={step.title}
          initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.5,
            delay: 0.15 + index * 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative text-center space-y-5"
        >
          <div className="relative inline-flex">
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-[52px] h-[52px] rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
            >
              <step.icon className="w-5 h-5 text-amber-400/80" />
            </motion.div>
            <motion.span
              initial={reduceMotion ? undefined : { scale: 0 }}
              whileInView={reduceMotion ? undefined : { scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.4 + index * 0.12,
                type: "spring",
                stiffness: 500,
                damping: 15,
              }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center"
            >
              {index + 1}
            </motion.span>
          </div>
          <div>
            <h3 className="font-display text-[15px] font-semibold text-white mb-2">
              {step.title}
            </h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {step.body}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
