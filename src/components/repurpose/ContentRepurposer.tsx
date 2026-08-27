"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Repeat2,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Flame,
  FileText,
  Link as LinkIcon,
  Video,
  Mic,
  Send,
  Wand2,
  Download,
  Share2,
} from "lucide-react";
import { Platform, ContentRepurposeItem } from "@/lib/types";
import { AIService } from "@/lib/ai/ai-service";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { PLATFORMS } from "@/lib/platforms/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const SAMPLE_PRESETS = [
  {
    title: "The Solo Founder Multi-Platform System",
    type: "notes" as const,
    text: "Building a scalable media business in 2026 requires distribution leverage. Most people spend 40 hours creating and 2 hours distributing. Flip the ratio: 20% creation, 80% distribution. Record 1 master high-density video, then extract 3 short form hooks for TikTok/Shorts/Reels, write a structured LinkedIn framework post, build a 5-tweet X thread, and start a discussion on Threads. Automate the cross-posting and analytics.",
  },
  {
    title: "Why AI Agents Will Replace Prompt Engineering",
    type: "blog" as const,
    text: "Prompt engineering was the bridge between naive LLMs and actionable outputs. In 2026, autonomous agent loops with tool calling, memory stores, and self-correcting validation pipelines render single-shot prompting obsolete. Creators and founders who build autonomous agentic workflows will achieve 100x leverage over manual operators.",
  },
  {
    title: "10 Lessons from $0 to $1M ARR Without Funding",
    type: "transcript" as const,
    text: "1. Build in public to generate organic inbound momentum. 2. Charge from day one; free users give terrible feedback. 3. Distribution beats features every single time. 4. Double down on what retains. 5. Document systems early so you can scale without hiring bloated teams.",
  },
];

export const ContentRepurposer: React.FC = () => {
  const {
    repurpose,
    setRepurposeSourceText,
    setRepurposeSourceType,
    setRepurposeResults,
    setRepurposingState,
    setComposerContent,
    setPlatformOverrideContent,
    setTargetPlatforms,
    setActiveTab,
    setPreviewPlatform,
  } = useAppStore();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleRepurpose = async () => {
    if (!repurpose.sourceText.trim()) {
      toast.error("Please provide source text or choose a preset.");
      return;
    }

    setRepurposingState(true);
    try {
      const results = await AIService.repurposeContent(
        repurpose.sourceText,
        repurpose.sourceType
      );
      setRepurposeResults(results);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success("Successfully repurposed into 7 tailored native formats!");
    } catch (e) {
      toast.error("Repurposing failed. Please try again.");
    } finally {
      setRepurposingState(false);
    }
  };

  const handleLoadSinglePlatformIntoComposer = (item: ContentRepurposeItem) => {
    setComposerContent(item.content);
    setPreviewPlatform(item.platform);
    setTargetPlatforms([item.platform]);
    setActiveTab("composer");
    toast.success(`Loaded ${PLATFORMS[item.platform]?.name} format into Composer!`);
  };

  const handleLoadAllIntoComposer = () => {
    if (repurpose.results.length === 0) return;

    // Use X or LinkedIn as default master
    const defaultItem =
      repurpose.results.find((r) => r.platform === "twitter") ||
      repurpose.results[0];

    setComposerContent(defaultItem.content);

    // Populate platform overrides for all 7 platforms
    for (const item of repurpose.results) {
      setPlatformOverrideContent(item.platform, item.content);
    }

    setTargetPlatforms(repurpose.results.map((r) => r.platform));
    setActiveTab("composer");
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    toast.success("Loaded all 7 tailored formats into Multi-Platform Composer!");
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Repurposer Header */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Repeat2 className="w-3.5 h-3.5 text-purple-400" />
              1-to-7 Content Flywheel Engine
            </span>
            <Badge variant="cyan">Multi-Format Adapter</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI Content Repurposer
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Input a single blog post, YouTube transcript, podcast notes, or raw voice memo. ViralFlow automatically translates it into 7 platform-native viral formats.
          </p>
        </div>

        {repurpose.results.length > 0 && (
          <Button
            onClick={handleLoadAllIntoComposer}
            variant="gradient"
            className="h-11 px-6 rounded-2xl font-semibold shadow-lg shrink-0"
          >
            <Send className="w-4 h-4 mr-2" />
            Load All 7 to Composer
          </Button>
        )}
      </div>

      {/* Input Source & Presets */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Source Type Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-2xl border border-white/10">
            {[
              { id: "notes", label: "Raw Notes / Thoughts", icon: FileText },
              { id: "blog", label: "Blog / Article", icon: LinkIcon },
              { id: "transcript", label: "Video Transcript", icon: Video },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setRepurposeSourceType(t.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all",
                  repurpose.sourceType === t.id
                    ? "bg-white/20 text-white shadow-sm border border-white/15"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-zinc-500 mr-1 shrink-0">Sample Presets:</span>
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.title}
                onClick={() => {
                  setRepurposeSourceText(p.text);
                  setRepurposeSourceType(p.type);
                }}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-all shrink-0"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={repurpose.sourceText}
          onChange={(e) => setRepurposeSourceText(e.target.value)}
          placeholder="Paste your long-form article, raw thoughts, video script, or meeting notes here..."
          rows={6}
          className="w-full rounded-2xl bg-zinc-950/80 border border-white/10 p-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-500">
            {repurpose.sourceText.length} characters entered
          </span>
          <Button
            onClick={handleRepurpose}
            disabled={repurpose.isProcessing || !repurpose.sourceText.trim()}
            variant="gradient"
            className="h-11 px-6 rounded-2xl shadow-lg flex items-center gap-2"
          >
            {repurpose.isProcessing ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            <span>Repurpose into 7 Platforms</span>
          </Button>
        </div>
      </div>

      {/* Repurposed Results Grid */}
      {repurpose.results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Tailored 7-Platform Outputs
            </h3>
            <span className="text-xs text-zinc-400">
              Ready to schedule or copy per channel
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {repurpose.results.map((item, idx) => {
              const pConf = PLATFORMS[item.platform];
              return (
                <motion.div
                  key={item.platform}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Platform Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={item.platform} className="w-5 h-5" />
                        <div>
                          <h4 className="font-bold text-sm text-white">{pConf?.name}</h4>
                          <span className="text-[10px] text-zinc-400">{item.formatType}</span>
                        </div>
                      </div>
                      <Badge variant="purple" className="text-[10px]">
                        {item.platform === "twitter" ? "Viral Thread" : "Native Format"}
                      </Badge>
                    </div>

                    {/* Viral Angle Note */}
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200">
                      <span className="font-semibold">Strategy:</span> {item.viralAngle}
                    </div>

                    {/* Content Preview */}
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/5 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto no-scrollbar">
                      {item.content}
                    </div>

                    {/* Media Prompt if available */}
                    {item.mediaPrompt && (
                      <div className="text-[11px] text-zinc-400 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                        <span className="text-cyan-400 font-semibold">🎨 Media Prompt:</span>{" "}
                        {item.mediaPrompt}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.content, idx)}
                      className="h-8 px-2.5 text-xs text-zinc-400 hover:text-white"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span>Copy</span>
                    </Button>

                    <Button
                      variant="apple"
                      size="sm"
                      onClick={() => handleLoadSinglePlatformIntoComposer(item)}
                      className="h-8 px-3 text-xs font-semibold text-white bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/30 rounded-xl"
                    >
                      <span>Composer</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
