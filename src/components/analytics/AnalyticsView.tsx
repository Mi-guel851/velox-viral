"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Share2,
  MessageCircle,
  Repeat2,
  Zap,
} from "lucide-react";
import { Platform } from "@/lib/types";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatNumber, cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export const AnalyticsView: React.FC = () => {
  const { analytics, posts } = useAppStore();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // Format historical chart data
  const chartData = analytics.historicalData;

  // Platform performance array
  const platformStats = Object.entries(analytics.platformMetrics).map(
    ([platformKey, data]) => ({
      platform: platformKey as Platform,
      name: PLATFORMS[platformKey as Platform]?.name || platformKey,
      followers: data.followers,
      engagement: data.engagement,
      postsCount: data.postsCount,
      growthRate: data.growthRate,
    })
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Analytics Header */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Real-Time Cross-Platform Intelligence
            </span>
            <Badge variant="success">All Systems Synced</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Performance Analytics
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Unified audience growth, organic reach, viral multiplier coefficients, and algorithm attribution.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-white/10">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                timeRange === range
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "Quarter"}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Audience */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Audience</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatNumber(analytics.totalFollowers)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{analytics.followerGrowthPercent}% vs last month</span>
          </div>
        </div>

        {/* Total Impressions */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Organic Impressions</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatNumber(analytics.totalImpressions)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+24.1% MoM velocity</span>
          </div>
        </div>

        {/* Avg Engagement Rate */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Avg Engagement Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {analytics.avgEngagementRate}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Top 2% creator benchmark</span>
          </div>
        </div>

        {/* Viral Posts */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Viral Posts (S-Tier)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {analytics.viralPostsCount} Posts
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
            <span>⚡ 4.8x Average Multiplier</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Growth Trends Chart (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Daily Impressions & Reach Trend</h3>
              <p className="text-xs text-zinc-400">Aggregated cross-platform distribution curve</p>
            </div>
            <Badge variant="purple">Live Synced</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  name="Impressions"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorImpressions)"
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  name="Engagement"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEngagement)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Share Breakdown (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Channel Audience Breakdown</h3>
            <span className="text-xs text-zinc-400">7 Active Accounts</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {platformStats.map((stat) => (
              <div
                key={stat.platform}
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <PlatformIcon platform={stat.platform} className="w-4 h-4" />
                  <div>
                    <span className="text-xs font-bold text-white block">{stat.name}</span>
                    <span className="text-[10px] text-zinc-400">
                      {stat.postsCount} posts this month
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-white block">
                    {formatNumber(stat.followers)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400">
                    +{stat.growthRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Posting Times Heatmap & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Heatmap (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Best Posting Times Heatmap
              </h3>
              <p className="text-xs text-zinc-400">
                Audience activity index analyzed across your 401K followers
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-xl">
              🔥 Peak: Tue & Wed 3-5 PM
            </span>
          </div>

          {/* 7-Day Peak Visual Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
              const peakForDay = analytics.bestTimes.find((b) => b.day === day) || {
                hour: 14,
                score: 85,
              };
              return (
                <div
                  key={day}
                  className="p-3 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-2 flex flex-col items-center justify-between"
                >
                  <span className="font-bold text-zinc-400">{day}</span>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-bold text-xs border shadow-sm",
                      peakForDay.score >= 95
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                        : peakForDay.score >= 90
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    )}
                  >
                    <span>{peakForDay.hour > 12 ? `${peakForDay.hour - 12}P` : `${peakForDay.hour}A`}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{peakForDay.score}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations List (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI Algorithmic Recommendations
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
              <span className="font-bold block mb-1">⚡ Increase LinkedIn White Space</span>
              Your posts with 1-line breaks and bullet points generated 3.2x more comments than dense paragraphs.
            </div>

            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
              <span className="font-bold block mb-1">🎣 High-Arousal Hooks Drive X Threads</span>
              Threads opening with &ldquo;99% of people are wrong&rdquo; average 148k impressions (+84%).
            </div>

            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
              <span className="font-bold block mb-1">📸 Carousel Carousels Drive 65% of Saves</span>
              Instagram swipe decks retain users 4x longer than static single-image posts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
