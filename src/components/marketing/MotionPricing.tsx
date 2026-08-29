"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPlanPrice, planAmount, type Plan, type BillingCurrency } from "@/lib/plans";

interface MotionPricingProps {
  plans: Plan[];
  currency: BillingCurrency;
}

export const MotionPricing: React.FC<MotionPricingProps> = ({ plans, currency }) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid md:grid-cols-3 gap-4 items-start">
      {plans.map((plan, index) => {
        const isPaid = planAmount(plan, currency) > 0;
        return (
          <motion.div
            key={plan.id}
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.5,
              delay: index * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -4,
                    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                  }
            }
            className={cn(
              "relative rounded-2xl p-6 h-full flex flex-col space-y-5 transition-shadow duration-300",
              plan.highlighted
                ? "bg-amber-500/[0.06] border border-amber-500/20 shadow-lg shadow-amber-500/5"
                : "surface-card"
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                POPULAR
              </span>
            )}

            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-bold text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-white tracking-tight">
                  {formatPlanPrice(plan, currency)}
                </span>
                {isPaid && (
                  <span className="text-xs text-zinc-500 font-medium">/month</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {plan.tagline}
              </p>
            </div>

            <ul className="space-y-2.5 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 shrink-0" />
                  <span className="text-xs text-zinc-300 leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              variant={plan.highlighted ? "gradient" : "apple"}
              className="w-full rounded-xl h-11 text-sm font-semibold"
            >
              <Link href="/signup">
                {isPaid ? `Choose ${plan.name}` : "Get started free"}
              </Link>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};
