import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Platform,
  SocialAccount,
  Post,
  ContentTemplate,
  ViralHook,
  AnalyticsSummary,
  WorkspaceSettings,
  ViralScoreBreakdown,
  ContentRepurposeItem,
} from "./types";
import { VIRAL_HOOKS_DATABASE } from "./ai/hooks-database";
import { ViralAnalyzer } from "./ai/viral-analyzer";

interface AppState {
  // Navigation & UI
  activeTab: "dashboard" | "composer" | "studio" | "calendar" | "repurpose" | "library" | "analytics" | "accounts" | "settings";
  sidebarCollapsed: boolean;
  previewPlatform: Platform;
  previewDevice: "iphone" | "desktop" | "tablet";
  previewTheme: "dark" | "light";

  // Data
  accounts: SocialAccount[];
  posts: Post[];
  templates: ContentTemplate[];
  hooks: ViralHook[];
  analytics: AnalyticsSummary;
  settings: WorkspaceSettings;

  // Active Composer State
  composer: {
    id?: string;
    title: string;
    defaultContent: string;
    platformContent: Partial<Record<Platform, string>>;
    firstComment: Partial<Record<Platform, string>>;
    mediaUrls: string[];
    mediaType: "text" | "image" | "video" | "carousel";
    targetPlatforms: Platform[];
    scheduledAt: string | null;
    viralScore?: ViralScoreBreakdown;
    activeOverridePlatform?: Platform;
    isGeneratingAI: boolean;
  };

  // Repurpose Workspace State
  repurpose: {
    sourceText: string;
    sourceType: "notes" | "url" | "transcript" | "blog";
    isProcessing: boolean;
    results: ContentRepurposeItem[];
  };

  // Actions
  setActiveTab: (tab: AppState["activeTab"]) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPreviewPlatform: (platform: Platform) => void;
  setPreviewDevice: (device: "iphone" | "desktop" | "tablet") => void;
  setPreviewTheme: (theme: "dark" | "light") => void;

  // Composer Actions
  setComposerContent: (content: string) => void;
  setComposerTitle: (title: string) => void;
  setPlatformOverrideContent: (platform: Platform, content: string) => void;
  setFirstComment: (platform: Platform, comment: string) => void;
  toggleTargetPlatform: (platform: Platform) => void;
  setTargetPlatforms: (platforms: Platform[]) => void;
  setComposerMedia: (urls: string[], type: "text" | "image" | "video" | "carousel") => void;
  setComposerSchedule: (date: string | null) => void;
  setActiveOverridePlatform: (platform?: Platform) => void;
  analyzeComposerViralScore: () => void;
  applyOptimizedCaption: () => void;
  resetComposer: () => void;
  loadPostIntoComposer: (post: Post) => void;

  // Post Actions
  savePostAsDraft: () => Post;
  schedulePost: (date?: string) => Post;
  publishPostImmediately: (id?: string) => Promise<boolean>;
  deletePost: (id: string) => void;
  reschedulePost: (id: string, newDate: string) => void;

  // Accounts Actions
  connectAccount: (platform: Platform, customHandle?: string) => void;
  disconnectAccount: (id: string) => void;
  refreshAccountSync: (id: string) => void;

  // Repurpose Actions
  setRepurposeSourceText: (text: string) => void;
  setRepurposeSourceType: (type: "notes" | "url" | "transcript" | "blog") => void;
  setRepurposeResults: (results: ContentRepurposeItem[]) => void;
  setRepurposingState: (isProcessing: boolean) => void;

  // Library & Settings Actions
  saveTemplate: (template: Omit<ContentTemplate, "id">) => void;
  deleteTemplate: (id: string) => void;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => void;
}

const INITIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: "acc-1",
    platform: "twitter",
    username: "alexcreator_ai",
    displayName: "Alex Rivera ⚡",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    followerCount: 48200,
    status: "connected",
    lastSync: "Just now",
    tokenExpiresAt: "2026-11-20T00:00:00.000Z",
    permissions: ["tweet.read", "tweet.write", "users.read", "media.write"],
    metrics: { avgLikes: 340, avgComments: 48, engagementRate: 4.8 },
  },
  {
    id: "acc-2",
    platform: "linkedin",
    username: "alex-rivera-growth",
    displayName: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    followerCount: 29400,
    status: "connected",
    lastSync: "10 mins ago",
    tokenExpiresAt: "2026-10-15T00:00:00.000Z",
    permissions: ["w_member_social", "r_liteprofile", "r_emailaddress"],
    metrics: { avgLikes: 580, avgComments: 92, engagementRate: 6.2 },
  },
  {
    id: "acc-3",
    platform: "instagram",
    username: "alexrivera.hq",
    displayName: "Alex | AI & Digital Systems",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    followerCount: 84900,
    status: "connected",
    lastSync: "25 mins ago",
    tokenExpiresAt: "2026-12-01T00:00:00.000Z",
    permissions: ["instagram_basic", "instagram_content_publish", "instagram_manage_comments"],
    metrics: { avgLikes: 2400, avgComments: 210, engagementRate: 5.4 },
  },
  {
    id: "acc-4",
    platform: "tiktok",
    username: "alexrivera_ai",
    displayName: "Alex Rivera | Viral AI",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    followerCount: 142000,
    status: "connected",
    lastSync: "1 hour ago",
    tokenExpiresAt: "2026-09-30T00:00:00.000Z",
    permissions: ["video.publish", "video.upload", "user.info.basic"],
    metrics: { avgLikes: 8900, avgComments: 640, engagementRate: 7.9 },
  },
  {
    id: "acc-5",
    platform: "threads",
    username: "alexrivera.hq",
    displayName: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    followerCount: 19800,
    status: "connected",
    lastSync: "2 hours ago",
    tokenExpiresAt: "2026-11-05T00:00:00.000Z",
    permissions: ["threads_basic", "threads_content_publish"],
    metrics: { avgLikes: 190, avgComments: 34, engagementRate: 3.8 },
  },
  {
    id: "acc-6",
    platform: "youtube",
    username: "AlexRiveraOfficial",
    displayName: "Alex Rivera Tech & AI",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    followerCount: 65200,
    status: "connected",
    lastSync: "Just now",
    tokenExpiresAt: "2026-12-31T00:00:00.000Z",
    permissions: ["https://www.googleapis.com/auth/youtube.upload"],
    metrics: { avgLikes: 3100, avgComments: 410, engagementRate: 8.1 },
  },
  {
    id: "acc-7",
    platform: "facebook",
    username: "alexriverabiz",
    displayName: "Alex Rivera Creator Studio",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    followerCount: 12500,
    status: "connected",
    lastSync: "3 hours ago",
    tokenExpiresAt: "2026-10-10T00:00:00.000Z",
    permissions: ["pages_show_list", "pages_manage_posts"],
    metrics: { avgLikes: 140, avgComments: 22, engagementRate: 2.9 },
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "post-1",
    title: "10x Creator Distribution Framework",
    defaultContent: "Most creators fail not because their content is bad, but because their distribution is broken.\n\nHere is the 1-to-7 multi-platform flywheel I use to generate 2M+ monthly impressions without burning out:\n\n1. 🎯 Record 1 High-Density Core Video\n2. ⚡ Extract 3 Short-Form Video Hooks (TikTok, Reels, Shorts)\n3. 🧵 Convert Core Insights into a 5-Tweet X Thread\n4. 📄 Format Key Framework into a LinkedIn Thought Leadership Carousel\n5. 💬 Post a Contrarian Debate Question on Threads\n\nStop spending 10 hours writing separate posts for every app. Build distribution leverage.\n\n🔖 Save this framework for your next launch.\n💬 What's your #1 distribution channel right now? Drop a comment below 👇",
    platformContent: {
      twitter: "Most creators fail not because their content is bad, but because their distribution is broken.\n\nHere is the 1-to-7 multi-platform flywheel I use to generate 2M+ monthly impressions:\n\n🧵 (1/5)\n\n---\n\n1. 🎯 Record 1 High-Density Core Video\n2. ⚡ Extract 3 Short-Form Hooks (TikTok & Reels)\n3. 🧵 Convert Key Insights into an X Thread\n4. 📄 Format Framework for LinkedIn\n5. 💬 Post Discussion on Threads\n\n---\n\nStop spending 10 hours writing separate posts. Build distribution leverage.\n\n🔖 Bookmark this thread for your next content batch! 👇",
      linkedin: "The biggest bottleneck for ambitious creators isn't ideation. It's distribution.\n\nMost founders spend 8 hours crafting one piece of content, publish it once, and move on.\n\nHere is our 1-to-7 Multi-Platform Flywheel:\n\n📌 1. Create One High-Impact Core Asset\n📌 2. Extract Platform-Native Hooks (Reels / TikTok / Shorts)\n📌 3. Build Formatted LinkedIn Frameworks\n📌 4. Deploy Conversational Threads\n\nWhen you master cross-platform repurposing, consistency becomes effortless.\n\nWhat is your team's biggest challenge with content distribution? Let's discuss in the comments 👇\n\n#Leadership #Productivity #CreatorEconomy #SaaSGrowth",
      instagram: "Stop creating content from scratch for every single platform 🛑\n\nSwipe through to see the exact 1-to-7 Multi-Platform Flywheel that generated over 2,000,000 organic impressions this quarter.\n\nKey Breakdown:\n⚡ Slide 2: The Core Asset Formula\n⚡ Slide 4: High-Retention Short-Form Hooks\n⚡ Slide 7: Algorithmic Scheduling Windows\n\n.\n.\n.\n💬 Double tap if this helped & save this post for your next content day!\n\n#creatorgrowth #contentstrategy #buildinpublic #productivityhacks #viraltips #creatoreconomy",
      tiktok: "🔥 STOP MAKING THIS MISTAKE! If you spend all week creating content for only one platform, you are losing 80% of your audience. Here is the 1-to-7 framework that changes everything! 🚀 #fyp #creatortips #learnontiktok #viralgrowth",
      threads: "Hot take: If you spend 4 hours making a post and only publish it to one platform, you're throwing away 80% of your effort.\n\nMultichannel leverage is the only way to win in 2026.\n\nDo you agree or disagree? 👇",
      youtube: "How I Turn 1 Video Into 7 Viral Posts (Full Flywheel Breakdown) 🚀 #Shorts\n\nStop burning out creating content from scratch! Here is the exact repurposing system top creators use.\n\n🔔 Subscribe for daily creator growth blueprints!",
      facebook: "Hey everyone! Wanted to share our tested 1-to-7 Multi-Platform Flywheel that has helped our team scale reach consistently.\n\nWhat is your biggest roadblock with social scheduling right now? Let's chat in the comments! 👇",
    },
    firstComment: {
      instagram: "Download the complete high-res PDF cheat sheet from the link in our bio! 🚀",
      linkedin: "P.S. We put together a free Notion SOP detailing every step. Link in the comments!",
      youtube: "Drop your questions below and we'll reply to everyone! ⚡",
    },
    mediaUrls: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    ],
    mediaType: "image",
    targetPlatforms: ["twitter", "linkedin", "instagram", "threads", "tiktok", "youtube"],
    status: "scheduled",
    scheduledAt: "2026-08-26T14:30:00.000Z",
    publishedAt: null,
    tags: ["Framework", "Viral Growth", "Strategy"],
    viralScore: {
      overall: 96,
      grade: "S",
      hookScore: 98,
      emotionScore: 92,
      readabilityScore: 95,
      ctaScore: 96,
      platformFitScore: 98,
      hashtagScore: 90,
      highlights: [
        { type: "positive", message: "Curiosity gap opening hook in top 3% of CTR benchmarks." },
        { type: "positive", message: "Clean line breaks and structured mobile skimmability." },
        { type: "positive", message: "High-conversion bookmark and discussion CTA." },
      ],
      improvedVersion: "",
      estimatedReachMultiplier: "4.8x - 7.5x (High Viral Potential)",
    },
    createdAt: "2026-08-25T10:00:00.000Z",
    updatedAt: "2026-08-25T10:00:00.000Z",
  },
  {
    id: "post-2",
    title: "AI Tools That Replaced 40 Hours of Work",
    defaultContent: "I tested 65+ AI productivity tools this year. 90% are useless gimmicks.\n\nHere are the 5 actual tools that save me 40+ hours every single month:\n\n1. ⚡ ViralFlow - AI Multi-Platform Composer & Scheduler\n2. 🧠 Perplexity Pro - Deep research with verifiable citations\n3. 🎙️ Descript - AI video editing via text transcription\n4. 🎨 Midjourney v7 - Ultra-photorealistic marketing assets\n5. 🤖 Claude 3.5 Sonnet - Complex reasoning & code architecture\n\nBookmark this list before you forget 📌\n\nWhich AI tool is non-negotiable in your daily stack? 👇",
    platformContent: {},
    mediaUrls: [
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80",
    ],
    mediaType: "image",
    targetPlatforms: ["twitter", "linkedin", "threads"],
    status: "scheduled",
    scheduledAt: "2026-08-27T17:00:00.000Z",
    publishedAt: null,
    tags: ["AI", "Productivity", "Tools"],
    viralScore: {
      overall: 93,
      grade: "S",
      hookScore: 95,
      emotionScore: 90,
      readabilityScore: 94,
      ctaScore: 92,
      platformFitScore: 95,
      hashtagScore: 88,
      highlights: [
        { type: "positive", message: "Strong negative contrast hook (90% useless vs 5 actual)." },
        { type: "positive", message: "Numbered list with high click-to-save ratio." },
      ],
      improvedVersion: "",
      estimatedReachMultiplier: "3.5x - 5.0x (Strong Reach)",
    },
    createdAt: "2026-08-25T11:30:00.000Z",
    updatedAt: "2026-08-25T11:30:00.000Z",
  },
  {
    id: "post-3",
    title: "The $0 to $100k Solo Business Stack",
    defaultContent: "How to build a $10k/month one-person media business in 2026:\n\n1. Pick 1 Specific Audience Pain\n2. Create 1 High-Value Lead Magnet\n3. Post 2x Daily Using AI Distribution\n4. Collect Emails Relentlessly\n5. Sell 1 High-Ticket Consulting or Digital Offer\n\nZero employees. Zero venture capital. 85% profit margins.\n\nDrop a comment with 'STACK' and I will DM you the step-by-step PDF roadmap! 👇",
    platformContent: {},
    mediaUrls: [],
    mediaType: "text",
    targetPlatforms: ["twitter", "linkedin", "instagram"],
    status: "published",
    scheduledAt: null,
    publishedAt: "2026-08-24T15:00:00.000Z",
    tags: ["Solo Founder", "Business", "Monetization"],
    viralScore: {
      overall: 94,
      grade: "S",
      hookScore: 96,
      emotionScore: 94,
      readabilityScore: 92,
      ctaScore: 98,
      platformFitScore: 92,
      hashtagScore: 85,
      highlights: [
        { type: "positive", message: "Proven lead-generation keyword trigger 'STACK'." },
      ],
      improvedVersion: "",
      estimatedReachMultiplier: "4.2x (Proven Viral)",
    },
    analytics: {
      impressions: 148500,
      reach: 112000,
      likes: 4820,
      comments: 642,
      shares: 890,
      clicks: 1420,
      saves: 2150,
      engagementRate: 6.8,
      viralMultiplier: 4.8,
    },
    createdAt: "2026-08-24T12:00:00.000Z",
    updatedAt: "2026-08-24T15:00:00.000Z",
  },
  {
    id: "post-4",
    title: "Draft: The Architecture of Viral Loops",
    defaultContent: "Viral loops aren't accidental. They are engineered feedback loops.\n\nEvery viral product or creator post has 3 mechanics:\n1. Low threshold to share\n2. High emotional reward for sharing\n3. Value that increases when shared with others.",
    platformContent: {},
    mediaUrls: [],
    mediaType: "text",
    targetPlatforms: ["twitter", "linkedin"],
    status: "draft",
    scheduledAt: null,
    publishedAt: null,
    tags: ["Draft", "Growth"],
    createdAt: "2026-08-25T14:00:00.000Z",
    updatedAt: "2026-08-25T14:00:00.000Z",
  },
];

const INITIAL_TEMPLATES: ContentTemplate[] = [
  {
    id: "tpl-1",
    title: "The 1-to-N Teardown",
    description: "Detailed step-by-step case study with data and lessons",
    platform: "linkedin",
    category: "Case Study",
    tags: ["Growth", "Case Study", "Authority"],
    content: "How [Company/Person] generated [Impressive Result] in [Timeframe]:\n\n(A 4-step teardown you can steal today)\n\n1. The Core Strategy: [Insight]\n2. The Unfair Advantage: [Insight]\n3. The Distribution Engine: [Insight]\n4. The Key Metric: [Insight]\n\n📌 Takeaway: [Summary lesson]\n\nWhat's your biggest challenge with [Topic]? Let's discuss in the comments 👇",
  },
  {
    id: "tpl-2",
    title: "Contrarian Industry Shift",
    description: "Polarizing hook debunking a common practice",
    platform: "twitter",
    category: "Viral Hook",
    tags: ["Viral", "Contrarian", "Thread"],
    content: "99% of people in [Industry] are doing [Topic] backwards.\n\nThey think [Common Belief], but the data reveals [Surprising Truth].\n\nHere are 4 counter-intuitive rules that will 10x your output:\n\n🧵 (1/5)",
  },
  {
    id: "tpl-3",
    title: "High-Retention Carousel Blueprint",
    description: "Swipeable 10-slide visual outline with CTA slide",
    platform: "instagram",
    category: "Carousel",
    tags: ["Carousel", "Visual", "Instagram"],
    content: "Swipe through for the complete cheat sheet ➡️\n\nIf you want to master [Topic] in 2026, bookmark this post.\n\nSlide 1: Hook\nSlide 2-8: Step-by-step execution\nSlide 9: Common pitfalls to avoid\nSlide 10: Save & share reminder\n\n💬 Drop a comment if you want the high-res Notion guide! 👇",
  },
  {
    id: "tpl-4",
    title: "Pattern-Interrupt Video Script",
    description: "60-second high energy short form script for TikTok & Shorts",
    platform: "tiktok",
    category: "Video Script",
    tags: ["TikTok", "Shorts", "Reels"],
    content: "[HOOK - 0:00-0:03]: Stop scrolling! If you are still doing [Topic] like this, you are leaving money on the table.\n\n[BODY - 0:03-0:45]: Here is the 3-step cheat code top creators use...\n\n[CTA - 0:45-0:60]: Follow for daily creator systems! 🚀",
  },
];

const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalFollowers: 401800,
  followerGrowthPercent: 18.4,
  totalImpressions: 2480000,
  totalEngagement: 142300,
  avgEngagementRate: 5.7,
  viralPostsCount: 14,
  bestTimes: [
    { day: "Mon", hour: 9, score: 85 },
    { day: "Mon", hour: 14, score: 92 },
    { day: "Tue", hour: 10, score: 88 },
    { day: "Tue", hour: 15, score: 96 }, // Peak
    { day: "Wed", hour: 11, score: 91 },
    { day: "Wed", hour: 17, score: 98 }, // Peak
    { day: "Thu", hour: 9, score: 89 },
    { day: "Thu", hour: 14, score: 94 },
    { day: "Fri", hour: 10, score: 87 },
    { day: "Fri", hour: 16, score: 95 },
    { day: "Sat", hour: 11, score: 79 },
    { day: "Sun", hour: 18, score: 93 },
  ],
  platformMetrics: {
    instagram: { followers: 84900, engagement: 42000, postsCount: 28, growthRate: 14.2 },
    tiktok: { followers: 142000, engagement: 61000, postsCount: 34, growthRate: 26.5 },
    twitter: { followers: 48200, engagement: 19400, postsCount: 46, growthRate: 16.8 },
    linkedin: { followers: 29400, engagement: 11200, postsCount: 22, growthRate: 21.0 },
    facebook: { followers: 12500, engagement: 2400, postsCount: 14, growthRate: 5.4 },
    threads: { followers: 19800, engagement: 2100, postsCount: 31, growthRate: 19.3 },
    youtube: { followers: 65200, engagement: 4200, postsCount: 18, growthRate: 17.5 },
  },
  historicalData: [
    { date: "Aug 19", impressions: 310000, engagement: 18400, followers: 382000 },
    { date: "Aug 20", impressions: 345000, engagement: 19900, followers: 386500 },
    { date: "Aug 21", impressions: 290000, engagement: 17200, followers: 390100 },
    { date: "Aug 22", impressions: 420000, engagement: 24800, followers: 394200 },
    { date: "Aug 23", impressions: 380000, engagement: 21600, followers: 397800 },
    { date: "Aug 24", impressions: 490000, engagement: 28900, followers: 400100 },
    { date: "Aug 25", impressions: 245000, engagement: 11500, followers: 401800 },
  ],
};

const INITIAL_SETTINGS: WorkspaceSettings = {
  workspaceName: "Alex Rivera HQ",
  timezone: "America/New_York (UTC-4)",
  defaultPlatforms: ["twitter", "linkedin", "instagram", "threads"],
  aiProvider: "builtin",
  aiKeys: {},
  supabaseUrl: "",
  supabaseAnonKey: "",
  autoSchedulePeakTimes: true,
  customWatermarkText: "@alexcreator_ai",
  notifyOnPublish: true,
  theme: "dark",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      activeTab: "dashboard",
      sidebarCollapsed: false,
      previewPlatform: "twitter",
      previewDevice: "iphone",
      previewTheme: "dark",

      // Data
      accounts: INITIAL_ACCOUNTS,
      posts: INITIAL_POSTS,
      templates: INITIAL_TEMPLATES,
      hooks: VIRAL_HOOKS_DATABASE,
      analytics: INITIAL_ANALYTICS,
      settings: INITIAL_SETTINGS,

      // Composer default
      composer: {
        title: "",
        defaultContent: "",
        platformContent: {},
        firstComment: {},
        mediaUrls: [],
        mediaType: "text",
        targetPlatforms: ["twitter", "linkedin", "instagram", "threads"],
        scheduledAt: null,
        viralScore: undefined,
        activeOverridePlatform: undefined,
        isGeneratingAI: false,
      },

      // Repurpose default
      repurpose: {
        sourceText: "",
        sourceType: "notes",
        isProcessing: false,
        results: [],
      },

      // UI Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setPreviewPlatform: (platform) => set({ previewPlatform: platform }),
      setPreviewDevice: (device) => set({ previewDevice: device }),
      setPreviewTheme: (theme) => set({ previewTheme: theme }),

      // Composer Actions
      setComposerContent: (content) => {
        const composer = get().composer;
        const targetPlatform = composer.activeOverridePlatform || composer.targetPlatforms[0] || "twitter";
        const viralScore = ViralAnalyzer.analyze(content, targetPlatform);

        if (composer.activeOverridePlatform) {
          set({
            composer: {
              ...composer,
              platformContent: {
                ...composer.platformContent,
                [composer.activeOverridePlatform]: content,
              },
              viralScore,
            },
          });
        } else {
          set({
            composer: {
              ...composer,
              defaultContent: content,
              viralScore,
            },
          });
        }
      },

      setComposerTitle: (title) =>
        set((state) => ({ composer: { ...state.composer, title } })),

      setPlatformOverrideContent: (platform, content) =>
        set((state) => ({
          composer: {
            ...state.composer,
            platformContent: {
              ...state.composer.platformContent,
              [platform]: content,
            },
          },
        })),

      setFirstComment: (platform, comment) =>
        set((state) => ({
          composer: {
            ...state.composer,
            firstComment: {
              ...state.composer.firstComment,
              [platform]: comment,
            },
          },
        })),

      toggleTargetPlatform: (platform) => {
        const composer = get().composer;
        const exists = composer.targetPlatforms.includes(platform);
        const newTargets = exists
          ? composer.targetPlatforms.filter((p) => p !== platform)
          : [...composer.targetPlatforms, platform];

        // Ensure at least one platform is selected
        if (newTargets.length === 0) return;

        set({
          composer: {
            ...composer,
            targetPlatforms: newTargets,
          },
        });
      },

      setTargetPlatforms: (platforms) =>
        set((state) => ({
          composer: { ...state.composer, targetPlatforms: platforms },
        })),

      setComposerMedia: (urls, type) =>
        set((state) => ({
          composer: { ...state.composer, mediaUrls: urls, mediaType: type },
        })),

      setComposerSchedule: (date) =>
        set((state) => ({
          composer: { ...state.composer, scheduledAt: date },
        })),

      setActiveOverridePlatform: (platform) => {
        const composer = get().composer;
        const currentText = platform
          ? composer.platformContent[platform] || composer.defaultContent
          : composer.defaultContent;
        const viralScore = ViralAnalyzer.analyze(currentText, platform || "twitter");

        set({
          composer: {
            ...composer,
            activeOverridePlatform: platform,
            viralScore,
          },
          previewPlatform: platform || get().previewPlatform,
        });
      },

      analyzeComposerViralScore: () => {
        const composer = get().composer;
        const text = composer.activeOverridePlatform
          ? composer.platformContent[composer.activeOverridePlatform] || composer.defaultContent
          : composer.defaultContent;
        const viralScore = ViralAnalyzer.analyze(text, composer.activeOverridePlatform || "twitter");
        set((state) => ({ composer: { ...state.composer, viralScore } }));
      },

      applyOptimizedCaption: () => {
        const composer = get().composer;
        if (!composer.viralScore?.improvedVersion) return;

        const improved = composer.viralScore.improvedVersion;
        if (composer.activeOverridePlatform) {
          get().setPlatformOverrideContent(composer.activeOverridePlatform, improved);
        } else {
          get().setComposerContent(improved);
        }
      },

      resetComposer: () =>
        set((state) => ({
          composer: {
            id: undefined,
            title: "",
            defaultContent: "",
            platformContent: {},
            firstComment: {},
            mediaUrls: [],
            mediaType: "text",
            targetPlatforms: ["twitter", "linkedin", "instagram", "threads"],
            scheduledAt: null,
            viralScore: undefined,
            activeOverridePlatform: undefined,
            isGeneratingAI: false,
          },
        })),

      loadPostIntoComposer: (post) => {
        const viralScore = ViralAnalyzer.analyze(post.defaultContent, post.targetPlatforms[0] || "twitter");
        set({
          composer: {
            id: post.id,
            title: post.title || "",
            defaultContent: post.defaultContent,
            platformContent: post.platformContent || {},
            firstComment: post.firstComment || {},
            mediaUrls: post.mediaUrls || [],
            mediaType: post.mediaType || "text",
            targetPlatforms: post.targetPlatforms || ["twitter"],
            scheduledAt: post.scheduledAt,
            viralScore: post.viralScore || viralScore,
            activeOverridePlatform: undefined,
            isGeneratingAI: false,
          },
          activeTab: "composer",
          previewPlatform: post.targetPlatforms[0] || "twitter",
        });
      },

      // Post Actions
      savePostAsDraft: () => {
        const composer = get().composer;
        const existingId = composer.id;
        const id = existingId || `post-${Date.now()}`;
        const newPost: Post = {
          id,
          title: composer.title || "Untitled Draft",
          defaultContent: composer.defaultContent,
          platformContent: composer.platformContent,
          firstComment: composer.firstComment,
          mediaUrls: composer.mediaUrls,
          mediaType: composer.mediaType,
          targetPlatforms: composer.targetPlatforms,
          status: "draft",
          scheduledAt: null,
          publishedAt: null,
          viralScore: composer.viralScore || ViralAnalyzer.analyze(composer.defaultContent, composer.targetPlatforms[0]),
          tags: ["Draft"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const existingIndex = get().posts.findIndex((p) => p.id === id);
        if (existingIndex >= 0) {
          const updated = [...get().posts];
          updated[existingIndex] = newPost;
          set({ posts: updated });
        } else {
          set((state) => ({ posts: [newPost, ...state.posts] }));
        }

        return newPost;
      },

      schedulePost: (customDate) => {
        const composer = get().composer;
        const existingId = composer.id;
        const id = existingId || `post-${Date.now()}`;
        const scheduleTime = customDate || composer.scheduledAt || new Date(Date.now() + 86400000).toISOString();

        const newPost: Post = {
          id,
          title: composer.title || "Scheduled Post",
          defaultContent: composer.defaultContent,
          platformContent: composer.platformContent,
          firstComment: composer.firstComment,
          mediaUrls: composer.mediaUrls,
          mediaType: composer.mediaType,
          targetPlatforms: composer.targetPlatforms,
          status: "scheduled",
          scheduledAt: scheduleTime,
          publishedAt: null,
          viralScore: composer.viralScore || ViralAnalyzer.analyze(composer.defaultContent, composer.targetPlatforms[0]),
          tags: ["Scheduled"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const existingIndex = get().posts.findIndex((p) => p.id === id);
        if (existingIndex >= 0) {
          const updated = [...get().posts];
          updated[existingIndex] = newPost;
          set({ posts: updated });
        } else {
          set((state) => ({ posts: [newPost, ...state.posts] }));
        }

        return newPost;
      },

      publishPostImmediately: async (postId) => {
        const id = postId || get().composer.id || `post-${Date.now()}`;
        const composer = get().composer;

        const postToPublish: Post = postId
          ? get().posts.find((p) => p.id === postId) || get().posts[0]
          : {
              id,
              title: composer.title || "Published Post",
              defaultContent: composer.defaultContent,
              platformContent: composer.platformContent,
              firstComment: composer.firstComment,
              mediaUrls: composer.mediaUrls,
              mediaType: composer.mediaType,
              targetPlatforms: composer.targetPlatforms,
              status: "published",
              scheduledAt: null,
              publishedAt: new Date().toISOString(),
              viralScore: composer.viralScore || ViralAnalyzer.analyze(composer.defaultContent),
              tags: ["Live"],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

        postToPublish.status = "published";
        postToPublish.publishedAt = new Date().toISOString();

        // Add to posts or update
        const existingIndex = get().posts.findIndex((p) => p.id === id);
        if (existingIndex >= 0) {
          const updated = [...get().posts];
          updated[existingIndex] = postToPublish;
          set({ posts: updated });
        } else {
          set((state) => ({ posts: [postToPublish, ...state.posts] }));
        }

        return true;
      },

      deletePost: (id) =>
        set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),

      reschedulePost: (id, newDate) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, scheduledAt: newDate, status: "scheduled" } : p
          ),
        })),

      // Accounts Actions
      connectAccount: (platform, customHandle) => {
        const handle = customHandle || `creator_${platform}`;
        const existing = get().accounts.find((a) => a.platform === platform);

        if (existing) {
          set((state) => ({
            accounts: state.accounts.map((a) =>
              a.platform === platform ? { ...a, status: "connected", lastSync: "Just now" } : a
            ),
          }));
        } else {
          const newAccount: SocialAccount = {
            id: `acc-${Date.now()}`,
            platform,
            username: handle,
            displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            followerCount: Math.floor(Math.random() * 25000) + 5000,
            status: "connected",
            lastSync: "Just now",
            tokenExpiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
            permissions: ["publish_content", "read_insights"],
            metrics: { avgLikes: 350, avgComments: 45, engagementRate: 4.5 },
          };
          set((state) => ({ accounts: [...state.accounts, newAccount] }));
        }
      },

      disconnectAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, status: "expired" } : a
          ),
        })),

      refreshAccountSync: (id) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, lastSync: "Just now", status: "connected" } : a
          ),
        })),

      // Repurpose Actions
      setRepurposeSourceText: (text) =>
        set((state) => ({ repurpose: { ...state.repurpose, sourceText: text } })),
      setRepurposeSourceType: (type) =>
        set((state) => ({ repurpose: { ...state.repurpose, sourceType: type } })),
      setRepurposeResults: (results) =>
        set((state) => ({ repurpose: { ...state.repurpose, results } })),
      setRepurposingState: (isProcessing) =>
        set((state) => ({ repurpose: { ...state.repurpose, isProcessing } })),

      // Library Actions
      saveTemplate: (template) => {
        const newTemplate: ContentTemplate = {
          ...template,
          id: `tpl-${Date.now()}`,
        };
        set((state) => ({ templates: [newTemplate, ...state.templates] }));
      },

      deleteTemplate: (id) =>
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) })),

      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
    }),
    {
      name: "viralflow_app_storage_v1",
      partialize: (state) => ({
        posts: state.posts,
        accounts: state.accounts,
        templates: state.templates,
        settings: state.settings,
      }),
    }
  )
);
