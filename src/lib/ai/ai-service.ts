/**
 * Client-side AI service.
 *
 * Calls the server-side API routes which use the real Gemini API.
 * When the server is unreachable or returns an error, the client
 * gracefully falls back to algorithmic local generation so the UI
 * never feels broken.
 */
import { Platform, ContentRepurposeItem } from "../types";
import { ViralAnalyzer } from "./viral-analyzer";

export interface GenerateCaptionOptions {
  topic: string;
  platform?: Platform;
  tone?: "casual" | "provocative" | "professional" | "storytelling" | "humorous" | "urgency" | "minimalist";
  length?: "short" | "medium" | "long" | "thread";
  includeCTA?: boolean;
  includeHashtags?: boolean;
  keywords?: string[];
  audience?: string;
  customPrompt?: string;
  /** When provided, image is analyzed for caption generation (base64). */
  imageBase64?: string;
  imageMimeType?: string;
}

export interface CaptionVariation {
  id: string;
  title: string;
  tone: string;
  content: string;
  hashtags: string[];
  viralScore: number;
  hookAngle: string;
}

// ---------------------------------------------------------------------------
// Local fallback helpers (used when API is unavailable)
// ---------------------------------------------------------------------------

function localHashtags(topic: string, platform: Platform): string[] {
  const clean = topic.toLowerCase();
  if (clean.includes("ai") || clean.includes("tech") || clean.includes("software")) {
    return ["AI", "TechTrends", "BuildInPublic", "ArtificialIntelligence", "Innovation", "Productivity"];
  }
  if (clean.includes("finance") || clean.includes("money") || clean.includes("invest")) {
    return ["WealthBuilding", "FinanceTips", "Investing", "FinancialFreedom", "MoneyMindset"];
  }
  if (clean.includes("saas") || clean.includes("startup") || clean.includes("business")) {
    return ["SaaSGrowth", "Startups", "FounderLife", "Entrepreneurship", "IndieHacker"];
  }
  if (clean.includes("marketing") || clean.includes("brand") || clean.includes("social")) {
    return ["MarketingStrategy", "ViralGrowth", "SocialMediaTips", "PersonalBrand", "ContentStrategy"];
  }
  return ["growth", "productivity", "tech", "creator", "strategy", "innovation"];
}

function localCaptionVariations(topic: string, platform: Platform, tone: string): CaptionVariation[] {
  return [
    {
      id: "var-1",
      title: "⚡ Contrarian & Viral Disruption",
      tone: "Provocative & High-Energy",
      hookAngle: "Curiosity Gap + Polarizing Truth",
      content: `99% of people are approaching ${topic} completely wrong.\n\nThey waste months on low-leverage tactics while the top 1% exploit this simple unfair advantage:\n\n1. Stop trading raw hours for linear output\n2. Build compounding distribution engines\n3. Automate everything that doesn't require deep intuition\n\nThe leverage is undeniable.`,
      hashtags: localHashtags(topic, platform).slice(0, platform === "twitter" ? 3 : 6),
      viralScore: 94,
    },
    {
      id: "var-2",
      title: "📖 Storytelling & Zero-to-One",
      tone: "Vulnerable & Narrative",
      hookAngle: "Transformation + Proof",
      content: `6 months ago, I was completely overwhelmed trying to figure out ${topic}.\n\nI tested 14 different workflows, failed repeatedly, and almost gave up.\n\nThen I made 1 structural change that unlocked 10x results in 30 days.\n\nHere is the exact blueprint I wish I had on day one:`,
      hashtags: localHashtags(topic, platform).slice(0, platform === "twitter" ? 3 : 6),
      viralScore: 91,
    },
    {
      id: "var-3",
      title: "🎯 Tactical Framework & Cheatsheet",
      tone: "Actionable & Structured",
      hookAngle: "Data-driven + Step-by-Step",
      content: `The ultimate cheat sheet for mastering ${topic} (Save this 📌):\n\n• Step 1: Clarify the non-negotiable bottleneck\n• Step 2: Implement high-velocity feedback loops\n• Step 3: Eliminate 80% of trivial busywork\n• Step 4: Scale the validated winner relentlessly`,
      hashtags: localHashtags(topic, platform).slice(0, platform === "twitter" ? 3 : 6),
      viralScore: 96,
    },
  ];
}

function localHooks(topic: string): { hook: string; score: number; category: string }[] {
  return [
    { hook: `I spent 100+ hours dissecting ${topic}. Here are 5 brutal truths nobody wants to admit:`, score: 98, category: "Curiosity Gap" },
    { hook: `Stop doing ${topic} the traditional way. It is secretly costing you thousands:`, score: 95, category: "Controversial" },
    { hook: `The exact 4-step framework I used to master ${topic} (Steal this cheat sheet 🔖):`, score: 97, category: "Authority & How-To" },
    { hook: `How to 10x your results with ${topic} in the next 14 days without burning out:`, score: 94, category: "Story & Transformation" },
    { hook: `99% of creators fail at ${topic}. Here is the 1% formula that actually works:`, score: 96, category: "Negative Hook" },
  ];
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiPost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class AIService {
  /**
   * Generates 3 intelligent multi-angle caption variations.
   * Tries the real Gemini API first; falls back to algorithmic local generation.
   */
  static async generateCaptions(options: GenerateCaptionOptions): Promise<CaptionVariation[]> {
    const {
      topic = "AI automation for content creators",
      platform = "twitter",
      tone = "provocative",
      length = "medium",
    } = options;

    try {
      // If an image is provided, use the image analysis endpoint
      if (options.imageBase64) {
        const data = await apiPost("/api/ai/generate", {
          action: "analyze_image",
          imageBase64: options.imageBase64,
          mimeType: options.imageMimeType || "image/jpeg",
          topic,
          platform,
          tone,
        });
        return data.captions || data.variations || [];
      }

      const data = await apiPost("/api/ai/generate", {
        topic,
        platform,
        tone,
        length,
        keywords: options.keywords,
        audience: options.audience,
        customPrompt: options.customPrompt,
      });
      return data.variations || [];
    } catch (err) {
      console.warn("[AIService] API call failed, using local fallback:", err);
      // Graceful fallback to algorithmic generation
      return localCaptionVariations(topic, platform, tone);
    }
  }

  /**
   * Generates 5 compelling viral hooks.
   */
  static async generateHooks(
    topic: string,
    niche: string = "General"
  ): Promise<{ hook: string; score: number; category: string }[]> {
    try {
      const data = await apiPost("/api/ai/generate", {
        action: "hooks",
        topic,
        niche,
      });
      return data.hooks || [];
    } catch (err) {
      console.warn("[AIService] Hooks API failed, using local fallback:", err);
      return localHooks(topic);
    }
  }

  /**
   * Single-click content improver & modifier.
   */
  static async improveContent(
    text: string,
    action:
      | "boost_viral"
      | "shorten"
      | "expand"
      | "fix_tone"
      | "add_emojis"
      | "generate_cta"
      | "make_thread",
    platform: Platform = "twitter"
  ): Promise<string> {
    try {
      const data = await apiPost("/api/ai/generate", {
        action: "improve",
        text,
        improvementType: action,
        platform,
      });
      return data.result || text;
    } catch (err) {
      console.warn("[AIService] Improve API failed, using local fallback:", err);
      // Local fallback
      if (action === "boost_viral") {
        return ViralAnalyzer.generateOptimizedPost(text, platform);
      }
      if (action === "shorten") {
        const sentences = text.split(/[.!?]\s+/);
        return sentences.slice(0, Math.max(2, Math.floor(sentences.length / 2))).join(". ") + ".";
      }
      if (action === "add_emojis") {
        return `✨ ${text.replace(/\n\n/g, "\n\n💡 ").replace(/1\./g, "🎯 1.").replace(/2\./g, "⚡ 2.").replace(/3\./g, "📈 3.")}\n\n🚀`;
      }
      if (action === "generate_cta") {
        return `${text}\n\n---\n📌 Found this valuable? Bookmark this post & drop a comment with your #1 takeaway! 👇`;
      }
      return text;
    }
  }

  /**
   * Multi-Platform Content Repurposing Engine.
   */
  static async repurposeContent(
    sourceText: string,
    sourceType: string = "notes"
  ): Promise<ContentRepurposeItem[]> {
    try {
      const data = await apiPost("/api/ai/repurpose", {
        sourceText,
        sourceType,
      });
      return data.results || [];
    } catch (err) {
      console.warn("[AIService] Repurpose API failed, using local fallback:", err);
      // Return a basic local fallback
      return [
        {
          platform: "twitter",
          title: "X Thread & Hook",
          formatType: "Multi-Tweet Thread",
          viralAngle: "Contrarian hook + tactical breakdown",
          hashtags: ["buildinpublic", "growth", "tech"],
          content: `🧵 Most people misunderstand this core principle.\n\nHere is what really moves the needle:\n\n1. Focus on highest-leverage actions\n2. Automate repetitive tasks\n3. Distribute aggressively\n\nBookmark this thread 💬`,
        },
        {
          platform: "linkedin",
          title: "Executive Thought Leadership Post",
          formatType: "Formatted Narrative",
          viralAngle: "Leadership insight with actionable steps",
          hashtags: ["Leadership", "Productivity", "Innovation"],
          content: `The most successful founders share one uncommon trait:\n\nThey do not work harder. They build distribution leverage.\n\n1. 🎯 Focus on High-Leverage Activities\n2. ⚡ Compound Distribution\n3. 📈 Data-Driven Iteration\n\nWhat system changed your workflow? 👇`,
        },
      ];
    }
  }

  /**
   * Analyze an image and generate captions from it.
   * The image data is sent to the API for temporary analysis only — it is
   * never stored in any database.
   */
  static async generateFromImage(
    imageBase64: string,
    mimeType: string,
    options: { topic?: string; platform?: Platform; tone?: string } = {}
  ): Promise<{ description: string; captions: CaptionVariation[]; hashtags: string[] }> {
    try {
      const data = await apiPost("/api/ai/generate", {
        action: "analyze_image",
        imageBase64,
        mimeType,
        topic: options.topic || "",
        platform: options.platform || "instagram",
        tone: options.tone || "casual",
      });
      return {
        description: data.description || "",
        captions: data.captions || data.variations || [],
        hashtags: data.hashtags || [],
      };
    } catch (err) {
      console.warn("[AIService] Image analysis failed:", err);
      throw new Error("Image analysis requires a configured AI provider. Add your GEMINI_API_KEY to the server environment.");
    }
  }
}
