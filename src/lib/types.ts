export type Platform =
  | "instagram"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "facebook"
  | "threads"
  | "youtube";

export interface PlatformConfig {
  id: Platform;
  name: string;
  shortName: string;
  handlePrefix: string;
  color: string;
  bgGradient: string;
  icon: string;
  maxCharacters: number;
  maxHashtags: number;
  supportsMedia: ("image" | "video" | "carousel" | "text")[];
  aspectRatios: string[];
  features: {
    firstComment: boolean;
    thread: boolean;
    title: boolean;
    altText: boolean;
  };
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  username: string;
  displayName: string;
  avatar: string;
  followerCount: number;
  status: "connected" | "expired" | "rate_limited" | "connecting";
  lastSync: string;
  tokenExpiresAt?: string;
  permissions: string[];
  metrics: {
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
  };
}

export interface PostAnalytics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  engagementRate: number;
  topAudienceLocation?: string;
  viralMultiplier?: number;
}

export interface ViralScoreBreakdown {
  overall: number; // 0-100
  grade: "S" | "A" | "B" | "C" | "D";
  hookScore: number;
  emotionScore: number;
  readabilityScore: number;
  ctaScore: number;
  platformFitScore: number;
  hashtagScore: number;
  highlights: {
    type: "positive" | "warning" | "tip";
    message: string;
    fix?: string;
  }[];
  improvedVersion: string;
  estimatedReachMultiplier: string;
}

export interface Post {
  id: string;
  defaultContent: string;
  platformContent: Partial<Record<Platform, string>>;
  firstComment?: Partial<Record<Platform, string>>;
  title?: string;
  mediaUrls: string[];
  mediaType: "text" | "image" | "video" | "carousel";
  targetPlatforms: Platform[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  viralScore?: ViralScoreBreakdown;
  tags?: string[];
  analytics?: PostAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface ViralHook {
  id: string;
  category:
    | "Controversial"
    | "Curiosity Gap"
    | "Story & Transformation"
    | "Data & Case Studies"
    | "Negative Hook"
    | "Authority & How-To"
    | "X vs Y Comparison";
  niche: "Tech & AI" | "SaaS & Growth" | "Personal Brand" | "Finance & Wealth" | "Marketing" | "General";
  template: string;
  example: string;
  viralScoreEstimate: number;
}

export interface ContentRepurposeItem {
  platform: Platform;
  title: string;
  content: string;
  hashtags: string[];
  formatType: string;
  mediaPrompt?: string;
  viralAngle: string;
}

export interface ContentTemplate {
  id: string;
  title: string;
  description: string;
  platform: Platform | "all";
  category: string;
  content: string;
  tags: string[];
}

export interface AnalyticsSummary {
  totalFollowers: number;
  followerGrowthPercent: number;
  totalImpressions: number;
  totalEngagement: number;
  avgEngagementRate: number;
  viralPostsCount: number;
  bestTimes: { day: string; hour: number; score: number }[];
  platformMetrics: Record<
    Platform,
    {
      followers: number;
      engagement: number;
      postsCount: number;
      growthRate: number;
    }
  >;
  historicalData: {
    date: string;
    impressions: number;
    engagement: number;
    followers: number;
  }[];
}

export interface WorkspaceSettings {
  workspaceName: string;
  timezone: string;
  defaultPlatforms: Platform[];
  aiProvider: "builtin" | "openai" | "anthropic" | "gemini" | "groq";
  aiKeys: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    groq?: string;
  };
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSchedulePeakTimes: boolean;
  customWatermarkText: string;
  notifyOnPublish: boolean;
  theme: "dark" | "light" | "system";
}
