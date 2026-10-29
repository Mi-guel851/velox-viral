"use client";

import React, { useState, useRef, useCallback } from "react";
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
  Upload,
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
  const deviceFileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: composer.defaultContent,
          platformContent: composer.platformContent,
          targetPlatforms: composer.targetPlatforms,
          mediaUrls: composer.mediaUrls,
          title: composer.title,
          firstComment: composer.firstComment,
        }),
      });

      const data = await res.json();

      if (data.success || data.partial) {
        await publishPostImmediately();
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#06b6d4", "#ec4899", "#10b981"],
        });

        // Show per-platform results
        if (data.results) {
          const platforms = Object.entries(data.results) as [string, any][];
          const succeeded = platforms.filter(([, r]) => r.success);
          const failed = platforms.filter(([, r]) => !r.success);

          if (succeeded.length > 0) {
            toast.success(
              `🚀 Published to ${succeeded.map(([p]) => p).join(", ")}!`
            );
          }
          if (failed.length > 0) {
            for (const [platform, result] of failed) {
              toast.error(`${platform}: ${result.error || "Publishing failed"}`);
            }
          }
        } else {
          toast.success("🚀 Post published successfully!");
        }

        resetComposer();
      } else {
        toast.error(data.message || "Publishing failed. Check your platform connections.");
        if (data.results) {
          Object.entries(data.results).forEach(([platform, result]: [string, any]) => {
            if (!result.success && result.error) {
              toast.error(`${platform}: ${result.error}`);
            }
          });
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Publishing error — check your platform connections.");
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

  const handleDeviceFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File must be under 50MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setComposerMedia([dataUrl], file.type.startsWith("video/") ? "video" : "image");
      toast.success(`Attached ${file.name}!`);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [setComposerMedia]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Target Platforms Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Target Publishing Channels
          </span>
          <p className="text-xs text-slate-600">
            Select channels to broadcast. Write once, and Velox Viral will auto-adapt format, character rules, and hashtags.
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
                    ? "bg-slate-100/80 border-slate-200 text-slate-900 shadow-md ring-1 ring-slate-200"
                    : "bg-slate-100/80 border-slate-200 text-slate-500 hover:text-slate-600 hover:bg-slate-100/80"
                )}
              >
                <PlatformIcon platform={p} className={cn("w-4 h-4", isSelected ? "text-slate-900" : "text-slate-500")} />
                <span>{pConf.name}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-700 ml-0.5" />
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
          <div className="glass-card rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
            {/* Platform Sub-tabs (Master vs Platform Specific Override) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => {
                    setActiveTab("master");
                    setActiveOverridePlatform(undefined);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                    activeTab === "master"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100/80 text-slate-500 hover:text-slate-900"
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
                          ? "bg-slate-100/80 border-slate-200 text-slate-900"
                          : "bg-slate-100/80 border-slate-200 text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                      <span className="capitalize">{p}</span>
                      {hasCustom && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
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
                className="h-7 px-2.5 text-xs text-blue-700 border-blue-500/30 hover:bg-blue-500/10"
                title="Intelligently adapt format for all selected platforms"
              >
                <Wand2 className="w-3 h-3 mr-1" />
                <span>Auto-Adapt All</span>
              </Button>
            </div>

            {/* Optional Title input for YouTube Shorts / LinkedIn */}
            {(currentPlatform === "youtube" || currentPlatform === "linkedin") && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Post Title / Video Headline
                </label>
                <input
                  type="text"
                  value={composer.title}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder="E.g. 10x Creator Distribution Framework #Shorts"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    ? "Write your core viral post here... Velox Viral will format it per channel."
                    : `Customize caption specifically for ${PLATFORMS[activeTab]?.name}...`
                }
                rows={9}
                className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 leading-relaxed resize-y font-sans"
              />

              {/* Live Character & Thread Counter */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                {currentPlatform === "twitter" && currentContent.length > 280 && (
                  <span className="text-blue-600 font-medium">
                    🧵 {Math.ceil(currentContent.length / 260)} Tweets
                  </span>
                )}
                <span
                  className={cn(
                    "font-mono font-medium",
                    isOverLimit ? "text-rose-600 font-bold" : "text-slate-500"
                  )}
                >
                  {currentContent.length}/{charLimit}
                </span>
              </div>
            </div>

            {/* First Comment Field (Instagram / LinkedIn / Facebook / YouTube) */}
            {config?.features?.firstComment && (
              <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Auto-Publish First Comment (Links, hashtags, promo)
                </label>
                <input
                  type="text"
                  value={currentFirstComment}
                  onChange={(e) => setFirstComment(currentPlatform, e.target.value)}
                  placeholder="E.g. Download the free Notion template from the link in bio! 🚀"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            )}

            {/* Media Attachment Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  Visual Attachments
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="h-7 text-xs text-blue-700 hover:text-slate-900"
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
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  {/* Device Upload Button */}
                  <button
                    onClick={() => deviceFileInputRef.current?.click()}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-blue-500/30 hover:border-blue-400/60 bg-blue-500/5 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 text-blue-700 hover:text-blue-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-semibold">Upload from your device</span>
                    <span className="text-[10px] text-slate-500">(Image or Video, max 50MB)</span>
                  </button>
                  <input
                    ref={deviceFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleDeviceFileSelect}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-100/80" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">or choose stock</span>
                    <div className="flex-1 h-px bg-slate-100/80" />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {SAMPLE_MEDIA.map((m) => (
                      <button
                        key={m.label}
                        onClick={() => handleAddMedia(m.url)}
                        className="group relative rounded-xl overflow-hidden aspect-video border border-slate-200 hover:border-blue-400 transition-all"
                      >
                        <img
                          src={m.url}
                          alt={m.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] p-1 text-center truncate text-slate-700">
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
                      className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1 text-xs text-slate-900 focus:outline-none"
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
                      className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 group shadow-md"
                    >
                      <img src={url} alt="Attached" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setComposerMedia([], "text")}
                        className="absolute top-1 right-1 bg-black/70 text-slate-900 rounded-full p-1 hover:bg-rose-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Fast Optimization Bar */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                1-Click AI Optimizers
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("boost_viral")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-blue-700 hover:text-slate-900"
                >
                  <Flame className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  <span>Boost Viral Angle</span>
                </Button>
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("shorten")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-slate-600 hover:text-slate-900"
                >
                  <Scissors className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  <span>Make Punchier</span>
                </Button>
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("generate_cta")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-slate-600 hover:text-slate-900"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                  <span>Add High-CTR CTA</span>
                </Button>
                <Button
                  variant="apple"
                  size="sm"
                  onClick={() => handleAIImprove("add_emojis")}
                  disabled={isAIImproving}
                  className="h-8 text-xs rounded-xl text-slate-600 hover:text-slate-900"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  <span>Strategic Emojis</span>
                </Button>
              </div>
            </div>

            {/* Footer Actions: Save Draft, Schedule, Publish */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    savePostAsDraft();
                    toast.success("Draft saved successfully!");
                  }}
                  className="h-10 text-xs text-slate-500 hover:text-slate-900 rounded-xl"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Save Draft
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowScheduleModal(true)}
                  className="h-10 text-xs text-slate-700 hover:text-slate-900 rounded-xl"
                >
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Schedule...
                </Button>
              </div>

              <Button
                variant="gradient"
                size="default"
                onClick={handlePublish}
                disabled={isPublishing || !currentContent.trim()}
                className="h-11 px-6 rounded-2xl font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
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
          <div className="glass-panel rounded-3xl p-5 border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={previewPlatform} className="w-5 h-5" />
                <span className="font-bold text-sm text-slate-900">
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
            className="glass-panel rounded-3xl p-6 max-w-md w-full border border-slate-200 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Schedule Cross-Platform Post</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Select Date & Time (Your Local Timezone)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Recommended Peak Audience Slots */}
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-blue-600" />
                  AI Recommended Peak Audience Slots:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setScheduledDate("2026-08-26T15:00")}
                    className="p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-100/80 border border-slate-200 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-emerald-700 block">Tomorrow 3:00 PM</span>
                    <span className="text-[10px] text-slate-500">🔥 98% Audience Activity</span>
                  </button>
                  <button
                    onClick={() => setScheduledDate("2026-08-27T17:30")}
                    className="p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-100/80 border border-slate-200 text-left transition-all"
                  >
                    <span className="text-xs font-bold text-blue-600 block">Thursday 5:30 PM</span>
                    <span className="text-[10px] text-slate-500">🚀 Peak Engagement Window</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-slate-500"
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
