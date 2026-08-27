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
      <div className="relative rounded-3xl p-6 sm:p-8 glass-panel border border-white/10 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Social Engine • Multichannel Active
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All 7 Channels Synced
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Create once. Go viral everywhere.
            </h1>
            <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
              Broadcast intelligent, platform-native content to Instagram, TikTok, X, LinkedIn, Facebook, Threads & YouTube simultaneously.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <Button
              onClick={() => setActiveTab("repurpose")}
              variant="apple"
              className="h-11 px-5 rounded-2xl text-xs font-semibold flex items-center gap-2"
            >
              <Repeat2 className="w-4 h-4 text-purple-400" />
              <span>Repurpose 1-to-7</span>
            </Button>
            <Button
              onClick={() => setActiveTab("composer")}
              variant="gradient"
              className="h-11 px-6 rounded-2xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Viral Post</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Total Audience</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatNumber(analytics.totalFollowers)}
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 block">
            +{analytics.followerGrowthPercent}% organic growth
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Monthly Impressions</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatNumber(analytics.totalImpressions)}
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 block">
            +24.1% MoM velocity
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Scheduled Queue</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {scheduledPosts.length} Posts Ready
          </div>
          <span className="text-[11px] font-semibold text-cyan-400 block">
            Next: Tomorrow 2:30 PM
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Avg Engagement</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {analytics.avgEngagementRate}%
          </div>
          <span className="text-[11px] font-semibold text-amber-400 block">
            ⚡ Top 2% creator tier
          </span>
        </div>
      </div>

      {/* Main Grid: Scheduled Queue + Hook of the Day + Channel Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Scheduled Posts & Queue */}
        <div className="lg:col-span-7 space-y-5">
          {/* Upcoming Scheduled Queue */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Upcoming Multi-Platform Queue
                </h3>
                <p className="text-xs text-zinc-400">Scheduled for automated peak-window broadcast</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("calendar")}
                className="text-xs text-indigo-300 hover:text-white"
              >
                <span>View Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {scheduledPosts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <p className="text-xs text-zinc-400">No posts in queue right now.</p>
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
                    className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-indigo-500/40 transition-all cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-xs">
                          {post.title || "Cross-Platform Broadcast"}
                        </span>
                        {post.viralScore && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            ⚡ {post.viralScore.overall}/100
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {post.scheduledAt ? formatDate(post.scheduledAt) : "Scheduled"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {post.defaultContent}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <span>Publishing to:</span>
                        <div className="flex items-center gap-1">
                          {post.targetPlatforms.map((p) => (
                            <PlatformIcon key={p} platform={p} className="w-3.5 h-3.5 text-zinc-300" />
                          ))}
                        </div>
                      </div>
                      <span className="text-indigo-400 group-hover:underline font-medium">
                        Edit in Composer →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Viral Hook of the Day */}
          <div className="glass-card rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-zinc-900/60 to-transparent space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Viral Hook Formula of the Day</span>
              </div>
              <Badge variant="warning">⚡ {hookOfTheDay.viralScoreEstimate}% CTR Score</Badge>
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              &ldquo;{hookOfTheDay.example}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400 font-mono">
                Category: {hookOfTheDay.category}
              </span>
              <Button
                variant="apple"
                size="sm"
                onClick={() => handleUseHook(hookOfTheDay.example)}
                className="h-8 px-3 text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 rounded-xl"
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
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Channel Health & Distribution</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("accounts")}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Manage
              </Button>
            </div>

            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform={acc.platform} className="w-4 h-4" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {acc.displayName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        @{acc.username}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">
                      {formatNumber(acc.followerCount)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {acc.metrics.engagementRate}% eng.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Action Card */}
          <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-3 text-center">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Need Post Ideas?</h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
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
