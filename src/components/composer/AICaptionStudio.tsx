"use client";

import React, { useState, useRef, useCallback } from "react";
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
  Upload,
  Image as ImageIcon,
  X,
  Camera,
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>("image/jpeg");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setUploadedImage(base64);
      setUploadedMimeType(file.type);
      toast.success("Image uploaded! Click \"Generate from Image\" to create captions.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleGenerateFromImage = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setIsAnalyzingImage(true);
    setIsGenerating(true);
    try {
      const result = await AIService.generateFromImage(
        uploadedImage,
        uploadedMimeType,
        {
          topic,
          platform: selectedPlatform,
          tone: selectedTone,
        }
      );
      setVariations(result.captions);
      toast.success(`Image analyzed! Generated ${result.captions.length} captions based on your photo.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze image. Check your AI provider settings.");
    } finally {
      setIsAnalyzingImage(false);
      setIsGenerating(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel relative overflow-hidden border border-slate-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-700 border border-blue-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              AI Prompt & Variation Studio
            </span>
            <Badge variant="success">Ultra Low Latency</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            AI Viral Caption Studio
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
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
          <div className="glass-card rounded-3xl p-5 space-y-4 border border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                Topic or Master Idea
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g. Why most founders struggle with distribution and how to fix it..."
                rows={3}
                className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>

            {/* Quick Prompts Chips */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-2">
                Quick Inspiration Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-slate-100/80 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all text-left"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Focus */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
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
                        ? "bg-blue-600/30 border-blue-500 text-slate-900 shadow-sm"
                        : "bg-slate-100/80 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
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
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
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
                        ? "bg-slate-100/80 border-blue-400 text-slate-900 shadow-sm"
                        : "bg-slate-100/80 border-slate-200 text-slate-500 hover:bg-slate-100/80 hover:text-slate-700"
                    )}
                  >
                    <span className="text-xs font-semibold text-slate-700">{t.label}</span>
                    <span className="text-[10px] text-slate-500">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload for AI Analysis */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                Generate from Image
              </label>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Upload a photo and AI will analyze it to create captions. The image is only analyzed temporarily and never stored.
              </p>

              {uploadedImage ? (
                <div className="relative">
                  <div className="w-full h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={`data:${uploadedMimeType};base64,${uploadedImage}`}
                      alt="Uploaded for analysis"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-black/70 text-slate-900 rounded-full p-1 hover:bg-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={handleGenerateFromImage}
                    disabled={isGenerating || isAnalyzingImage}
                    className="w-full mt-2 h-9 rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    {isAnalyzingImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isAnalyzingImage ? "Analyzing Image..." : "Generate Captions from Image"}</span>
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()
                  }
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400/50 bg-slate-100/80 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2 text-slate-500 hover:text-blue-700"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-medium">Click to upload an image</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WebP up to 10MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Hook Generator Shortcut */}
            <div className="pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateHooks}
                disabled={isGenerating}
                className="w-full rounded-xl text-xs flex items-center justify-center gap-2 border-dashed border-slate-200 hover:border-blue-400"
              >
                <Flame className="w-3.5 h-3.5 text-blue-600" />
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
              className="glass-card rounded-3xl p-5 border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-zinc-900/60 to-transparent"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900">Curated Viral Opening Hooks</span>
                </div>
                <Badge variant="warning">Top 5 Formulas</Badge>
              </div>

              <div className="space-y-2">
                {generatedHooks.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-black/40 border border-slate-200 flex items-start justify-between gap-3 group hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 font-semibold">
                          {h.category}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          ⚡ {h.score}% Viral Potential
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        &ldquo;{h.hook}&rdquo;
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseInComposer(h.hook)}
                      className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-400/10 shrink-0"
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
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                {variations.length > 0 ? "Multi-Angle Generated Variations" : "Recommended Starter Formats"}
              </h3>
              {variations.length > 0 && (
                <span className="text-xs text-slate-500">3 Variations Generated</span>
              )}
            </div>

            {variations.length === 0 ? (
              <div className="glass-panel rounded-3xl p-10 text-center border border-slate-200">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mx-auto mb-4 animate-pulse">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900">Generate 3 High-Impact Angles</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
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
                    className="glass-card rounded-3xl p-5 border border-slate-200 hover:border-slate-200 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{v.title}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100/80 text-slate-600 font-medium">
                          {v.tone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={v.viralScore >= 95 ? "success" : "default"}>
                          ⚡ {v.viralScore}/100 Score
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {v.content}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {v.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg"
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
                          className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900"
                        >
                          {copiedId === v.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="apple"
                          size="sm"
                          onClick={() => handleUseInComposer(v.content)}
                          className="h-8 px-3.5 text-xs font-semibold rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border-blue-500/40 text-slate-900"
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
