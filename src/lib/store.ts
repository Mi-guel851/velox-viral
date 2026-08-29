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
  applyOptimizedCaption: () => Promise<void>;
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

const INITIAL_ACCOUNTS: SocialAccount[] = [];

const INITIAL_POSTS: Post[] = [];

const INITIAL_TEMPLATES: ContentTemplate[] = [];

const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalFollowers: 0,
  followerGrowthPercent: 0,
  totalImpressions: 0,
  totalEngagement: 0,
  avgEngagementRate: 0,
  viralPostsCount: 0,
  bestTimes: [],
  platformMetrics: {
    instagram: { followers: 0, engagement: 0, postsCount: 0, growthRate: 0 },
    tiktok: { followers: 0, engagement: 0, postsCount: 0, growthRate: 0 },
    twitter: { followers: 0, engagement: 0, postsCount: 0, growthRate: 0 },
    linkedin: { followers: 0, engagement: 0, postsCount: 0, growthRate: 0 },
    facebook: { followers: 0, engagement: 0, postsCount: 0, growthRate: 0 },
    threads: { followers: 0, engagement: 0, postsCount: 0, growthRate: 0 },
    youtube: { followers: 0, engagement: 0, postsCount: 0, growthRate: 0 },
  },
  historicalData: [],
};

const INITIAL_SETTINGS: WorkspaceSettings = {
  workspaceName: "My Workspace",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  defaultPlatforms: ["twitter", "linkedin", "instagram", "threads"],
  aiProvider: "builtin",
  aiKeys: {},
  supabaseUrl: "",
  supabaseAnonKey: "",
  autoSchedulePeakTimes: true,
  customWatermarkText: "",
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

      applyOptimizedCaption: async () => {
        const composer = get().composer;
        const currentText = composer.activeOverridePlatform
          ? composer.platformContent[composer.activeOverridePlatform] || composer.defaultContent
          : composer.defaultContent;

        if (!currentText.trim()) return;

        const { AIService } = await import("@/lib/ai/ai-service");
        try {
          const improved = await AIService.improveContent(
            currentText,
            "boost_viral",
            composer.activeOverridePlatform || composer.targetPlatforms[0] || "twitter"
          );
          if (composer.activeOverridePlatform) {
            get().setPlatformOverrideContent(composer.activeOverridePlatform, improved);
          } else {
            get().setComposerContent(improved);
          }
        } catch (err) {
          // Fallback to local ViralAnalyzer version if API fails
          if (composer.viralScore?.improvedVersion) {
            const fallback = composer.viralScore.improvedVersion;
            if (composer.activeOverridePlatform) {
              get().setPlatformOverrideContent(composer.activeOverridePlatform, fallback);
            } else {
              get().setComposerContent(fallback);
            }
          }
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
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Clear stale fake data from v1 — start fresh with real user data
          return {
            ...persistedState,
            accounts: [],
            posts: [],
            templates: [],
            settings: {
              ...INITIAL_SETTINGS,
              ...(persistedState?.settings || {}),
              // Keep user's workspace name if they set one, but clear fake watermark
              customWatermarkText: "",
            },
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        posts: state.posts,
        accounts: state.accounts,
        templates: state.templates,
        settings: state.settings,
      }),
    }
  )
);
