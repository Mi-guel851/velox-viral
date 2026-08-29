/**
 * Server-side Gemini AI service.
 *
 * Uses the `@google/genai` SDK to call the real Gemini API for caption
 * generation, hook creation, content improvement, repurposing, and image
 * analysis. Falls back to algorithmic generation when no API key is configured.
 */
import "server-only";

import { GoogleGenAI } from "@google/genai";
import { serverEnv } from "@/lib/env.server";
import type { Platform } from "@/lib/types";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (client) return client;
  if (!serverEnv.GEMINI_API_KEY) return null;
  client = new GoogleGenAI({ apiKey: serverEnv.GEMINI_API_KEY });
  return client;
}

function isAvailable(): boolean {
  return getClient() !== null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tone =
  | "casual"
  | "provocative"
  | "professional"
  | "storytelling"
  | "humorous"
  | "urgency"
  | "minimalist";

interface CaptionRequest {
  topic: string;
  platform?: Platform;
  tone?: Tone;
  length?: "short" | "medium" | "long" | "thread";
  includeCTA?: boolean;
  includeHashtags?: boolean;
  keywords?: string[];
  audience?: string;
  customPrompt?: string;
}

interface CaptionVariation {
  id: string;
  title: string;
  tone: string;
  content: string;
  hashtags: string[];
  viralScore: number;
  hookAngle: string;
}

// ---------------------------------------------------------------------------
// Caption generation
// ---------------------------------------------------------------------------

export async function generateCaptions(
  options: CaptionRequest
): Promise<CaptionVariation[]> {
  const gemini = getClient();
  if (!gemini) {
    throw new Error(
      "AI generation is not configured. Add your GEMINI_API_KEY to the server environment."
    );
  }

  const {
    topic,
    platform = "twitter",
    tone = "provocative",
    length = "medium",
    includeCTA = true,
    includeHashtags = true,
    keywords = [],
    audience = "",
    customPrompt,
  } = options;

  const lengthGuide: Record<string, string> = {
    short: "1-3 sentences, punchy and concise",
    medium: "1 short paragraph, 2-4 sentences",
    long: "3-5 paragraphs, detailed and thorough",
    thread: "5-7 tweet thread format, numbered",
  };

  const prompt = `
You are an elite social media copywriter who crafts viral, high-engagement posts.

Generate exactly 3 distinct caption variations for the following request.

TOPIC: ${topic}
PLATFORM: ${platform}
TONE: ${tone}
LENGTH: ${lengthGuide[length] || "medium"}
${keywords.length ? `KEYWORDS TO WEAVE IN: ${keywords.join(", ")}` : ""}
${audience ? `TARGET AUDIENCE: ${audience}` : ""}
${customPrompt ? `ADDITIONAL INSTRUCTIONS: ${customPrompt}` : ""}

For each variation, return a JSON object in this exact format:
{
  "variations": [
    {
      "id": "var-1",
      "title": "A short catchy title for this angle",
      "tone": "description of the tone used",
      "hookAngle": "the psychological hook angle name",
      "content": "the full caption text with emojis and formatting",
      "hashtags": ["tag1", "tag2"],
      "viralScore": 85
    }
  ]
}

Rules:
- Each variation must use a DIFFERENT psychological hook angle (e.g. curiosity gap, contrarian, storytelling, data-driven, fear of missing out, transformation)
- ${includeCTA ? "Include a compelling call-to-action in each." : "Do NOT include a CTA."}
- ${includeHashtags ? "Include 3-6 relevant hashtags at the end of each." : "Do NOT include hashtags."}
- Match the ${platform} algorithm's best practices (line breaks, emoji placement, character limits)
- Make the content feel authentic, not robotic
- viralScore should be a realistic 70-98 estimate based on the content quality
- Return ONLY valid JSON, no markdown fences or extra text
`;

  const response = await gemini.models.generateContent({
    model: serverEnv.GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);

  if (parsed.variations && Array.isArray(parsed.variations)) {
    return parsed.variations.map((v: any, i: number) => ({
      id: v.id || `var-${i + 1}`,
      title: v.title || `Variation ${i + 1}`,
      tone: v.tone || tone,
      content: v.content || "",
      hashtags: v.hashtags || [],
      viralScore: Math.min(99, Math.max(60, v.viralScore || 85)),
      hookAngle: v.hookAngle || "AI Generated",
    }));
  }

  // Fallback: if JSON parsing fails, return a single variation with the raw text
  return [
    {
      id: "var-1",
      title: "⚡ AI Generated",
      tone,
      content: text,
      hashtags: [],
      viralScore: 85,
      hookAngle: "AI Generated",
    },
  ];
}

// ---------------------------------------------------------------------------
// Hook generation
// ---------------------------------------------------------------------------

export async function generateHooks(
  topic: string,
  niche: string = "General"
): Promise<{ hook: string; score: number; category: string }[]> {
  const gemini = getClient();
  if (!gemini) {
    throw new Error("AI generation is not configured.");
  }

  const prompt = `
Generate exactly 5 viral social media opening hooks for the topic: "${topic}" (niche: ${niche}).

Each hook should use a different psychological trigger. Return ONLY valid JSON:
{
  "hooks": [
    {
      "hook": "the hook text",
      "score": 95,
      "category": "Category Name"
    }
  ]
}

Categories to use (pick 5 from): Curiosity Gap, Controversial, Story & Transformation, Data & Case Studies, Negative Hook, Authority & How-To, X vs Y Comparison
Scores should be realistic estimates 80-99.
Return ONLY valid JSON, no markdown.
`;

  const response = await gemini.models.generateContent({
    model: serverEnv.GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.85,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return parsed.hooks || [];
}

// ---------------------------------------------------------------------------
// Content improvement
// ---------------------------------------------------------------------------

export async function improveContent(
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
  const gemini = getClient();
  if (!gemini) {
    throw new Error("AI generation is not configured.");
  }

  const actionPrompts: Record<string, string> = {
    boost_viral: `Rewrite this ${platform} post to maximize viral potential. Use psychological triggers, pattern interrupts, and compelling hooks. Keep the core message but make it impossible to scroll past.`,
    shorten: `Make this post significantly shorter and punchier while keeping the core message. Cut all filler words. Every word must earn its place.`,
    expand: `Expand this post into a more detailed, authoritative version with additional insights, examples, and depth. Keep the same tone.`,
    fix_tone: `Rewrite this post to have a more professional, thought-leadership tone suitable for ${platform}.`,
    add_emojis: `Add strategic emojis to this post to increase visual engagement. Don't overdo it — 3-5 well-placed emojis max. Match the tone of the content.`,
    generate_cta: `Add a compelling call-to-action at the end of this post that drives the specific engagement type best for ${platform} (comments, shares, saves, etc).`,
    make_thread: `Convert this post into a ${platform} thread format. Number each part (1/n). Keep each part concise and standalone. Add a hook for the first part.`,
  };

  const prompt = `${actionPrompts[action] || actionPrompts.boost_viral}

Original post:
---
${text}
---

Return ONLY the improved post text, no explanations or quotes.`;

  const response = await gemini.models.generateContent({
    model: serverEnv.GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 1024,
    },
  });

  return response.text ?? text;
}

// ---------------------------------------------------------------------------
// Content repurposing
// ---------------------------------------------------------------------------

export interface RepurposeResult {
  platform: Platform;
  title: string;
  content: string;
  hashtags: string[];
  formatType: string;
  viralAngle: string;
}

export async function repurposeContent(
  sourceText: string,
  sourceType: string = "notes"
): Promise<RepurposeResult[]> {
  const gemini = getClient();
  if (!gemini) {
    throw new Error("AI generation is not configured.");
  }

  const prompt = `
You are a cross-platform content strategist. Take this ${sourceType} content and repurpose it for 7 social media platforms.

Source content:
---
${sourceText}
---

For EACH platform (twitter, linkedin, instagram, tiktok, threads, youtube, facebook), create a native-format version.
Return ONLY valid JSON:
{
  "results": [
    {
      "platform": "twitter",
      "title": "Short title for this version",
      "content": "The full post content, formatted for this platform",
      "hashtags": ["tag1", "tag2"],
      "formatType": "Format description",
      "viralAngle": "The viral hook angle used"
    }
  ]
}

Rules:
- Twitter: thread format, 280-char limit per tweet, numbered
- LinkedIn: professional, white-space heavy, storytelling
- Instagram: caption with dot separators, visual hooks
- TikTok: short, punchy script with hooks
- Threads: conversational, opinion-forward
- YouTube: shorts description + title
- Facebook: community-style discussion post
Each must feel native to its platform, not like a copy-paste.
Return ONLY valid JSON, no markdown.
`;

  const response = await gemini.models.generateContent({
    model: serverEnv.GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return parsed.results || [];
}

// ---------------------------------------------------------------------------
// Image analysis → caption generation
// ---------------------------------------------------------------------------

export interface ImageCaptionRequest {
  imageBase64: string;
  mimeType: string;
  topic?: string;
  platform?: Platform;
  tone?: Tone;
}

export interface ImageCaptionResult {
  description: string;
  captions: CaptionVariation[];
  hashtags: string[];
}

/**
 * Analyzes an image using Gemini Vision and generates captions from it.
 * The image is sent directly to the API for analysis and is NEVER stored
 * in any database.
 */
export async function generateCaptionsFromImage(
  request: ImageCaptionRequest
): Promise<ImageCaptionResult> {
  const gemini = getClient();
  if (!gemini) {
    throw new Error("AI generation is not configured.");
  }

  const {
    imageBase64,
    mimeType,
    topic = "",
    platform = "instagram",
    tone = "casual",
  } = request;

  const prompt = `
You are an expert social media content creator and image analyst.

Analyze this image and generate social media captions based on what you see.

${topic ? `The user wants captions about this topic: ${topic}` : "Generate captions based on what the image depicts."}

Platform: ${platform}
Tone: ${tone}

Return ONLY valid JSON:
{
  "description": "A brief description of what the image shows",
  "hashtags": ["relevant", "hashtags", "based on image content"],
  "variations": [
    {
      "id": "var-1",
      "title": "Angle title",
      "tone": "tone description",
      "hookAngle": "psychological hook used",
      "content": "the full caption",
      "hashtags": ["specific", "hashtags"],
      "viralScore": 88
    }
  ]
}

Rules:
- Generate 3 distinct caption variations
- Each should use a different angle (e.g. descriptive, emotional, educational, storytelling)
- Make captions that would perform well on ${platform}
- Include platform-specific formatting (emojis, line breaks, etc.)
- Do NOT mention that you analyzed an image — write as if the caption was created organically
- Return ONLY valid JSON, no markdown
`;

  const response = await gemini.models.generateContent({
    model: serverEnv.GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);

  const captions: CaptionVariation[] = (parsed.variations || []).map(
    (v: any, i: number) => ({
      id: v.id || `var-${i + 1}`,
      title: v.title || `Variation ${i + 1}`,
      tone: v.tone || tone,
      content: v.content || "",
      hashtags: v.hashtags || [],
      viralScore: Math.min(99, Math.max(60, v.viralScore || 85)),
      hookAngle: v.hookAngle || "Image-based",
    })
  );

  return {
    description: parsed.description || "Image analyzed",
    captions,
    hashtags: parsed.hashtags || [],
  };
}

// ---------------------------------------------------------------------------
// Feature flag for the rest of the app
// ---------------------------------------------------------------------------

export { isAvailable as isGeminiConfigured };
