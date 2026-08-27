/**
 * Database types for the Velox Viral schema.
 *
 * Hand-maintained to match `supabase/migrations/*.sql`. Keep in sync when a
 * migration changes a table. If you have the Supabase CLI linked you can
 * regenerate instead:
 *
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 *
 * Row/Insert/Update shapes are declared standalone and then composed into
 * `Database`. Referencing `Database[...]` from inside its own declaration is
 * circular, and TypeScript resolves that to `never`, which silently strips the
 * types off every query.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlatformKey =
  | "instagram"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "facebook"
  | "threads"
  | "youtube";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

export type TargetStatus =
  | "pending"
  | "publishing"
  | "published"
  | "failed"
  | "skipped"
  | "cancelled";

export type AccountStatus = "connected" | "expired" | "revoked" | "error";

export type OnboardingStep =
  | "profile"
  | "connect"
  | "platforms"
  | "preferences"
  | "first_post"
  | "done";

export type PlanId = "free" | "pro" | "business";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export type UsageMetric = "ai_generation" | "post_published" | "account_connected";

export type MediaKind = "image" | "video";

export type MediaType = "text" | "image" | "video" | "carousel";

export type NotificationType =
  | "post_published"
  | "post_failed"
  | "post_partial"
  | "account_connected"
  | "account_disconnected"
  | "account_expiring"
  | "schedule_upcoming"
  | "ai_completed"
  | "analytics_updated"
  | "subscription_updated";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type GenerationKind =
  | "captions"
  | "hooks"
  | "hashtags"
  | "cta"
  | "repurpose"
  | "improve"
  | "variations";

/** Ordered media attached to a post, resolved to signed URLs at render time. */
export interface PostMediaItem {
  asset_id: string;
  storage_path: string;
  url?: string;
  kind: MediaKind;
  alt_text?: string | null;
}

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------
export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  timezone: string;
  onboarding_step: OnboardingStep;
  onboarding_completed_at: string | null;
  default_platforms: string[];
  notify_on_publish: boolean;
  notify_on_failure: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  timezone?: string;
  onboarding_step?: OnboardingStep;
  onboarding_completed_at?: string | null;
  default_platforms?: string[];
  notify_on_publish?: boolean;
  notify_on_failure?: boolean;
}

export type ProfileUpdate = Partial<ProfileInsert>;

// ---------------------------------------------------------------------------
// subscriptions
// ---------------------------------------------------------------------------
export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: PlanId;
  status: SubscriptionStatus;
  provider: "stripe" | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInsert {
  user_id: string;
  plan?: PlanId;
  status?: SubscriptionStatus;
  provider?: "stripe" | null;
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}

export type SubscriptionUpdate = Partial<SubscriptionInsert>;

// ---------------------------------------------------------------------------
// usage_counters
// ---------------------------------------------------------------------------
export interface UsageCounterRow {
  id: string;
  user_id: string;
  metric: UsageMetric;
  period_start: string;
  count: number;
  updated_at: string;
}

export interface UsageCounterInsert {
  user_id: string;
  metric: UsageMetric;
  period_start: string;
  count?: number;
}

export type UsageCounterUpdate = Partial<UsageCounterInsert>;

// ---------------------------------------------------------------------------
// social_accounts
// ---------------------------------------------------------------------------
export interface SocialAccountRow {
  id: string;
  user_id: string;
  platform: PlatformKey;
  platform_user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
  platform_metadata: Json;
  scopes: string[];
  status: AccountStatus;
  token_expires_at: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccountInsert {
  id?: string;
  user_id: string;
  platform: PlatformKey;
  platform_user_id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  follower_count?: number;
  platform_metadata?: Json;
  scopes?: string[];
  status?: AccountStatus;
  token_expires_at?: string | null;
  last_synced_at?: string | null;
  last_error?: string | null;
}

export type SocialAccountUpdate = Partial<SocialAccountInsert>;

// ---------------------------------------------------------------------------
// social_account_secrets
// ---------------------------------------------------------------------------
export interface SocialAccountSecretRow {
  social_account_id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
  token_expires_at: string | null;
  refresh_expires_at: string | null;
  last_refreshed_at: string | null;
  refresh_failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface SocialAccountSecretInsert {
  social_account_id: string;
  access_token_enc: string;
  refresh_token_enc?: string | null;
  token_expires_at?: string | null;
  refresh_expires_at?: string | null;
  last_refreshed_at?: string | null;
  refresh_failure_count?: number;
}

export type SocialAccountSecretUpdate = Partial<SocialAccountSecretInsert>;

// ---------------------------------------------------------------------------
// oauth_states
// ---------------------------------------------------------------------------
export interface OAuthStateRow {
  state: string;
  user_id: string;
  platform: PlatformKey;
  code_verifier: string | null;
  redirect_to: string | null;
  created_at: string;
  expires_at: string;
}

export interface OAuthStateInsert {
  state: string;
  user_id: string;
  platform: PlatformKey;
  code_verifier?: string | null;
  redirect_to?: string | null;
  expires_at?: string;
}

export type OAuthStateUpdate = Partial<OAuthStateInsert>;

// ---------------------------------------------------------------------------
// media_assets
// ---------------------------------------------------------------------------
export interface MediaAssetRow {
  id: string;
  user_id: string;
  storage_path: string;
  mime_type: string;
  kind: MediaKind;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  alt_text: string | null;
  created_at: string;
}

export interface MediaAssetInsert {
  id?: string;
  user_id: string;
  storage_path: string;
  mime_type: string;
  kind: MediaKind;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  alt_text?: string | null;
}

export type MediaAssetUpdate = Partial<MediaAssetInsert>;

// ---------------------------------------------------------------------------
// posts
// ---------------------------------------------------------------------------
export interface PostRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  platform_content: Json;
  first_comment: Json;
  media: Json;
  media_type: MediaType;
  target_platforms: string[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  publish_attempts: number;
  last_error: string | null;
  viral_score: Json | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PostInsert {
  id?: string;
  user_id: string;
  title?: string | null;
  content?: string;
  platform_content?: Json;
  first_comment?: Json;
  media?: Json;
  media_type?: MediaType;
  target_platforms?: string[];
  status?: PostStatus;
  scheduled_at?: string | null;
  published_at?: string | null;
  publish_attempts?: number;
  last_error?: string | null;
  viral_score?: Json | null;
  tags?: string[];
}

export type PostUpdate = Partial<PostInsert>;

// ---------------------------------------------------------------------------
// post_targets
// ---------------------------------------------------------------------------
export interface PostTargetRow {
  id: string;
  post_id: string;
  user_id: string;
  social_account_id: string | null;
  platform: PlatformKey;
  resolved_content: string | null;
  status: TargetStatus;
  remote_post_id: string | null;
  remote_url: string | null;
  attempts: number;
  last_error: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostTargetInsert {
  id?: string;
  post_id: string;
  user_id: string;
  social_account_id?: string | null;
  platform: PlatformKey;
  resolved_content?: string | null;
  status?: TargetStatus;
  remote_post_id?: string | null;
  remote_url?: string | null;
  attempts?: number;
  last_error?: string | null;
  published_at?: string | null;
}

export type PostTargetUpdate = Partial<PostTargetInsert>;

// ---------------------------------------------------------------------------
// post_metrics
// ---------------------------------------------------------------------------
export interface PostMetricRow {
  id: string;
  post_target_id: string;
  user_id: string;
  platform: PlatformKey;
  collected_for: string;
  collected_at: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  engagement_rate: number;
  raw: Json;
}

export interface PostMetricInsert {
  post_target_id: string;
  user_id: string;
  platform: PlatformKey;
  collected_for: string;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  video_views?: number;
  engagement_rate?: number;
  raw?: Json;
}

export type PostMetricUpdate = Partial<PostMetricInsert>;

// ---------------------------------------------------------------------------
// analytics_snapshots
// ---------------------------------------------------------------------------
export interface AnalyticsSnapshotRow {
  id: string;
  user_id: string;
  social_account_id: string;
  platform: PlatformKey;
  snapshot_date: string;
  followers: number;
  followers_delta: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  posts_count: number;
  engagement_rate: number;
  raw: Json;
  created_at: string;
}

export interface AnalyticsSnapshotInsert {
  user_id: string;
  social_account_id: string;
  platform: PlatformKey;
  snapshot_date: string;
  followers?: number;
  followers_delta?: number;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  posts_count?: number;
  engagement_rate?: number;
  raw?: Json;
}

export type AnalyticsSnapshotUpdate = Partial<AnalyticsSnapshotInsert>;

// ---------------------------------------------------------------------------
// content_generations
// ---------------------------------------------------------------------------
export interface ContentGenerationRow {
  id: string;
  user_id: string;
  kind: GenerationKind;
  platform: PlatformKey | null;
  prompt: string;
  params: Json;
  result: Json | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  status: "succeeded" | "failed";
  error: string | null;
  created_at: string;
}

export interface ContentGenerationInsert {
  user_id: string;
  kind: GenerationKind;
  platform?: PlatformKey | null;
  prompt: string;
  params?: Json;
  result?: Json | null;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  latency_ms?: number | null;
  status?: "succeeded" | "failed";
  error?: string | null;
}

export type ContentGenerationUpdate = Partial<ContentGenerationInsert>;

// ---------------------------------------------------------------------------
// content_templates
// ---------------------------------------------------------------------------
export interface ContentTemplateRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  platform: PlatformKey | "all";
  category: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ContentTemplateInsert {
  user_id: string;
  title: string;
  description?: string | null;
  platform?: PlatformKey | "all";
  category?: string;
  content: string;
  tags?: string[];
}

export type ContentTemplateUpdate = Partial<ContentTemplateInsert>;

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Json;
  severity: NotificationSeverity;
  read_at: string | null;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Json;
  severity?: NotificationSeverity;
  read_at?: string | null;
}

export type NotificationUpdate = Partial<NotificationInsert>;

// ---------------------------------------------------------------------------
// activity_logs
// ---------------------------------------------------------------------------
export interface ActivityLogRow {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface ActivityLogInsert {
  user_id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Json;
}

export type ActivityLogUpdate = Partial<ActivityLogInsert>;

// ---------------------------------------------------------------------------
// Composed schema
// ---------------------------------------------------------------------------

/**
 * Foreign keys, as postgrest-js expects them.
 *
 * `Relationships` is a REQUIRED member of its `GenericTable` contract. Omitting
 * it makes the whole schema fail the `GenericSchema` constraint, and every row
 * type silently degrades to `never` — queries still compile, but nothing is
 * typed. Only relationships between tables in the `public` schema are listed;
 * `auth.users` is not embeddable via PostgREST, so those FKs are omitted.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
        Relationships: [];
      };
      usage_counters: {
        Row: UsageCounterRow;
        Insert: UsageCounterInsert;
        Update: UsageCounterUpdate;
        Relationships: [];
      };
      social_accounts: {
        Row: SocialAccountRow;
        Insert: SocialAccountInsert;
        Update: SocialAccountUpdate;
        Relationships: [];
      };
      social_account_secrets: {
        Row: SocialAccountSecretRow;
        Insert: SocialAccountSecretInsert;
        Update: SocialAccountSecretUpdate;
        Relationships: [
          {
            foreignKeyName: "social_account_secrets_social_account_id_fkey";
            columns: ["social_account_id"];
            isOneToOne: true;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_states: {
        Row: OAuthStateRow;
        Insert: OAuthStateInsert;
        Update: OAuthStateUpdate;
        Relationships: [];
      };
      media_assets: {
        Row: MediaAssetRow;
        Insert: MediaAssetInsert;
        Update: MediaAssetUpdate;
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: PostInsert;
        Update: PostUpdate;
        Relationships: [];
      };
      post_targets: {
        Row: PostTargetRow;
        Insert: PostTargetInsert;
        Update: PostTargetUpdate;
        Relationships: [
          {
            foreignKeyName: "post_targets_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_targets_social_account_id_fkey";
            columns: ["social_account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_metrics: {
        Row: PostMetricRow;
        Insert: PostMetricInsert;
        Update: PostMetricUpdate;
        Relationships: [
          {
            foreignKeyName: "post_metrics_post_target_id_fkey";
            columns: ["post_target_id"];
            isOneToOne: false;
            referencedRelation: "post_targets";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_snapshots: {
        Row: AnalyticsSnapshotRow;
        Insert: AnalyticsSnapshotInsert;
        Update: AnalyticsSnapshotUpdate;
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_social_account_id_fkey";
            columns: ["social_account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      content_generations: {
        Row: ContentGenerationRow;
        Insert: ContentGenerationInsert;
        Update: ContentGenerationUpdate;
        Relationships: [];
      };
      content_templates: {
        Row: ContentTemplateRow;
        Insert: ContentTemplateInsert;
        Update: ContentTemplateUpdate;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
        Relationships: [];
      };
      activity_logs: {
        Row: ActivityLogRow;
        Insert: ActivityLogInsert;
        Update: ActivityLogUpdate;
        Relationships: [];
      };
    };

    // `[_ in never]: never` rather than Record<string, never>: the latter makes
    // every string a valid key, which breaks PostgREST name resolution.
    Views: {
      [_ in never]: never;
    };

    Functions: {
      analytics_summary: {
        Args: { p_from: string; p_to: string };
        Returns: AnalyticsSummaryResult[];
      };
      analytics_timeseries: {
        Args: { p_from: string; p_to: string };
        Returns: AnalyticsTimeseriesPoint[];
      };
      analytics_by_platform: {
        Args: { p_from: string; p_to: string };
        Returns: AnalyticsPlatformBreakdown[];
      };
      claim_due_posts: {
        Args: { p_limit?: number; p_grace_seconds?: number };
        Returns: PostRow[];
      };
      reclaim_stuck_posts: {
        Args: { p_stale_minutes?: number };
        Returns: number;
      };
      increment_usage: {
        Args: { p_user_id: string; p_metric: string; p_amount?: number };
        Returns: number;
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ---------------------------------------------------------------------------
// Analytics function result shapes
// ---------------------------------------------------------------------------

export interface AnalyticsSummaryResult {
  total_followers: number;
  followers_delta: number;
  follower_growth_pct: number;
  total_impressions: number;
  total_reach: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  total_clicks: number;
  total_engagement: number;
  avg_engagement_rate: number;
  posts_published: number;
  connected_accounts: number;
}

export interface AnalyticsTimeseriesPoint {
  day: string;
  impressions: number;
  reach: number;
  engagement: number;
  followers: number;
}

export interface AnalyticsPlatformBreakdown {
  platform: PlatformKey;
  followers: number;
  followers_delta: number;
  impressions: number;
  engagement: number;
  posts_count: number;
  engagement_rate: number;
}
