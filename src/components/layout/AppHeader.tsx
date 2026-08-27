"use client";

import React from "react";
import {
  Sparkles,
  Zap,
  Bell,
  Search,
  Plus,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ALL_PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const AppHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    accounts,
    settings,
  } = useAppStore();

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Executive Dashboard";
      case "composer":
        return "Multi-Platform Composer";
      case "studio":
        return "AI Caption Studio";
      case "repurpose":
        return "1-to-7 Content Repurposer";
      case "calendar":
        return "Publishing Calendar & Queue";
      case "library":
        return "Viral Hook Bank & Library";
      case "analytics":
        return "Performance Analytics";
      case "accounts":
        return "Connected Social Accounts";
      case "settings":
        return "Workspace Settings";
      default:
        return "ViralFlow";
    }
  };

  return (
    <header className="sticky top-4 z-30 mb-6 rounded-3xl glass-panel border border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-xl">
      {/* Left: Current Section Title & Platform Badges */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{getPageTitle()}</span>
          </h2>
          <span className="hidden sm:block text-[11px] text-zinc-400 font-medium">
            {settings.workspaceName} • High-Leverage Multi-Channel Engine
          </span>
        </div>
      </div>

      {/* Right: Channels Active Status + Fast Action */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connected Channels Pill */}
        <div
          onClick={() => setActiveTab("accounts")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
          title="7 Connected Social Channels"
        >
          <div className="flex items-center -space-x-1">
            {ALL_PLATFORMS.slice(0, 5).map((p) => (
              <PlatformIcon key={p} platform={p} className="w-3.5 h-3.5 text-zinc-300" />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {accounts.length} Live
          </span>
        </div>

        {/* AI Engine Status Pill */}
        <div
          onClick={() => setActiveTab("settings")}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold cursor-pointer hover:bg-indigo-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Engine Ready</span>
        </div>

        {/* Create Post Fast Trigger */}
        <Button
          onClick={() => setActiveTab("composer")}
          variant="gradient"
          size="sm"
          className="rounded-xl h-9 px-3.5 text-xs font-semibold shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Post</span>
        </Button>
      </div>
    </header>
  );
};
