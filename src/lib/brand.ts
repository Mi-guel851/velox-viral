/**
 * Brand constants. Single source of truth for product naming so a rename never
 * again requires touching a dozen components.
 */
export const BRAND = {
  name: "Velox Viral",
  shortName: "Velox",
  /** Rendered as the small pill beside the wordmark. */
  mark: "AI",
  tagline: "Social Operating System",
  description:
    "Write once, publish everywhere. Velox Viral adapts a single post into platform-native content for Instagram, TikTok, X, LinkedIn, Facebook, Threads and YouTube — then schedules it, publishes it, and reports what actually happened.",
  /** Prefix for browser storage keys, so a rename invalidates stale local state. */
  storagePrefix: "velox_viral",
} as const;
