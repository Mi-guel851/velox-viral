"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Travel distance in px before settling. */
  y?: number;
  className?: string;
}

/**
 * Scroll-triggered fade-and-rise. Isolated into one small client component so
 * the marketing page stays a server component and only ships motion code for
 * the wrappers that need it.
 *
 * Honours `prefers-reduced-motion` by rendering the settled state immediately.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  y = 18,
  className,
}) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};
