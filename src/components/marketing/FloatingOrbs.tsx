"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const ORBS = [
  { x: "15%", y: "20%", size: 320, color: "rgba(251,191,36,0.06)", duration: 18, delay: 0 },
  { x: "75%", y: "15%", size: 260, color: "rgba(251,191,36,0.04)", duration: 22, delay: 2 },
  { x: "50%", y: "70%", size: 200, color: "rgba(255,255,255,0.02)", duration: 20, delay: 4 },
  { x: "85%", y: "65%", size: 180, color: "rgba(251,191,36,0.03)", duration: 16, delay: 1 },
];

export const FloatingOrbs: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: orb.color,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 30, -20, 0],
                  y: [0, -25, 15, 0],
                  scale: [1, 1.08, 0.95, 1],
                }
          }
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
};
