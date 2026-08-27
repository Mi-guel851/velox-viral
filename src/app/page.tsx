"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { MultiPlatformComposer } from "@/components/composer/MultiPlatformComposer";
import { AICaptionStudio } from "@/components/composer/AICaptionStudio";
import { ContentRepurposer } from "@/components/repurpose/ContentRepurposer";
import { CalendarScheduler } from "@/components/calendar/CalendarScheduler";
import { ContentLibrary } from "@/components/library/ContentLibrary";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { ConnectedAccounts } from "@/components/accounts/ConnectedAccounts";
import { SettingsModal } from "@/components/settings/SettingsModal";

export default function Home() {
  const { activeTab } = useAppStore();

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView key="dashboard" />;
      case "composer":
        return <MultiPlatformComposer key="composer" />;
      case "studio":
        return <AICaptionStudio key="studio" />;
      case "repurpose":
        return <ContentRepurposer key="repurpose" />;
      case "calendar":
        return <CalendarScheduler key="calendar" />;
      case "library":
        return <ContentLibrary key="library" />;
      case "analytics":
        return <AnalyticsView key="analytics" />;
      case "accounts":
        return <ConnectedAccounts key="accounts" />;
      case "settings":
        return <SettingsModal key="settings" />;
      default:
        return <DashboardView key="default" />;
    }
  };

  return (
    <div className="min-h-screen flex p-2 sm:p-4 gap-4 max-w-[1720px] mx-auto">
      {/* Desktop & Tablet Collapsible Sidebar */}
      <AppSidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-2rem)]">
        <AppHeader />

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Floating Dock */}
      <AppBottomNav />
    </div>
  );
}
