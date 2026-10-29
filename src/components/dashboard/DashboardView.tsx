"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Plus,
  Repeat2,
  Calendar,
  Flame,
  ArrowRight,
  Clock,
  Eye,
  Heart,
  Send,
  Users,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export const DashboardView: React.FC = () => {
  const {
    posts,
    accounts,
    analytics,
    hooks,
    setActiveTab,
    setComposerContent,
    loadPostIntoComposer,
  } = useAppStore();

  const scheduledPosts = posts.filter((p) => p.status === "scheduled");
  const publishedPosts = posts.filter((p) => p.status === "published");
  const hookOfTheDay = hooks[0] || {
    example: "Most creators fail not because their content is bad, but because their distribution is broken.",
    viralScoreEstimate: 98,
    category: "Curiosity Gap",
  };

  const handleUseHook = (text: string) => {
    setComposerContent(text);
    setActiveTab("composer");
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Welcome & Quick Trigger Bar */}
      <div className="relative rounded-3xl p-6 sm:p-8 glass-panel border border-slate-200 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/20 via-blue-500/20 to-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-700 border border-blue-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Social Engine
              </span>
              {accounts.length > 0 && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {accounts.filter((a) => a.status === "connected").length} Channel{accounts.filter((a) => a.status === "connected").length !== 1 ? "s" : ""} Connected
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Create once. Go viral everywhere.
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              Broadcast intelligent, platform-native content to Instagram, TikTok, X, LinkedIn, Facebook, Threads & YouTube simultaneously.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <Button
              onClick={() => setActiveTab("repurpose")}
              variant="apple"
              className="h-11 px-5 rounded-2xl text-xs font-semibold flex items-center gap-2"
            >
              <Repeat2 className="w-4 h-4 text-blue-600" />
              <span>Repurpose 1-to-7</span>
            </Button>
            <Button
              onClick={() => setActiveTab("composer")}
              variant="gradient"
              className="h-11 px-6 rounded-2xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Viral Post</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Audience</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatNumber(analytics.totalFollowers)}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            {analytics.totalFollowers > 0 ? `+${analytics.followerGrowthPercent}% growth` : "Connect channels to track"}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Monthly Impressions</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatNumber(analytics.totalImpressions)}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            {analytics.totalImpressions > 0 ? "Tracked from platforms" : "Connect channels to track"}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Scheduled Queue</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {scheduledPosts.length} Posts Ready
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            {scheduledPosts.length > 0 ? "Posts queued" : "No posts scheduled"}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Avg Engagement</span>
            <Heart className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {analytics.avgEngagementRate}%
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            {analytics.avgEngagementRate > 0 ? `Avg across ${accounts.length} channel${accounts.length !== 1 ? "s" : ""}` : "Connect channels to track"}
          </span>
        </div>
      </div>

      {/* Main Grid: Scheduled Queue + Hook of the Day + Channel Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Scheduled Posts & Queue */}
        <div className="lg:col-span-7 space-y-5">
          {/* Upcoming Scheduled Queue */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Upcoming Multi-Platform Queue
                </h3>
                <p className="text-xs text-slate-500">Scheduled for automated peak-window broadcast</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("calendar")}
                className="text-xs text-blue-700 hover:text-slate-900"
              >
                <span>View Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {scheduledPosts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/30 border border-slate-200 space-y-2">
                <p className="text-xs text-slate-500">No posts in queue right now.</p>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setActiveTab("composer")}
                  className="rounded-xl text-xs"
                >
                  Schedule First Post
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => loadPostIntoComposer(post)}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-500/40 transition-all cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-xs">
                          {post.title || "Cross-Platform Broadcast"}
                        </span>
                        {post.viralScore && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            ⚡ {post.viralScore.overall}/100
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        {post.scheduledAt ? formatDate(post.scheduledAt) : "Scheduled"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {post.defaultContent}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span>Publishing to:</span>
                        <div className="flex items-center gap-1">
                          {post.targetPlatforms.map((p) => (
                            <PlatformIcon key={p} platform={p} className="w-3.5 h-3.5 text-slate-600" />
                          ))}
                        </div>
                      </div>
                      <span className="text-blue-600 group-hover:underline font-medium">
                        Edit in Composer →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Viral Hook of the Day */}
          <div className="glass-card rounded-3xl p-5 border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-zinc-900/60 to-transparent space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">Viral Hook Formula of the Day</span>
              </div>
              <Badge variant="warning">⚡ {hookOfTheDay.viralScoreEstimate}% CTR Score</Badge>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              &ldquo;{hookOfTheDay.example}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-mono">
                Category: {hookOfTheDay.category}
              </span>
              <Button
                variant="apple"
                size="sm"
                onClick={() => handleUseHook(hookOfTheDay.example)}
                className="h-8 px-3 text-xs font-semibold text-blue-700 hover:text-slate-900 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 rounded-xl"
              >
                <span>Use This Hook</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Channel Health & Fast Stats */}
        <div className="lg:col-span-5 space-y-5">
          {/* Channel Health Grid */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Channel Health & Distribution</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("accounts")}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Manage
              </Button>
            </div>

            <div className="space-y-2.5">
              {accounts.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-black/30 border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500">No channels connected yet.</p>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => setActiveTab("accounts")}
                    className="rounded-xl text-xs"
                  >
                    Connect First Channel
                  </Button>
                </div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform={acc.platform} className="w-4 h-4" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {acc.displayName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          @{acc.username}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">
                        {formatNumber(acc.followerCount)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {acc.metrics.engagementRate}% eng.
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick AI Action Card */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-200 space-y-3 text-center">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Need Post Ideas?</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Open the AI Caption Studio to generate high-converting hooks and variations in seconds.
            </p>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setActiveTab("studio")}
              className="w-full rounded-xl text-xs font-semibold h-9"
            >
              Open AI Caption Studio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
