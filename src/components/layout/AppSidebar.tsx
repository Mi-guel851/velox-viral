"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PenTool,
  Sparkles,
  Repeat2,
  Calendar,
  BookOpen,
  TrendingUp,
  Link2,
  Settings,
  Plus,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  id: "dashboard" | "composer" | "studio" | "repurpose" | "calendar" | "library" | "analytics" | "accounts" | "settings";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "composer", label: "Composer", icon: PenTool, badge: "Multi" },
  { id: "studio", label: "AI Caption Studio", icon: Sparkles, badge: "AI" },
  { id: "repurpose", label: "1-to-7 Repurposer", icon: Repeat2, badge: "Flywheel" },
  { id: "calendar", label: "Schedule & Calendar", icon: Calendar },
  { id: "library", label: "Viral Hook Bank", icon: BookOpen, badge: "50+" },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "accounts", label: "Connected Channels", icon: Link2, badge: "7" },
  { id: "settings", label: "Settings", icon: Settings },
];

export const AppSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    settings,
  } = useAppStore();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col justify-between h-[calc(100vh-2rem)] sticky top-4 z-40 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-20" : "w-64",
        "glass-panel rounded-3xl border border-white/10 p-3 shadow-2xl"
      )}
    >
      {/* Top Brand Logo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 pt-2">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-sans">
                    ViralFlow
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Social Operating System
                </span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg mx-auto">
              <Zap className="w-5 h-5 fill-white" />
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Create Action Button */}
        <div className="px-1">
          <Button
            onClick={() => setActiveTab("composer")}
            variant="gradient"
            className={cn(
              "w-full rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 font-semibold h-11 transition-all",
              sidebarCollapsed ? "px-0" : "px-4"
            )}
          >
            <Plus className="w-4 h-4" />
            {!sidebarCollapsed && <span>Create Post</span>}
          </Button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 px-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 relative group select-none",
                  isActive
                    ? "text-white bg-white/10 shadow-sm border border-white/10 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-white"
                  )}
                />
                {!sidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                      isActive
                        ? "bg-indigo-500/30 text-indigo-200"
                        : "bg-white/[0.05] text-zinc-400 group-hover:text-zinc-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Workspace Pill */}
      <div className="p-2 border-t border-white/10">
        <div
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 cursor-pointer transition-all",
            sidebarCollapsed ? "justify-center" : ""
          )}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="User avatar"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20 shrink-0"
          />
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                {settings.workspaceName}
              </span>
              <span className="text-[10px] text-zinc-400 block truncate">
                Pro Plan • 7 Channels
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
