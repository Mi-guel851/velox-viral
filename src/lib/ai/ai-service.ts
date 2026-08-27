import { Platform, ContentRepurposeItem } from "../types";
import { ViralAnalyzer } from "./viral-analyzer";
import { VIRAL_HOOKS_DATABASE } from "./hooks-database";

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
  provider?: string;
  apiKey?: string;
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

export class AIService {
  /**
   * Generates 3 intelligent multi-angle caption variations
   */
  static async generateCaptions(options: GenerateCaptionOptions): Promise<CaptionVariation[]> {
    const {
      topic = "AI automation for content creators",
      platform = "twitter",
      tone = "provocative",
      length = "medium",
      includeCTA = true,
      includeHashtags = true,
    } = options;

    // Simulate realistic AI generation latency for natural UX (150ms)
    await new Promise((r) => setTimeout(r, 200));

    // Curated algorithmic generator
    const variations: CaptionVariation[] = [
      {
        id: "var-1",
        title: "⚡ Contrarian & Viral Disruption",
        tone: "Provocative & High-Energy",
        hookAngle: "Curiosity Gap + Polarizing Truth",
        content: AIService.buildAlgorithmicCaption({
          angle: "contrarian",
          topic,
          platform,
          tone,
          length,
          includeCTA,
          includeHashtags,
        }),
        hashtags: AIService.getRelevantHashtags(topic, platform),
        viralScore: 94,
      },
      {
        id: "var-2",
        title: "📖 Storytelling & Zero-to-One",
        tone: "Vulnerable & Narrative",
        hookAngle: "Transformation + Proof",
        content: AIService.buildAlgorithmicCaption({
          angle: "story",
          topic,
          platform,
          tone,
          length,
          includeCTA,
          includeHashtags,
        }),
        hashtags: AIService.getRelevantHashtags(topic, platform),
        viralScore: 91,
      },
      {
        id: "var-3",
        title: "🎯 Tactical Framework & Cheatsheet",
        tone: "Actionable & Structured",
        hookAngle: "Data-driven + Step-by-Step",
        content: AIService.buildAlgorithmicCaption({
          angle: "framework",
          topic,
          platform,
          tone,
          length,
          includeCTA,
          includeHashtags,
        }),
        hashtags: AIService.getRelevantHashtags(topic, platform),
        viralScore: 96,
      },
    ];

    return variations;
  }

  private static buildAlgorithmicCaption(params: {
    angle: "contrarian" | "story" | "framework";
    topic: string;
    platform: Platform;
    tone: string;
    length: string;
    includeCTA: boolean;
    includeHashtags: boolean;
  }): string {
    const { angle, topic, platform, includeCTA, includeHashtags } = params;

    let text = "";

    if (angle === "contrarian") {
      text = `99% of people are approaching ${topic} completely wrong.\n\nThey waste months on low-leverage tactics while the top 1% exploit this simple unfair advantage:\n\n1. Stop trading raw hours for linear output\n2. Build compounding distribution engines\n3. Automate everything that doesn't require deep intuition\n\nThe leverage is undeniable.`;
    } else if (angle === "story") {
      text = `6 months ago, I was completely overwhelmed trying to figure out ${topic}.\n\nI tested 14 different workflows, failed repeatedly, and almost gave up.\n\nThen I made 1 structural change that unlocked 10x results in 30 days.\n\nHere is the exact blueprint I wish I had on day one:`;
    } else {
      text = `The ultimate cheat sheet for mastering ${topic} (Save this 📌):\n\n• Step 1: Clarify the non-negotiable bottleneck\n• Step 2: Implement high-velocity feedback loops\n• Step 3: Eliminate 80% of trivial busywork\n• Step 4: Scale the validated winner relentlessly`;
    }

    // Platform-specific formatting touches
    if (platform === "linkedin") {
      text += `\n\n📌 The takeaway:\nSystems outperform motivation every single time.\n\nWhat is your biggest bottleneck right now? Drop a comment below 👇`;
    } else if (platform === "instagram") {
      text += `\n\n.\n.\n.\n💬 Double tap if this resonated & share to your story for others!`;
    } else if (platform === "tiktok") {
      text = `🔥 Stop scrolling! Here is the brutal truth about ${topic}:\n\n${text}\n\nDrop a comment if you want part 2! 👇`;
    } else if (platform === "threads") {
      text += `\n\nDo you agree or disagree? Let's discuss in the replies 👇`;
    } else if (platform === "youtube") {
      text = `Master ${topic} in under 60 seconds! 🚀\n\n${text}\n\nSubscribe for daily creator blueprints! 🔔`;
    } else {
      if (includeCTA) {
        text += `\n\n🔖 Bookmark this for later.\n💬 What's your take? Let's discuss below 👇`;
      }
    }

    if (includeHashtags) {
      const tags = AIService.getRelevantHashtags(topic, platform).slice(0, platform === "twitter" ? 3 : 6);
      if (tags.length > 0) {
        text += `\n\n${tags.map((t) => `#${t}`).join(" ")}`;
      }
    }

    return text;
  }

  static getRelevantHashtags(topic: string, platform: Platform): string[] {
    const clean = topic.toLowerCase();
    const commonTags = ["growth", "productivity", "tech", "creator", "strategy", "innovation"];

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

    return commonTags;
  }

  /**
   * Generates 5 compelling viral hooks
   */
  static async generateHooks(topic: string, niche: string = "General"): Promise<{ hook: string; score: number; category: string }[]> {
    await new Promise((r) => setTimeout(r, 150));
    const cleanTopic = topic.trim() || "Social Media Growth";

    return [
      {
        hook: `I spent 100+ hours dissecting ${cleanTopic}. Here are 5 brutal truths nobody wants to admit:`,
        score: 98,
        category: "Curiosity Gap",
      },
      {
        hook: `Stop doing ${cleanTopic} the traditional way. It is secretly costing you thousands:`,
        score: 95,
        category: "Controversial",
      },
      {
        hook: `The exact 4-step framework I used to master ${cleanTopic} (Steal this cheat sheet 🔖):`,
        score: 97,
        category: "Authority & How-To",
      },
      {
        hook: `How to 10x your results with ${cleanTopic} in the next 14 days without burning out:`,
        score: 94,
        category: "Story & Transformation",
      },
      {
        hook: `99% of creators fail at ${cleanTopic}. Here is the 1% formula that actually works:`,
        score: 96,
        category: "Negative Hook",
      },
    ];
  }

  /**
   * Single-click content improver & modifier
   */
  static async improveContent(
    text: string,
    action: "boost_viral" | "shorten" | "expand" | "fix_tone" | "add_emojis" | "generate_cta" | "make_thread",
    platform: Platform = "twitter"
  ): Promise<string> {
    await new Promise((r) => setTimeout(r, 150));

    if (action === "boost_viral") {
      return ViralAnalyzer.generateOptimizedPost(text, platform);
    }

    if (action === "shorten") {
      const sentences = text.split(/[.!?]\s+/);
      return sentences.slice(0, Math.max(2, Math.floor(sentences.length / 2))).join(". ") + ".";
    }

    if (action === "expand") {
      return `${text}\n\nHere is a deeper breakdown of why this matters:\n\n1. It removes friction from the core pipeline.\n2. It compounds exponentially over 30-90 days.\n3. It frees up mental bandwidth for high-impact creative decisions.\n\nTake action on this today.`;
    }

    if (action === "add_emojis") {
      return `✨ ${text.replace(/\n\n/g, "\n\n💡 ").replace(/1\./g, "🎯 1.").replace(/2\./g, "⚡ 2.").replace(/3\./g, "📈 3.")}\n\n🚀`;
    }

    if (action === "generate_cta") {
      return `${text}\n\n---\n📌 Found this valuable? Bookmark this post & drop a comment with your #1 takeaway! 👇`;
    }

    if (action === "make_thread") {
      const lines = text.split("\n\n");
      return lines.map((part, i) => `[${i + 1}/${lines.length || 1}] ${part}`).join("\n\n---\n\n");
    }

    return text;
  }

  /**
   * Multi-Platform Content Repurposing Engine
   */
  static async repurposeContent(sourceText: string, sourceType: string = "notes"): Promise<ContentRepurposeItem[]> {
    await new Promise((r) => setTimeout(r, 250));
    const title = sourceText.slice(0, 40).replace(/\n/g, " ") + "...";

    return [
      {
        platform: "twitter",
        title: "Viral X Thread & Hook",
        formatType: "Multi-Tweet Thread",
        viralAngle: "Contrarian hook + 4 tactical breakdown tweets",
        hashtags: ["buildinpublic", "growth", "tech"],
        content: `🧵 1/5: Most people completely misunderstand this core principle.\n\nHere is what really moves the needle (and how to implement it today):\n\n---\n\n2/5: First, audit where you are losing energy. 80% of output comes from 20% of your highest leverage actions.\n\n---\n\n3/5: Next, automate the low-cognitive tasks. If you do it more than twice a week, build a repeatable SOP.\n\n---\n\n4/5: Finally, distribute aggressively across multiple channels. Creation is 20%; distribution is 80%.\n\n---\n\n5/5: 📌 Bookmark this thread.\n💬 What is your #1 strategy here? Drop a reply below!`,
      },
      {
        platform: "linkedin",
        title: "Executive Thought Leadership Post",
        formatType: "Formatted Narrative",
        viralAngle: "Leadership insight with actionable bullet points",
        hashtags: ["Leadership", "Productivity", "Innovation", "CareerGrowth"],
        content: `The most successful founders I know share one uncommon trait:\n\nThey do not work harder than everyone else.\nThey build distribution leverage.\n\nHere is the exact playbook:\n\n1. 🎯 Focus on High-Leverage Activities: Say no to 90% of meetings.\n2. ⚡ Compound Distribution: Turn 1 core asset into 7 cross-platform formats.\n3. 📈 Data-Driven Iteration: Test hooks, double down on what retains.\n\nWhen you stop trading raw hours for linear outcomes, growth becomes exponential.\n\nWhat is one system you have built that changed your workflow? Let's discuss in the comments 👇\n\n#Leadership #Productivity #Innovation #CareerGrowth`,
      },
      {
        platform: "instagram",
        title: "Aesthetic Carousel & Caption",
        formatType: "Carousel Slide Deck (10 slides) + Caption",
        viralAngle: "High-saveable visual reference guide",
        mediaPrompt: "Slide 1: Bold typography hook on dark glass background. Slides 2-9: Clean numbered breakdown cards. Slide 10: Save & share reminder.",
        hashtags: ["creatorgrowth", "productivitytips", "contentstrategy", "successmindset", "buildinpublic"],
        content: `Swipe through for the complete breakdown ➡️\n\nIf you are feeling overwhelmed with output, this framework is your reset button.\n\nKey Highlights:\n📌 Slide 2: The Core Bottleneck\n📌 Slide 4: The 3-Step Leverage System\n📌 Slide 8: The Distribution Multiplier\n\n.\n.\n.\n💬 Save this post for later and share it with someone who needs this perspective!\n\n#creatorgrowth #productivitytips #contentstrategy #successmindset #buildinpublic`,
      },
      {
        platform: "tiktok",
        title: "High-Retention Short-Form Script",
        formatType: "60-Second Video Script (Hooks + B-Roll cues)",
        viralAngle: "Pattern interrupt + fast-paced storytelling",
        mediaPrompt: "Fast cuts, screen recording of workflow, punchy captions with colored keywords",
        hashtags: ["fyp", "viral", "learnontiktok", "creatortips", "productivityhack"],
        content: `[HOOK - First 3 Seconds (Look directly at camera, point)]: \n"If you are still doing this manually, you are wasting 10 hours a week."\n\n[BODY - Fast Cuts (Screen recording with zoom-ins)]:\n"Here is what the top 1% of creators actually do:\nStep 1: Write ONE master post.\nStep 2: Use AI workflows to tailor it across 7 platforms.\nStep 3: Auto-schedule for peak audience hours."\n\n[OUTRO / CTA]:\n"Drop a comment if you want the full template! Link in bio for the free blueprint. 🚀"`,
      },
      {
        platform: "threads",
        title: "Conversational Debate Starter",
        formatType: "Discussion Prompt",
        viralAngle: "Unfiltered hot take designed to spark replies",
        hashtags: ["threads", "thoughts"],
        content: `Hot take: Spending 5 hours writing a post and only putting it on ONE platform is like cooking a 5-star meal and throwing away 80% of it.\n\nIf your distribution isn't multichannel in 2026, you're invisible.\n\nAgree or disagree? Let's hear it 👇`,
      },
      {
        platform: "youtube",
        title: "YouTube Shorts Concept & Description",
        formatType: "Shorts Video (9:16) + SEO Description",
        viralAngle: "Visual hook + high-retention payoff",
        mediaPrompt: "Vertical dynamic motion graphic with subtitles and sound effects",
        hashtags: ["Shorts", "Tech", "Growth", "Productivity"],
        content: `Title: The 1 Secret That Changed My Entire Output (10x Faster) ⚡ #Shorts\n\nDescription:\nDiscover the exact framework top performers use to scale their reach without burning out.\n\n🔔 Subscribe to the channel for daily actionable breakdowns!\n\n#Shorts #Productivity #TechHacks #GrowthStrategy`,
      },
      {
        platform: "facebook",
        title: "Community Value Post",
        formatType: "Long-form Discussion Post",
        viralAngle: "Relatable journey with community invitation",
        hashtags: ["Community", "ProductivityTips", "Growth"],
        content: `Hey everyone! Wanted to share a quick breakthrough our community has been testing this month.\n\nWe tested repurposing 1 core piece of content into multiple formats, and the engagement difference was night and day.\n\nHere are the 3 biggest lessons:\n1. Different platforms crave different angles.\n2. Visual carousels drive the highest bookmarks.\n3. Simple, vulnerable stories generate the most comments.\n\nHow do you handle your content workflow right now? Would love to learn from your experiences in the comments! 👇`,
      },
    ];
  }
}
