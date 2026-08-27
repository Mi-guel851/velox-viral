"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Flame,
  Filter,
  CheckCircle2,
  Trash2,
  Edit,
  Send,
  Sparkles,
  Layers,
  MoreHorizontal,
  X,
  FileText,
} from "lucide-react";
import { Platform, Post } from "@/lib/types";
import { PLATFORMS, ALL_PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn, formatDate } from "@/lib/utils";

export const CalendarScheduler: React.FC = () => {
  const {
    posts,
    loadPostIntoComposer,
    publishPostImmediately,
    deletePost,
    reschedulePost,
    setActiveTab,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 7, 25)); // Aug 2026

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (selectedPlatform !== "all" && !p.targetPlatforms.includes(selectedPlatform as Platform)) {
      return false;
    }
    if (selectedStatus !== "all" && p.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handlePublishNow = async (id: string) => {
    await publishPostImmediately(id);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    toast.success("🚀 Post published successfully!");
    setSelectedPost(null);
  };

  const handleDelete = (id: string) => {
    deletePost(id);
    toast.success("Post removed from schedule");
    setSelectedPost(null);
  };

  const handleEdit = (post: Post) => {
    loadPostIntoComposer(post);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Calendar Header & Filters */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              Content Schedule & Queue
            </span>
            <Badge variant="success">Auto-Queue Active</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Publishing Calendar
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your multichannel publishing schedule, drag slots, and optimize for peak audience engagement.
          </p>
        </div>

        {/* View Mode Switcher & Month Navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-white px-2">
              {currentMonthDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 text-zinc-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-white/10">
            {(["month", "list"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "apple" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "h-8 px-3 text-xs capitalize",
                  viewMode === mode && "bg-white/20 text-white shadow-sm"
                )}
              >
                {mode === "month" ? "Grid Calendar" : "Queue List"}
              </Button>
            ))}
          </div>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setActiveTab("composer")}
            className="h-9 px-4 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule New Post</span>
          </Button>
        </div>
      </div>

      {/* Platform & Status Filter Chips */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setSelectedPlatform("all")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-semibold transition-all border",
              selectedPlatform === "all"
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white"
            )}
          >
            All Channels
          </button>
          {ALL_PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5",
                selectedPlatform === p
                  ? "bg-white/20 border-white/30 text-white"
                  : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white"
              )}
            >
              <PlatformIcon platform={p} className="w-3.5 h-3.5" />
              <span className="capitalize">{p}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(["all", "scheduled", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-medium capitalize transition-all",
                selectedStatus === s
                  ? "bg-white/20 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* MONTH GRID VIEW */}
      {viewMode === "month" && (
        <div className="glass-card rounded-3xl p-4 sm:p-5 border border-white/10 space-y-3">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider pb-2 border-b border-white/5">
            {daysOfWeek.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Calendar Grid (35 cells for August 2026 demo) */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => {
              // August 1, 2026 starts on Saturday (offset 6)
              const dayNumber = index - 5;
              const isCurrentMonth = dayNumber > 0 && dayNumber <= 31;
              const isToday = dayNumber === 25; // Aug 25

              // Find posts matching this day
              const dayPosts = filteredPosts.filter((p) => {
                if (!isCurrentMonth) return false;
                if (p.scheduledAt) {
                  const d = new Date(p.scheduledAt);
                  return d.getDate() === dayNumber && d.getMonth() === 7;
                }
                if (p.publishedAt) {
                  const d = new Date(p.publishedAt);
                  return d.getDate() === dayNumber && d.getMonth() === 7;
                }
                return false;
              });

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[110px] rounded-2xl p-2 flex flex-col justify-between border transition-all relative group",
                    isCurrentMonth
                      ? "bg-zinc-950/40 border-white/[0.06] hover:border-white/20 hover:bg-zinc-900/60"
                      : "opacity-20 border-transparent bg-transparent pointer-events-none",
                    isToday && "ring-2 ring-indigo-500/60 bg-indigo-950/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center",
                        isToday
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-zinc-400"
                      )}
                    >
                      {isCurrentMonth ? dayNumber : ""}
                    </span>

                    {/* Peak Slot Indicator for certain days */}
                    {isCurrentMonth && (dayNumber === 26 || dayNumber === 27) && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                        <Flame className="w-2.5 h-2.5 fill-amber-400" />
                        3 PM
                      </span>
                    )}
                  </div>

                  {/* Day Posts List */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-16 no-scrollbar">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={cn(
                          "p-1.5 rounded-xl text-[10px] border flex items-center gap-1.5 cursor-pointer truncate transition-all shadow-sm",
                          post.status === "published"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                            : post.status === "scheduled"
                            ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/25"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300"
                        )}
                        title={post.defaultContent}
                      >
                        <div className="flex items-center -space-x-1 shrink-0">
                          {post.targetPlatforms.slice(0, 2).map((p) => (
                            <PlatformIcon key={p} platform={p} className="w-3 h-3 text-white" />
                          ))}
                        </div>
                        <span className="truncate font-medium">{post.title || post.defaultContent}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quick Add Slot hover trigger */}
                  {isCurrentMonth && (
                    <button
                      onClick={() => setActiveTab("composer")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-400 hover:text-white flex items-center justify-center gap-1 py-0.5 rounded-lg bg-white/5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Slot</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUEUE LIST VIEW */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Status Indicator Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                    post.status === "published"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : post.status === "scheduled"
                      ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}
                >
                  {post.status === "published" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : post.status === "scheduled" ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm text-white truncate">
                      {post.title || "Social Post"}
                    </span>
                    <Badge
                      variant={
                        post.status === "published"
                          ? "success"
                          : post.status === "scheduled"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px] capitalize"
                    >
                      {post.status}
                    </Badge>
                    {post.viralScore && (
                      <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                        ⚡ {post.viralScore.overall}/100 Viral Score
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {post.defaultContent}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {post.scheduledAt
                        ? formatDate(post.scheduledAt)
                        : post.publishedAt
                        ? `Published ${formatDate(post.publishedAt)}`
                        : "Draft"}
                    </span>
                    <div className="flex items-center gap-1">
                      <span>Channels:</span>
                      <div className="flex items-center gap-1">
                        {post.targetPlatforms.map((p) => (
                          <PlatformIcon key={p} platform={p} className="w-3.5 h-3.5 text-zinc-300" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {post.status === "scheduled" && (
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => handlePublishNow(post.id)}
                    className="h-8 px-3 text-xs rounded-xl shadow-sm"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    <span>Publish Now</span>
                  </Button>
                )}
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleEdit(post)}
                  className="h-8 px-3 text-xs rounded-xl text-zinc-200 hover:text-white"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                  className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Post Details Modal / Drawer */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-3xl p-6 max-w-lg w-full border border-white/15 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">Post Details</span>
                <Badge
                  variant={selectedPost.status === "published" ? "success" : "default"}
                  className="capitalize"
                >
                  {selectedPost.status}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 whitespace-pre-wrap leading-relaxed text-zinc-200 max-h-60 overflow-y-auto">
                {selectedPost.defaultContent}
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span>Target Channels:</span>
                <div className="flex items-center gap-2">
                  {selectedPost.targetPlatforms.map((p) => (
                    <div key={p} className="flex items-center gap-1 text-white bg-white/10 px-2 py-0.5 rounded-lg">
                      <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                      <span className="capitalize text-[10px]">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPost.scheduledAt && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Scheduled Date:</span>
                  <span className="text-white font-mono">{formatDate(selectedPost.scheduledAt)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(selectedPost.id)}
                className="rounded-xl text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => {
                    handleEdit(selectedPost);
                    setSelectedPost(null);
                  }}
                  className="rounded-xl text-xs"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  Edit in Composer
                </Button>
                {selectedPost.status === "scheduled" && (
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => handlePublishNow(selectedPost.id)}
                    className="rounded-xl text-xs"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Publish Now
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
