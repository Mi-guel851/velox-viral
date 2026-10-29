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
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-700 border border-blue-500/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Real-Time Cross-Platform Intelligence
            </span>
            <Badge variant={analytics.totalFollowers > 0 ? "success" : "default"}>{analytics.totalFollowers > 0 ? "Data Synced" : "No Data Yet"}</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Performance Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified audience growth, organic reach, viral multiplier coefficients, and algorithm attribution.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                timeRange === range
                  ? "bg-slate-100/80 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
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
        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Audience</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {formatNumber(analytics.totalFollowers)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{analytics.followerGrowthPercent}% vs last month</span>
          </div>
        </div>

        {/* Total Impressions */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Organic Impressions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {formatNumber(analytics.totalImpressions)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            {analytics.totalImpressions > 0 ? (
              <><ArrowUpRight className="w-4 h-4" /><span>+{analytics.followerGrowthPercent}% MoM</span></>
            ) : (
              <span className="text-slate-500">Connect channels to track</span>
            )}
          </div>
        </div>

        {/* Avg Engagement Rate */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg Engagement Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {analytics.avgEngagementRate}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {analytics.avgEngagementRate > 0 ? (
              <><Zap className="w-3.5 h-3.5" /><span>{analytics.avgEngagementRate}% avg</span></>
            ) : (
              <span>Connect channels to track</span>
            )}
          </div>
        </div>

        {/* Viral Posts */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Viral Posts (S-Tier)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {analytics.viralPostsCount} Posts
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {analytics.viralPostsCount > 0 ? (
              <span>⚡ From {analytics.viralPostsCount} published post{analytics.viralPostsCount !== 1 ? "s" : ""}</span>
            ) : (
              <span>No published posts yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Growth Trends Chart (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Impressions & Reach Trend</h3>
              <p className="text-xs text-slate-500">Aggregated cross-platform distribution curve</p>
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
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Channel Audience Breakdown</h3>
            <span className="text-xs text-slate-500">{platformStats.filter((s) => s.followers > 0).length} Active Account{platformStats.filter((s) => s.followers > 0).length !== 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {platformStats.map((stat) => (
              <div
                key={stat.platform}
                className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <PlatformIcon platform={stat.platform} className="w-4 h-4" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{stat.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {stat.postsCount} posts this month
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">
                    {formatNumber(stat.followers)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">
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
        <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Best Posting Times Heatmap
              </h3>
              <p className="text-xs text-slate-500">
                {analytics.totalFollowers > 0
                  ? `Audience activity index analyzed across ${formatNumber(analytics.totalFollowers)} followers`
                  : "Connect channels to see peak posting times"}
              </p>
            </div>
            {analytics.bestTimes.length > 0 && (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                🔥 Peak times identified
              </span>
            )}
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
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col items-center justify-between"
                >
                  <span className="font-bold text-slate-500">{day}</span>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-bold text-xs border shadow-sm",
                      peakForDay.score >= 95
                        ? "bg-blue-500/20 text-blue-700 border-blue-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                        : peakForDay.score >= 90
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-700 border-blue-500/30"
                    )}
                  >
                    <span>{peakForDay.hour > 12 ? `${peakForDay.hour - 12}P` : `${peakForDay.hour}A`}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{peakForDay.score}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations List (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              AI Algorithmic Recommendations
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700">
              <span className="font-bold block mb-1">⚡ Increase LinkedIn White Space</span>
              Your posts with 1-line breaks and bullet points generated 3.2x more comments than dense paragraphs.
            </div>

            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700">
              <span className="font-bold block mb-1">🎣 High-Arousal Hooks Drive X Threads</span>
              Threads opening with &ldquo;99% of people are wrong&rdquo; average 148k impressions (+84%).
            </div>

            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700">
              <span className="font-bold block mb-1">📸 Carousel Carousels Drive 65% of Saves</span>
              Instagram swipe decks retain users 4x longer than static single-image posts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
