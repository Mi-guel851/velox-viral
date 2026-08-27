"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Wand2,
  Flame,
  Hash,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
  MessageSquare,
  Scissors,
  PlusCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Platform } from "@/lib/types";
import { AIService, CaptionVariation } from "@/lib/ai/ai-service";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const QUICK_TOPICS = [
  "Why 99% fail at distribution",
  "5 AI tools saving 20h/week",
  "How we scaled to $10k MRR",
  "The biggest myth in solo business",
  "Prompt engineering is dead",
  "The 1-to-7 content flywheel",
];

const TONES = [
  { id: "provocative", label: "🔥 Provocative & Viral", desc: "High emotional tension & contrarian hooks" },
  { id: "storytelling", label: "📖 Narrative & Story", desc: "Zero-to-one transformation arc" },
  { id: "professional", label: "💼 Thought Leadership", desc: "Actionable frameworks & key metrics" },
  { id: "casual", label: "☕ Casual & Relatable", desc: "Authentic, conversational tone" },
  { id: "urgency", label: "⚡ High Urgency & FOMO", desc: "Time-sensitive warnings & secrets" },
];

export const AICaptionStudio: React.FC = () => {
  const { setComposerContent, setActiveTab, setPreviewPlatform } = useAppStore();
  const [topic, setTopic] = useState("Why 99% of creators fail at distribution in 2026");
  const [selectedTone, setSelectedTone] = useState<any>("provocative");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("twitter");
  const [selectedLength, setSelectedLength] = useState<"short" | "medium" | "long" | "thread">("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<CaptionVariation[]>([]);
  const [generatedHooks, setGeneratedHooks] = useState<{ hook: string; score: number; category: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerateVariations = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or concept");
      return;
    }

    setIsGenerating(true);
    try {
      const results = await AIService.generateCaptions({
        topic,
        platform: selectedPlatform,
        tone: selectedTone,
        length: selectedLength,
      });
      setVariations(results);
      toast.success("Generated 3 high-converting viral variations!");
    } catch (err) {
      toast.error("Failed to generate captions. Using offline fallback.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHooks = async () => {
    setIsGenerating(true);
    try {
      const hooks = await AIService.generateHooks(topic);
      setGeneratedHooks(hooks);
      toast.success("Generated 5 viral hook formulas!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseInComposer = (content: string, platform: Platform = selectedPlatform) => {
    setComposerContent(content);
    setPreviewPlatform(platform);
    setActiveTab("composer");
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
    toast.success("Loaded into Multi-Platform Composer!");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Prompt & Variation Studio
            </span>
            <Badge variant="success">Ultra Low Latency</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI Viral Caption Studio
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Engineer high-converting social copy with psychological hooks, algorithmic formatting, and multi-model variations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateVariations}
            disabled={isGenerating}
            variant="gradient"
            className="h-11 px-5 rounded-2xl shadow-lg flex items-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            <span>Generate Variations</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-1 space-y-5">
          {/* Topic & Idea Card */}
          <div className="glass-card rounded-3xl p-5 space-y-4 border border-white/10">
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Topic or Master Idea
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g. Why most founders struggle with distribution and how to fix it..."
                rows={3}
                className="w-full rounded-2xl bg-zinc-950/70 border border-white/10 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            {/* Quick Prompts Chips */}
            <div>
              <span className="text-[11px] font-medium text-zinc-400 block mb-2">
                Quick Inspiration Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white transition-all text-left"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Focus */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                Target Algorithm
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["twitter", "linkedin", "instagram", "tiktok"] as Platform[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={cn(
                      "p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all text-xs font-medium",
                      selectedPlatform === p
                        ? "bg-indigo-600/30 border-indigo-500 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    <PlatformIcon platform={p} className="w-4 h-4" />
                    <span className="capitalize text-[10px]">{p}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                Psychological Tone
              </label>
              <div className="space-y-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTone(t.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border transition-all flex flex-col",
                      selectedTone === t.id
                        ? "bg-white/10 border-indigo-400 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                    )}
                  >
                    <span className="text-xs font-semibold text-zinc-200">{t.label}</span>
                    <span className="text-[10px] text-zinc-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hook Generator Shortcut */}
            <div className="pt-2 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateHooks}
                disabled={isGenerating}
                className="w-full rounded-xl text-xs flex items-center justify-center gap-2 border-dashed border-white/20 hover:border-indigo-400"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Generate 5 Viral Opening Hooks</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Variations & Hooks Stream */}
        <div className="lg:col-span-2 space-y-6">
          {/* Generated Hooks Carousel */}
          {generatedHooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-zinc-900/60 to-transparent"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Curated Viral Opening Hooks</span>
                </div>
                <Badge variant="warning">Top 5 Formulas</Badge>
              </div>

              <div className="space-y-2">
                {generatedHooks.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-start justify-between gap-3 group hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                          {h.category}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          ⚡ {h.score}% Viral Potential
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                        &ldquo;{h.hook}&rdquo;
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseInComposer(h.hook)}
                      className="h-8 px-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 shrink-0"
                    >
                      <span>Use Hook</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Variations Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {variations.length > 0 ? "Multi-Angle Generated Variations" : "Recommended Starter Formats"}
              </h3>
              {variations.length > 0 && (
                <span className="text-xs text-zinc-400">3 Variations Generated</span>
              )}
            </div>

            {variations.length === 0 ? (
              <div className="glass-panel rounded-3xl p-10 text-center border border-white/10">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4 animate-pulse">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-semibold text-white">Generate 3 High-Impact Angles</h4>
                <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1 mb-6">
                  Select your topic and tone on the left, then click &ldquo;Generate Variations&rdquo; to produce instant viral copy tailored to algorithms.
                </p>
                <Button
                  onClick={handleGenerateVariations}
                  variant="gradient"
                  className="rounded-2xl px-6 h-11"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Viral Angles Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {variations.map((v) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{v.title}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/10 text-zinc-300 font-medium">
                          {v.tone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={v.viralScore >= 95 ? "success" : "default"}>
                          ⚡ {v.viralScore}/100 Score
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {v.content}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {v.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(v.content, v.id)}
                          className="h-8 px-2.5 text-xs text-zinc-400 hover:text-white"
                        >
                          {copiedId === v.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="apple"
                          size="sm"
                          onClick={() => handleUseInComposer(v.content)}
                          className="h-8 px-3.5 text-xs font-semibold rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-white"
                        >
                          <span>Use in Composer</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
