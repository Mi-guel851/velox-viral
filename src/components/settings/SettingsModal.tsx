"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Database,
  Cpu,
  Clock,
  Sparkles,
  Key,
  ShieldCheck,
  Check,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  Save,
  Code2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { SUPABASE_SCHEMA_SQL, isSupabaseConfigured } from "@/lib/supabase";
import { ALL_PLATFORMS, PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, previewTheme, setPreviewTheme } = useAppStore();

  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [aiProvider, setAiProvider] = useState(settings.aiProvider);
  const [openaiKey, setOpenaiKey] = useState(settings.aiKeys?.openai || "");
  const [anthropicKey, setAnthropicKey] = useState(settings.aiKeys?.anthropic || "");
  const [geminiKey, setGeminiKey] = useState(settings.aiKeys?.gemini || "");
  const [groqKey, setGroqKey] = useState(settings.aiKeys?.groq || "");
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || "");
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseAnonKey || "");
  const [watermark, setWatermark] = useState(settings.customWatermarkText);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);

  const handleSaveSettings = () => {
    updateSettings({
      workspaceName,
      timezone,
      aiProvider,
      aiKeys: {
        openai: openaiKey,
        anthropic: anthropicKey,
        gemini: geminiKey,
        groq: groqKey,
      },
      supabaseUrl,
      supabaseAnonKey: supabaseKey,
      customWatermarkText: watermark,
    });
    toast.success("Workspace settings updated successfully!");
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    toast.success("Supabase SQL Schema copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 2500);
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
            Configure Supabase persistence, AI provider keys, scheduling preferences, and brand tokens.
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

      {/* 2. Supabase Integration */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Supabase Database Integration</h3>
          </div>
          <Badge variant={isSupabaseConfigured() ? "success" : "default"}>
            {isSupabaseConfigured() ? "Cloud Synced" : "Local Storage Engine (Active)"}
          </Badge>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          ViralFlow operates with high-speed local persistence by default and syncs directly to your Supabase PostgreSQL cluster when credentials are provided.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Supabase Anon / Service Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Schema viewer toggle */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="h-8 text-xs text-zinc-300"
            >
              <Code2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>{showSqlSchema ? "Hide SQL Schema" : "View Supabase SQL Schema DDL"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopySql}
              className="h-8 text-xs text-zinc-400 hover:text-white"
            >
              {copiedSql ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1" />
              )}
              <span>Copy SQL</span>
            </Button>
          </div>

          {showSqlSchema && (
            <div className="p-4 rounded-2xl bg-black/70 border border-white/10 max-h-56 overflow-y-auto font-mono text-[11px] text-zinc-300 leading-relaxed whitespace-pre">
              {SUPABASE_SCHEMA_SQL}
            </div>
          )}
        </div>
      </div>

      {/* 3. AI Providers & Keys */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">AI Provider & Multi-Model Engine</h3>
          </div>
          <Badge variant="purple">Multi-Model Router</Badge>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Select Active AI Engine
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "builtin", label: "ViralFlow Engine", desc: "Built-in (Zero Config)" },
              { id: "openai", label: "OpenAI GPT-4o", desc: "OpenAI API" },
              { id: "anthropic", label: "Claude 3.5", desc: "Anthropic API" },
              { id: "groq", label: "Groq Llama 3", desc: "Ultra Fast Inference" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setAiProvider(p.id as any)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all",
                  aiProvider === p.id
                    ? "bg-indigo-600/30 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-400"
                    : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="text-xs font-bold block">{p.label}</span>
                <span className="text-[10px] text-zinc-400">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* API Key Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              OpenAI API Key (Optional)
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Anthropic API Key (Optional)
            </label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 4. Backup & Export */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-white">Data Export & Backup</h4>
          <p className="text-xs text-zinc-400">
            Download an encrypted JSON snapshot of your scheduled posts, templates, and connected channels.
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
