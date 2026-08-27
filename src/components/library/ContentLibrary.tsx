"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Flame,
  FileText,
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Layers,
  Wand2,
  X,
} from "lucide-react";
import { Platform, ContentTemplate, ViralHook } from "@/lib/types";
import { PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export const ContentLibrary: React.FC = () => {
  const {
    templates,
    hooks,
    saveTemplate,
    deleteTemplate,
    setComposerContent,
    setPreviewPlatform,
    setActiveTab,
  } = useAppStore();

  const [activeTab, setActiveTabState] = useState<"hooks" | "templates" | "media">("hooks");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New template form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPlatform, setNewPlatform] = useState<Platform | "all">("all");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("General");

  // Filter hooks
  const filteredHooks = hooks.filter((h) => {
    if (selectedNiche !== "all" && h.niche !== selectedNiche) return false;
    if (selectedCategory !== "all" && h.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !h.template.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !h.example.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleUseHook = (hookExample: string) => {
    setComposerContent(hookExample);
    setActiveTab("composer");
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
    toast.success("Hook inserted into Composer!");
  };

  const handleUseTemplate = (t: ContentTemplate) => {
    setComposerContent(t.content);
    if (t.platform !== "all") {
      setPreviewPlatform(t.platform);
    }
    setActiveTab("composer");
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
    toast.success(`Template "${t.title}" loaded into Composer!`);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTemplate = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please provide a title and content for the template");
      return;
    }

    saveTemplate({
      title: newTitle,
      description: newDesc,
      platform: newPlatform,
      category: newCategory,
      content: newContent,
      tags: [newCategory],
    });

    toast.success("New template saved to library!");
    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewContent("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Library Header */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Creator Knowledge Bank
            </span>
            <Badge variant="purple">50+ Viral Formulas</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Content Library & Viral Hook Bank
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Battle-tested hooks, frameworks, multi-platform templates, and high-converting copy formulas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="gradient"
            className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* Tabs Switcher (Hooks vs Templates vs Assets) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-white/10">
          {[
            { id: "hooks", label: "🔥 Viral Hooks Bank (50+)", icon: Flame },
            { id: "templates", label: "📄 Post Templates", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabState(tab.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all",
                activeTab === tab.id
                  ? "bg-white/20 text-white shadow-sm border border-white/15"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formulas, hooks, templates..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950/70 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* VIRAL HOOKS TAB */}
      {activeTab === "hooks" && (
        <div className="space-y-4">
          {/* Niche & Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-zinc-400 font-medium mr-1 shrink-0">Niche:</span>
            {[
              "all",
              "Tech & AI",
              "SaaS & Growth",
              "Personal Brand",
              "Finance & Wealth",
              "Marketing",
            ].map((n) => (
              <button
                key={n}
                onClick={() => setSelectedNiche(n)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-semibold transition-all border shrink-0",
                  selectedNiche === n
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white"
                )}
              >
                {n === "all" ? "All Niches" : n}
              </button>
            ))}
          </div>

          {/* Hooks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHooks.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                        {h.category}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {h.niche}
                      </span>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      ⚡ {h.viralScoreEstimate}% Virality
                    </Badge>
                  </div>

                  {/* Formula Template */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-[11px] text-indigo-300">
                    <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase tracking-wider">
                      Formula Pattern:
                    </span>
                    {h.template}
                  </div>

                  {/* High Converting Example */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-200 leading-relaxed font-sans">
                    <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase tracking-wider font-mono">
                      Live Example:
                    </span>
                    &ldquo;{h.example}&rdquo;
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(h.example, h.id)}
                    className="h-8 px-2.5 text-xs text-zinc-400 hover:text-white"
                  >
                    {copiedId === h.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    <span>Copy</span>
                  </Button>

                  <Button
                    variant="apple"
                    size="sm"
                    onClick={() => handleUseHook(h.example)}
                    className="h-8 px-3 text-xs font-semibold text-white bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/30 rounded-xl"
                  >
                    <span>Use in Composer</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t.platform !== "all" && (
                      <PlatformIcon platform={t.platform} className="w-4 h-4" />
                    )}
                    <h4 className="font-bold text-sm text-white">{t.title}</h4>
                  </div>
                  <Badge variant="purple" className="text-[10px] capitalize">
                    {t.category}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-400">{t.description}</p>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto no-scrollbar font-sans">
                  {t.content}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTemplate(t.id)}
                  className="h-8 text-zinc-500 hover:text-rose-400 text-xs px-2"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(t.content, t.id)}
                    className="h-8 px-2.5 text-xs text-zinc-400 hover:text-white"
                  >
                    {copiedId === t.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => handleUseTemplate(t)}
                    className="h-8 px-3 text-xs font-semibold rounded-xl"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel rounded-3xl p-6 max-w-lg w-full border border-white/15 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base text-white">Create New Custom Template</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. Weekly Teardown Framework"
                  className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief note on how to use this template..."
                  className="w-full rounded-xl bg-zinc-950 border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Content / Prompt Blueprint
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your template structure with [Placeholders]..."
                  rows={5}
                  className="w-full rounded-xl bg-zinc-950 border border-white/10 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleCreateTemplate}
                className="rounded-xl px-4 text-xs font-semibold"
              >
                Save to Library
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
