"use client";

import React, { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { useAppStore } from "@/lib/store";
import { useSessionTimeout } from "@/lib/hooks/use-session-timeout";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { MultiPlatformComposer } from "@/components/composer/MultiPlatformComposer";
import { AICaptionStudio } from "@/components/composer/AICaptionStudio";
import { ContentRepurposer } from "@/components/repurpose/ContentRepurposer";
import { CalendarScheduler } from "@/components/calendar/CalendarScheduler";
import { ContentLibrary } from "@/components/library/ContentLibrary";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { ConnectedAccounts } from "@/components/accounts/ConnectedAccounts";
import { SettingsModal } from "@/components/settings/SettingsModal";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function DashboardPage() {
  const { activeTab, settings, updateSettings } = useAppStore();

  // Automatically sign out after 10 minutes of inactivity
  useSessionTimeout();

  // On first load after onboarding, pick up workspace name from cookie
  useEffect(() => {
    const workspaceName = getCookie("velox_workspace_name");
    if (workspaceName && workspaceName !== settings.workspaceName) {
      updateSettings({ workspaceName });
      // Clear the cookie after consuming it
      document.cookie = "velox_workspace_name=; path=/; max-age=0";
    }
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "composer":
        return <MultiPlatformComposer />;
      case "studio":
        return <AICaptionStudio />;
      case "repurpose":
        return <ContentRepurposer />;
      case "calendar":
        return <CalendarScheduler />;
      case "library":
        return <ContentLibrary />;
      case "analytics":
        return <AnalyticsView />;
      case "accounts":
        return <ConnectedAccounts />;
      case "settings":
        return <SettingsModal />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen workspace-background text-slate-800 antialiased">
      <div className="flex gap-4 p-4 max-w-[1920px] mx-auto">
        {/* Desktop Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <AppHeader />
          <div className="px-0 sm:px-2">{renderActiveView()}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <AppBottomNav />
    </div>
  );
}
