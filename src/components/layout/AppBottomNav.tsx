"use client";

import React from "react";
import {
  LayoutDashboard,
  PenTool,
  Sparkles,
  Repeat2,
  Calendar,
  TrendingUp,
  Link2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const AppBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  const navItems = [
    { id: "dashboard" as const, label: "Home", icon: LayoutDashboard },
    { id: "composer" as const, label: "Composer", icon: PenTool },
    { id: "studio" as const, label: "AI Studio", icon: Sparkles },
    { id: "repurpose" as const, label: "Repurpose", icon: Repeat2 },
    { id: "calendar" as const, label: "Calendar", icon: Calendar },
    { id: "analytics" as const, label: "Stats", icon: TrendingUp },
  ];

  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-50 rounded-3xl glass-panel border border-white/15 p-1.5 shadow-2xl flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 text-[10px] font-medium",
              isActive
                ? "bg-white/15 text-white font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <item.icon
              className={cn(
                "w-4 h-4 mb-0.5 transition-colors",
                isActive ? "text-indigo-400" : "text-zinc-400"
              )}
            />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
