"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Send,
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Video,
  X,
  Plus,
  Wand2,
  Check,
  Flame,
  MessageSquare,
  AlertCircle,
  Copy,
  ChevronDown,
  Layers,
  FileText,
  Sliders,
  Scissors,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Platform } from "@/lib/types";
import { PLATFORMS, ALL_PLATFORMS, PlatformManager } from "@/lib/platforms";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { PlatformPreviews } from "./PlatformPreviews";
import { ViralScoreCard } from "@/components/viral-score/ViralScoreCard";
import { AIService } from "@/lib/ai/ai-service";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const SAMPLE_MEDIA = [
  { label: "Abstract AI Dark", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80" },
  { label: "Tech Workspace", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80" },
  { label: "Cyber Neon Grid", url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80" },
  { label: "Modern Laptop", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80" },
];

export const MultiPlatformComposer: React.FC = () => {
  const {
    composer,
    accounts,
    previewPlatform,
    setComposerContent,
    setComposerTitle,
    setPlatformOverrideContent,
    setFirstComment,
    toggleTargetPlatform,
    setTargetPlatforms,
    setComposerMedia,
    setComposerSchedule,
    setActiveOverridePlatform,
    applyOptimizedCaption,
    savePostAsDraft,
    schedulePost,
    publishPostImmediately,
    resetComposer,
    setPreviewPlatform,
    analyzeComposerViralScore,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"master" | Platform>("master");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [customMediaUrl, setCustomMediaUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAIImproving, setIsAIImproving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("2026-08-26T15:00");

  // Determine current active content depending on whether we are editing master or specific platform
  const currentPlatform = activeTab === "master" ? composer.targetPlatforms[0] || "twitter" : activeTab;
  const currentContent =
    activeTab === "master"
      ? composer.defaultContent
      : composer.platformContent[activeTab] || composer.defaultContent;

  const currentFirstComment =
    activeTab === "master"
      ? composer.firstComment[currentPlatform] || ""
      : composer.firstComment[activeTab] || "";

  const config = PLATFORMS[currentPlatform];
  const charLimit = config?.maxCharacters || 280;
  const charsRemaining = charLimit - currentContent.length;
  const isOverLimit = charsRemaining < 0;

  const activeAccount = accounts.find((a) => a.platform === currentPlatform);

  // Auto adapt master content into all selected platforms
  const handleAutoAdaptToAll = () => {
    if (!composer.defaultContent.trim()) {
      toast.error("Write your master draft first before adapting!");
      return;
    }

    for (const p of composer.targetPlatforms) {
      const adapted = PlatformManager.adaptContentForPlatform(composer.defaultContent, p);
      setPlatformOverrideContent(p, adapted);
    }
    toast.success(`Adapted custom tailored copy for ${composer.targetPlatforms.length} platforms!`);
  };

  const handleAIImprove = async (type: any) => {
    if (!currentContent.trim()) {
      toast.error("Enter some text to improve");
      return;
    }

    setIsAIImproving(true);
    try {
      const improved = await AIService.improveContent(currentContent, type, currentPlatform);
      if (activeTab === "master") {
        setComposerContent(improved);
      } else {
        setPlatformOverrideContent(activeTab, improved);
      }
      toast.success("AI optimization applied!");
    } catch (err) {
      toast.error("Failed to run AI optimization");
    } finally {
      setIsAIImproving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentContent.trim()) {
      toast.error("Please enter post content");
      return;
    }

    setIsPublishing(true);
    try {
      await publishPostImmediately();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#06b6d4", "#ec4899", "#10b981"],
      });
      toast.success("🚀 Post published successfully across selected platforms!");
      resetComposer();
    } catch (e) {
      toast.error("Publishing error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = () => {
    if (!currentContent.trim()) {
      toast.error("Please enter post content");
      return;
    }

    schedulePost(scheduledDate);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    toast.success(`Scheduled for ${new Date(scheduledDate).toLocaleString()}`);
    setShowScheduleModal(false);
    resetComposer();
  };

  const handleAddMedia = (url: string) => {
    setComposerMedia([url], "image");
    setShowMediaPicker(false);
    toast.success("Media attached!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Target Platforms Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Target Publishing Channels
          </span>
          <p className="text-xs text-zinc-300">
            Select channels to broadcast. Write once, and ViralFlow will auto-adapt format, character rules, and hashtags.
          </p>
        </div>

        {/* Platform Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_PLATFORMS.map((p) => {
            const isSelected = composer.targetPlatforms.includes(p);
            const pConf = PLATFORMS[p];
            return (
              <button
                key={p}
                onClick={() => {
                  toggleTargetPlatform(p);
                  setPreviewPlatform(p);
                }}
                className={cn(
                  "px-3 py-2 rounded-2xl flex items-center gap-2 border text-xs font-medium transition-all duration-200 select-none",
                  isSelected
                    ? "bg-white/15 border-white/30 text-white shadow-md ring-1 ring-white/20"
                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <PlatformIcon platform={p} className={cn("w-4 h-4", isSelected ? "text-white" : "text-zinc-500")} />
                <span>{pConf.name}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Composer Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Content Editor & AI Tools */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4">
            {/* Platform Sub-tabs (Master vs Platform Specific Override) */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => {
                    setActiveTab("master");
                    setActiveOverridePlatform(undefined);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                    activeTab === "master"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Master Draft</span>
                </button>

                {composer.targetPlatforms.map((p) => {
                  const hasCustom = Boolean(composer.platformContent[p]);
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setActiveTab(p);
                        setActiveOverridePlatform(p);
                        setPreviewPlatform(p);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border",
                        activeTab === p
                          ? "bg-white/20 border-white/30 text-white"
                          : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white"
                      )}
                    >
                      <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                      <span className="capitalize">{p}</span>
                      {hasCustom && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 1-Click Auto Adapt Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoAdaptToAll}
                className="h-7 px-2.5 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"
                title="Intelligently adapt format for all selected platforms"
              >
                <Wand2 className="w-3 h-3 mr-1" />
                <span>Auto-Adapt All</span>
              </Button>
            </div>

            {/* Optional Title input for YouTube Shorts / LinkedIn */}
            {(currentPlatform === "youtube" || currentPlatform === "linkedin") && (
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Post Title / Video Headline
                </label>
                <input
                  type="text"
                  value={composer.title}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder="E.g. 10x Creator Distribution Framework #Shorts"
                  className="w-full rounded-xl bg-zinc-950/70 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Main Content Textarea */}
            <div className="relative">
              <textarea
                value={currentContent}
                onChange={(e) => {
                  if (activeTab === "master") {
                    setComposerContent(e.target.value);
                  } else {
                    setPlatformOverrideContent(activeTab, e.target.value);
                  }
                }}
                placeholder={
                  activeTab === "master"
                    ? "Write your core viral post here... ViralFlow will format it per channel."
                    : `Customize caption specifically for ${PLATFORMS[activeTab]?.name}...`
                }
                rows={9}
                className="w-full rounded-2xl bg-zinc-950/80 border border-white/10 p-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 leading-relaxed resize-y font-sans"
              />

              {/* Live Character & Thread Counter */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-xs">
                {currentPlatform === "twitter" && currentContent.length > 280 && (
                  <span className="text-cyan-400 font-medium">
                    🧵 {Math.ceil(currentContent.length / 260)} Tweets
                  </span>
                )}
                <span
                  className={cn(
                    "font-mono font-medium",
                    isOverLimit ? "text-rose-400 font-bold" : "text-zinc-400"
                  )}
                >
                  {currentContent.length}/{charLimit}
                </span>
              </div>
            </div>

            {/* First Comment Field (Instagram / LinkedIn / Facebook / YouTube) */}
            {config?.features?.firstComment && (
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Auto-Publish First Comment (Links, hashtags, promo)
                </label>
                <input
                  type="text"
                  value={currentFirstComment}
                  onChange={(e) => setFirstComment(currentPlatform, e.target.value)}
                  placeholder="E.g. Download the free Notion template from the link in bio! 🚀"
                  className="w-full rounded-xl bg-zinc-950/60 border border-white/10 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            )}

            {/* Media Attachment Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Visual Attachments
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="h-7 text-xs text-indigo-300 hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Attach Media
                </Button>
              </div>

              {/* Media Picker Drawer */}
              {showMediaPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-3"
                >
                  <span className="text-[11px] font-medium text-zinc-400 block">
                    Choose from Curated Viral Creator Stock:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {SAMPLE_MEDIA.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => handleAddMedia(m.url)}
                        className="group relative rounded-xl overflow-hidden aspect-video border border-white/10 hover:border-indigo-400 transition-all"
                      >
                        <img
                          src={m.url}
                          alt={m.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] p-1 text-center truncate text-zinc-200">
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customMediaUrl}
                      onChange={(e) => setCustomMediaUrl(e.target.value)}
                      placeholder="Or paste any custom Image/Video URL..."
                      className="flex-1 rounded-xl bg-zinc-900 border border-white/10 px-3 py-1 text-xs text-white focus:outline-none"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (customMediaUrl) handleAddMedia(customMediaUrl);
                      }}
                      className="h-8 text-xs rounded-xl"
                    >
                      Add URL
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Attached Media Cards */}
              {composer.mediaUrls.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {composer.mediaUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/20 group shadow-md"
                    >
                      <img src={url} alt="Attached" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setComposerMedia([], "text")}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-rose-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Fast Optimization Bar */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                1-Click AI Optimizers
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("boost_viral")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-indigo-300 hover:text-white"
                >
                  <Flame className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  <span>Boost Viral Angle</span>
                </Button>
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("shorten")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-zinc-300 hover:text-white"
                >
                  <Scissors className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  <span>Make Punchier</span>
                </Button>
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("generate_cta")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-zinc-300 hover:text-white"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>Add High-CTR CTA</span>
                </Button>
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("add_emojis")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-zinc-300 hover:text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" />
                  <span>Strategic Emojis</span>
                </Button>
              </div>
            </div>

            {/* Footer Actions: Save Draft, Schedule, Publish */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    savePostAsDraft();
                    toast.success("Draft saved successfully!");
                  }}
                  className="h-10 text-xs text-zinc-400 hover:text-white rounded-xl"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Save Draft
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowScheduleModal(true)}
                  className="h-10 text-xs text-zinc-200 hover:text-white rounded-xl"
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                  Schedule...
                </Button>
              </div>

              <Button
                variant="gradient"
                size="default"
                onClick={handlePublish}
                disabled={isPublishing || !currentContent.trim()}
                className="h-11 px-6 rounded-2xl font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Publish Now ({composer.targetPlatforms.length} Channels)</span>
              </Button>
            </div>
          </div>

          {/* Viral Score Card Widget right under the editor */}
          <ViralScoreCard
            score={composer.viralScore}
            platform={currentPlatform}
            onApplyOptimized={applyOptimizedCaption}
            onReanalyze={analyzeComposerViralScore}
          />
        </div>

        {/* Right Column (5 cols): Live Hyper-Realistic Platform Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={previewPlatform} className="w-5 h-5" />
                <span className="font-bold text-sm text-white">
                  {PLATFORMS[previewPlatform]?.name} Live Preview
                </span>
              </div>
              <Badge variant="purple" className="text-[10px]">
                Pixel-Perfect Mockup
              </Badge>
            </div>

            {/* Platform Previews Mockup Component */}
            <PlatformPreviews
              platform={previewPlatform}
              content={
                composer.platformContent[previewPlatform] || composer.defaultContent
              }
              mediaUrls={composer.mediaUrls}
              mediaType={composer.mediaType}
              title={composer.title}
              firstComment={composer.firstComment[previewPlatform]}
              account={activeAccount}
              onPlatformChange={(p) => setPreviewPlatform(p)}
            />
          </div>
        </div>
      </div>

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-3xl p-6 max-w-md w-full border border-white/15 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Schedule Cross-Platform Post</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">
                  Select Date & Time (Your Local Timezone)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-2xl bg-zinc-950 border border-white/15 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Recommended Peak Audience Slots */}
              <div>
                <span className="text-xs font-semibold text-zinc-300 block mb-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  AI Recommended Peak Audience Slots:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setScheduledDate("2026-08-26T15:00")}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-emerald-400 block">Tomorrow 3:00 PM</span>
                    <span className="text-[10px] text-zinc-400">🔥 98% Audience Activity</span>
                  </button>
                  <button
                    onClick={() => setScheduledDate("2026-08-27T17:30")}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-cyan-400 block">Thursday 5:30 PM</span>
                    <span className="text-[10px] text-zinc-400">🚀 Peak Engagement Window</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleSchedule}
                className="rounded-xl px-5 text-xs font-semibold"
              >
                Confirm Schedule
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
