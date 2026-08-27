"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Platform,
  SocialAccount,
} from "@/lib/types";
import { PLATFORMS } from "@/lib/platforms/constants";
import { PlatformIcon } from "@/components/ui/platform-icons";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  MoreHorizontal,
  ThumbsUp,
  Music2,
  BadgeCheck,
  Smartphone,
  Monitor,
  Tablet,
  Sun,
  Moon,
  Volume2,
  Play,
  Send,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlatformPreviewsProps {
  platform: Platform;
  content: string;
  mediaUrls?: string[];
  mediaType?: "text" | "image" | "video" | "carousel";
  title?: string;
  firstComment?: string;
  account?: SocialAccount;
  onPlatformChange?: (platform: Platform) => void;
}

export const PlatformPreviews: React.FC<PlatformPreviewsProps> = ({
  platform,
  content,
  mediaUrls = [],
  mediaType = "text",
  title,
  firstComment,
  account,
  onPlatformChange,
}) => {
  const [device, setDevice] = useState<"iphone" | "desktop" | "tablet">("iphone");
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");
  const [expandedText, setExpandedText] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const fallbackAvatar =
    account?.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  const displayName = account?.displayName || "Alex Rivera";
  const username = account?.username || "alexcreator_ai";

  const displayContent = content || "Start drafting your content to see live platform previews...";
  const previewMedia =
    mediaUrls.length > 0
      ? mediaUrls[0]
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="flex flex-col h-full">
      {/* Device & Theme Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/10">
          <Button
            variant={device === "iphone" ? "apple" : "ghost"}
            size="sm"
            onClick={() => setDevice("iphone")}
            className={cn("h-7 px-2 text-xs", device === "iphone" && "bg-white/20 text-white")}
            title="iPhone Preview"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Mobile</span>
          </Button>
          <Button
            variant={device === "desktop" ? "apple" : "ghost"}
            size="sm"
            onClick={() => setDevice("desktop")}
            className={cn("h-7 px-2 text-xs", device === "desktop" && "bg-white/20 text-white")}
            title="Desktop Preview"
          >
            <Monitor className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Desktop</span>
          </Button>
          <Button
            variant={device === "tablet" ? "apple" : "ghost"}
            size="sm"
            onClick={() => setDevice("tablet")}
            className={cn("h-7 px-2 text-xs", device === "tablet" && "bg-white/20 text-white")}
            title="Tablet Preview"
          >
            <Tablet className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Tablet</span>
          </Button>
        </div>

        {/* Theme Preview Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewTheme(previewTheme === "dark" ? "light" : "dark")}
            className="h-7 px-2.5 text-xs text-zinc-300 hover:text-white"
            title="Toggle Light/Dark Preview"
          >
            {previewTheme === "dark" ? (
              <>
                <Moon className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                <span className="text-xs">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span className="text-xs">Light</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview Outer Container with Realistic Device Shell */}
      <div className="flex-1 flex items-center justify-center py-2 px-1 overflow-y-auto">
        <motion.div
          layout
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "transition-all duration-300 relative",
            device === "iphone"
              ? "w-full max-w-[380px] rounded-[48px] p-3 shadow-2xl border-[6px] border-zinc-800 bg-black ring-1 ring-white/20"
              : device === "tablet"
              ? "w-full max-w-[540px] rounded-[36px] p-3 shadow-2xl border-[6px] border-zinc-800 bg-black ring-1 ring-white/20"
              : "w-full max-w-[620px] rounded-2xl shadow-2xl border border-white/15 bg-zinc-950 p-2"
          )}
        >
          {/* iPhone Dynamic Island */}
          {device === "iphone" && (
            <div className="w-28 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center gap-2 border border-zinc-900 shadow-inner z-20">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              <div className="w-2 h-2 rounded-full bg-blue-950/80 border border-blue-500/30" />
            </div>
          )}

          {/* Screen Display Area */}
          <div
            className={cn(
              "rounded-[32px] overflow-hidden transition-colors max-h-[640px] overflow-y-auto no-scrollbar",
              previewTheme === "dark" ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"
            )}
          >
            {/* PLATFORM 1: INSTAGRAM */}
            {platform === "instagram" && (
              <div className="text-xs">
                {/* IG Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={fallbackAvatar}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-gradient-to-tr ring-rose-500"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-[13px]">{username}</span>
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                      </div>
                      <span className="text-[10px] text-zinc-400">Original audio • 1h</span>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-zinc-400 cursor-pointer" />
                </div>

                {/* IG Media */}
                <div className="relative aspect-square bg-zinc-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={previewMedia}
                    alt="Post visual"
                    className="w-full h-full object-cover"
                  />
                  {mediaType === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                        <Play className="w-5 h-5 ml-1 fill-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full">
                    1/3
                  </div>
                </div>

                {/* IG Action Bar */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Heart
                        onClick={() => setLiked(!liked)}
                        className={cn(
                          "w-5 h-5 cursor-pointer transition-colors",
                          liked ? "text-rose-500 fill-rose-500" : "hover:text-rose-400"
                        )}
                      />
                      <MessageCircle className="w-5 h-5 cursor-pointer hover:text-indigo-400" />
                      <Send className="w-5 h-5 cursor-pointer hover:text-indigo-400" />
                    </div>
                    <Bookmark
                      onClick={() => setBookmarked(!bookmarked)}
                      className={cn(
                        "w-5 h-5 cursor-pointer transition-colors",
                        bookmarked ? "text-amber-400 fill-amber-400" : "hover:text-zinc-400"
                      )}
                    />
                  </div>

                  {/* Likes count */}
                  <div className="font-semibold text-xs mb-1">
                    {liked ? "2,401 likes" : "2,400 likes"}
                  </div>

                  {/* Caption with See More */}
                  <div className="leading-relaxed text-[12px] whitespace-pre-wrap">
                    <span className="font-semibold mr-1.5">{username}</span>
                    {expandedText ? displayContent : displayContent.slice(0, 110)}
                    {displayContent.length > 110 && !expandedText && (
                      <button
                        onClick={() => setExpandedText(true)}
                        className="text-zinc-500 hover:text-zinc-300 ml-1 font-medium"
                      >
                        ...more
                      </button>
                    )}
                  </div>

                  {/* First Comment Preview */}
                  {firstComment && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] bg-white/[0.02] p-2 rounded-xl">
                      <span className="font-semibold text-indigo-400 mr-1.5">{username}</span>
                      <span className="text-zinc-300">{firstComment}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 uppercase mt-2">2 HOURS AGO</div>
                </div>
              </div>
            )}

            {/* PLATFORM 2: TIKTOK */}
            {platform === "tiktok" && (
              <div className="relative aspect-[9/16] bg-zinc-900 rounded-[28px] overflow-hidden flex flex-col justify-between text-white">
                <img
                  src={previewMedia}
                  alt="TikTok Visual"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

                {/* Top Bar */}
                <div className="relative z-10 flex items-center justify-center gap-6 pt-4 text-xs font-semibold">
                  <span className="text-white/60">Following</span>
                  <span className="text-white border-b-2 border-white pb-0.5">For You</span>
                </div>

                {/* Right Side Interaction Bar */}
                <div className="relative z-10 self-end mr-3 mb-16 flex flex-col items-center gap-4 text-center">
                  <div className="relative mb-2">
                    <img
                      src={fallbackAvatar}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      alt={displayName}
                    />
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                      +
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => setLiked(!liked)}
                      className={cn(
                        "w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center cursor-pointer",
                        liked ? "text-rose-500" : "text-white"
                      )}
                    >
                      <Heart className={cn("w-6 h-6", liked && "fill-rose-500")} />
                    </div>
                    <span className="text-[10px] mt-1 font-semibold">89.4K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white cursor-pointer">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] mt-1 font-semibold">1,240</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => setBookmarked(!bookmarked)}
                      className={cn(
                        "w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center cursor-pointer",
                        bookmarked ? "text-amber-400" : "text-white"
                      )}
                    >
                      <Bookmark className={cn("w-6 h-6", bookmarked && "fill-amber-400")} />
                    </div>
                    <span className="text-[10px] mt-1 font-semibold">18.2K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white cursor-pointer">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] mt-1 font-semibold">Share</span>
                  </div>

                  {/* Spinning Vinyl */}
                  <div className="w-9 h-9 rounded-full bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center animate-spin">
                    <Music2 className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

                {/* Bottom Caption Info */}
                <div className="relative z-10 p-4 pb-5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="font-bold text-sm">@{username}</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  </div>
                  <p className="text-xs text-white/95 leading-snug line-clamp-3 mb-2 font-medium drop-shadow-sm">
                    {displayContent}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-white/80">
                    <Music2 className="w-3.5 h-3.5" />
                    <span className="truncate">Original Sound - Alex Rivera HQ • Trending Beat</span>
                  </div>
                </div>
              </div>
            )}

            {/* PLATFORM 3: X (TWITTER) */}
            {platform === "twitter" && (
              <div className="p-4 text-xs">
                {/* Tweet Post */}
                <div className="flex gap-3">
                  <img
                    src={fallbackAvatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[13px]">{displayName}</span>
                        <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400" />
                        <span className="text-zinc-500">@{username}</span>
                        <span className="text-zinc-500">· 2h</span>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-zinc-500 cursor-pointer" />
                    </div>

                    {/* Content */}
                    <div className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                      {displayContent}
                    </div>

                    {/* Media */}
                    {mediaUrls.length > 0 && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 max-h-64">
                        <img
                          src={mediaUrls[0]}
                          alt="Attachment"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Metrics Bar */}
                    <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-white/5 text-zinc-500">
                      <div className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-[11px]">48</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-emerald-400 cursor-pointer transition-colors">
                        <Repeat2 className="w-4 h-4" />
                        <span className="text-[11px]">182</span>
                      </div>
                      <div
                        onClick={() => setLiked(!liked)}
                        className={cn(
                          "flex items-center gap-1.5 cursor-pointer transition-colors",
                          liked ? "text-rose-500" : "hover:text-rose-400"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", liked && "fill-rose-500")} />
                        <span className="text-[11px]">{liked ? "1.4K" : "1.3K"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                        <Eye className="w-4 h-4" />
                        <span className="text-[11px]">34.2K</span>
                      </div>
                      <div
                        onClick={() => setBookmarked(!bookmarked)}
                        className={cn(
                          "flex items-center gap-1.5 cursor-pointer transition-colors",
                          bookmarked ? "text-amber-400" : "hover:text-amber-300"
                        )}
                      >
                        <Bookmark className={cn("w-4 h-4", bookmarked && "fill-amber-400")} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PLATFORM 4: LINKEDIN */}
            {platform === "linkedin" && (
              <div className="p-4 text-xs">
                {/* LinkedIn Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2.5">
                    <img
                      src={fallbackAvatar}
                      alt={displayName}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[13px]">{displayName}</span>
                        <span className="text-zinc-500 text-[10px]">· 1st</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-1">
                        Founder @ ViralFlow | Scaling Organic Growth Engines | AI Architecture
                      </p>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        3h · 🌐
                      </span>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-zinc-400 cursor-pointer" />
                </div>

                {/* Content */}
                <div className="leading-relaxed text-[12.5px] whitespace-pre-wrap mb-3">
                  {expandedText ? displayContent : displayContent.slice(0, 160)}
                  {displayContent.length > 160 && !expandedText && (
                    <button
                      onClick={() => setExpandedText(true)}
                      className="text-indigo-400 hover:underline font-semibold ml-1"
                    >
                      ...see more
                    </button>
                  )}
                </div>

                {/* Media Image */}
                {mediaUrls.length > 0 && (
                  <div className="rounded-xl overflow-hidden mb-3 border border-white/10 max-h-60">
                    <img
                      src={mediaUrls[0]}
                      alt="LinkedIn Visual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* First Comment Tag */}
                {firstComment && (
                  <div className="mb-3 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200">
                    <span className="font-semibold">Author Pinned Comment:</span> {firstComment}
                  </div>
                )}

                {/* Reactions Count */}
                <div className="flex items-center justify-between py-2 border-b border-white/5 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1">
                    <span className="flex -space-x-1">
                      <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">
                        👍
                      </span>
                      <span className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-[8px] text-white">
                        ❤️
                      </span>
                      <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white">
                        💡
                      </span>
                    </span>
                    <span className="ml-1 font-medium">582 reactions</span>
                  </div>
                  <span>92 comments · 24 reposts</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 text-zinc-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLiked(!liked)}
                    className={cn("h-8 text-[11px]", liked && "text-blue-500")}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[11px]">
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[11px]">
                    <Repeat2 className="w-3.5 h-3.5 mr-1" />
                    Repost
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[11px]">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            )}

            {/* PLATFORM 5: THREADS */}
            {platform === "threads" && (
              <div className="p-4 text-xs">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <img
                      src={fallbackAvatar}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="w-0.5 flex-1 bg-zinc-800 my-1 rounded-full" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[13px]">{username}</span>
                        <span className="text-zinc-500 text-[10px]">1h</span>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-zinc-500 cursor-pointer" />
                    </div>

                    <div className="mt-1 text-[12.5px] leading-relaxed whitespace-pre-wrap">
                      {displayContent}
                    </div>

                    {mediaUrls.length > 0 && (
                      <div className="mt-2.5 rounded-2xl overflow-hidden border border-white/10 max-h-56">
                        <img
                          src={mediaUrls[0]}
                          alt="Attachment"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-zinc-400">
                      <Heart
                        onClick={() => setLiked(!liked)}
                        className={cn(
                          "w-4 h-4 cursor-pointer",
                          liked ? "text-rose-500 fill-rose-500" : "hover:text-white"
                        )}
                      />
                      <MessageCircle className="w-4 h-4 cursor-pointer hover:text-white" />
                      <Repeat2 className="w-4 h-4 cursor-pointer hover:text-white" />
                      <Send className="w-4 h-4 cursor-pointer hover:text-white" />
                    </div>

                    <div className="mt-2 text-[10px] text-zinc-500">
                      34 replies · 190 likes
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PLATFORM 6: YOUTUBE SHORTS */}
            {platform === "youtube" && (
              <div className="relative aspect-[9/16] bg-zinc-900 rounded-[28px] overflow-hidden flex flex-col justify-between text-white">
                <img
                  src={previewMedia}
                  alt="YouTube Shorts"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

                <div className="relative z-10 flex items-center justify-between p-4">
                  <span className="text-xs font-bold tracking-wider text-rose-500 flex items-center gap-1">
                    <PlatformIcon platform="youtube" className="w-4 h-4 text-red-500" />
                    Shorts
                  </span>
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </div>

                <div className="relative z-10 self-end mr-3 mb-14 flex flex-col items-center gap-5 text-center">
                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => setLiked(!liked)}
                      className={cn(
                        "w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center cursor-pointer",
                        liked ? "text-red-500" : "text-white"
                      )}
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] mt-1 font-semibold">14K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white cursor-pointer">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] mt-1 font-semibold">410</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white cursor-pointer">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] mt-1 font-semibold">Share</span>
                  </div>
                </div>

                <div className="relative z-10 p-4 pb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={fallbackAvatar}
                      className="w-8 h-8 rounded-full object-cover border border-white"
                      alt={displayName}
                    />
                    <span className="font-semibold text-xs text-white">@{username}</span>
                    <Button
                      size="sm"
                      className="h-6 px-2.5 text-[10px] font-bold bg-white text-black hover:bg-zinc-200 rounded-full ml-1"
                    >
                      Subscribe
                    </Button>
                  </div>
                  <h4 className="font-bold text-xs text-white drop-shadow-sm mb-1 line-clamp-2">
                    {title || "10x Creator Distribution Framework #Shorts"}
                  </h4>
                  <p className="text-[11px] text-zinc-300 line-clamp-2 leading-tight">
                    {displayContent}
                  </p>
                </div>
              </div>
            )}

            {/* PLATFORM 7: FACEBOOK */}
            {platform === "facebook" && (
              <div className="p-4 text-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={fallbackAvatar}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <span className="font-bold text-[13px]">{displayName}</span>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                        4 hrs · 👥 Public
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-zinc-400 cursor-pointer" />
                </div>

                <div className="leading-relaxed text-[12.5px] whitespace-pre-wrap mb-3">
                  {displayContent}
                </div>

                {mediaUrls.length > 0 && (
                  <div className="rounded-xl overflow-hidden mb-3 border border-white/10 max-h-60">
                    <img
                      src={mediaUrls[0]}
                      alt="Facebook visual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-y border-white/5 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center">
                      👍
                    </span>
                    140 likes
                  </span>
                  <span>22 comments · 8 shares</span>
                </div>

                <div className="flex items-center justify-between pt-2 text-zinc-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLiked(!liked)}
                    className={cn("h-8 text-[11px]", liked && "text-blue-500")}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[11px]">
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[11px]">
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
