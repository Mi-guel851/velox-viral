"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  Download,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, previewTheme, setPreviewTheme } = useAppStore();

  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [watermark, setWatermark] = useState(settings.customWatermarkText);

  const handleSaveSettings = () => {
    updateSettings({
      workspaceName,
      timezone,
      customWatermarkText: watermark,
    });
    toast.success("Workspace settings updated successfully!");
  };

  const handleExportData = () => {
    const data = localStorage.getItem("viralflow_app_storage_v1");
    const blob = new Blob([data || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viralflow-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Data export downloaded!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              Configuration & Integrations
            </span>
            <Badge variant="purple">V1.0 Production Ready</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Workspace Settings
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your workspace preferences, branding, and data export.
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          variant="gradient"
          className="h-10 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      {/* 1. General Workspace */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>General Workspace</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Creator Watermark Handle
            </label>
            <input
              type="text"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
              placeholder="@yourhandle"
              className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. Backup & Export */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-white">Data Export & Backup</h4>
          <p className="text-xs text-zinc-400">
            Download a JSON snapshot of your scheduled posts, templates, and connected channels.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportData}
          className="rounded-xl text-xs h-9 text-zinc-200 hover:text-white"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          <span>Export JSON</span>
        </Button>
      </div>
    </div>
  );
};
