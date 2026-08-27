import { Platform } from "../types";
import { PLATFORMS, ALL_PLATFORMS } from "./constants";
import { InstagramProvider } from "./instagram";
import { TwitterProvider } from "./twitter";
import { TikTokProvider } from "./tiktok";
import { LinkedInProvider } from "./linkedin";
import { FacebookProvider } from "./facebook";
import { ThreadsProvider } from "./threads";
import { YouTubeProvider } from "./youtube";

export * from "./constants";
export * from "./instagram";
export * from "./twitter";
export * from "./tiktok";
export * from "./linkedin";
export * from "./facebook";
export * from "./threads";
export * from "./youtube";

export class PlatformManager {
  static getConfig(platform: Platform) {
    return PLATFORMS[platform];
  }

  static validatePost(platform: Platform, content: string, mediaUrls: string[] = [], title?: string) {
    switch (platform) {
      case "instagram":
        return InstagramProvider.validate(content, mediaUrls);
      case "twitter":
        return TwitterProvider.validate(content);
      case "tiktok":
        return TikTokProvider.validate(content, mediaUrls);
      case "linkedin":
        return LinkedInProvider.validate(content);
      case "facebook":
        return FacebookProvider.validate(content);
      case "threads":
        return ThreadsProvider.validate(content);
      case "youtube":
        return YouTubeProvider.validate(title || "Untitled Short", content, mediaUrls);
      default:
        return { valid: true, errors: [] };
    }
  }

  static adaptContentForPlatform(baseContent: string, targetPlatform: Platform): string {
    const cleanBase = baseContent.trim();
    if (!cleanBase) return "";

    switch (targetPlatform) {
      case "twitter": {
        // If short, format with sleek spacing; if long, ensure punchy hook + bullet points
        if (cleanBase.length <= 270) return cleanBase;
        const threadParts = TwitterProvider.splitIntoThread(cleanBase, 270);
        return threadParts.join("\n\n---\n\n");
      }
      case "linkedin": {
        // LinkedIn format: compelling one-liner hook, white space spacing, key insights bullet points, discussion question CTA, professional hashtags
        const lines = cleanBase.split("\n").filter((l) => l.trim().length > 0);
        const hook = lines[0] || "Here is a game-changing perspective on growth:";
        const body = lines.slice(1).join("\n\n");
        return `${hook}\n\n${body || "Here are the top lessons learned along the way:"}\n\n📌 Key Takeaways:\n• Prioritize leverage over brute force\n• Consistency compound faster than talent\n• Build systems that work without you\n\nWhat's your biggest takeaway from this? Drop a comment below 👇\n\n#Leadership #Innovation #Growth #Productivity`;
      }
      case "instagram": {
        // Instagram: Catchy hook line, aesthetic body, line breaks, emojis, first comment note, 5-8 niche hashtags
        return `${cleanBase}\n\n.\n.\n.\n💬 Save this for later & share with a creator who needs to see this!\n\n#creatorgrowth #contentcreation #viralstrategy #buildinpublic #productivityhacks #creatoreconomy`;
      }
      case "tiktok": {
        // TikTok: High-energy opening hook, ultra concise, viral audio tag & search SEO keywords
        return `🔥 ${cleanBase.slice(0, 300)}\n\nDrop a comment if you want part 2! 👇 #fyp #viral #learnontiktok #creatortips #trending`;
      }
      case "threads": {
        // Threads: conversational, thought-provoking, raw opinion style
        return `${cleanBase.slice(0, 480)}\n\nThoughts? Let's discuss in the replies 👇`;
      }
      case "youtube": {
        // YouTube Shorts description: SEO keywords, subscribe CTA, timestamps, links
        return `Watch full breakdown on the channel! 🔔 Subscribe for daily viral growth strategies.\n\n${cleanBase}\n\n#Shorts #Viral #Growth`;
      }
      case "facebook": {
        // Facebook: Community tone, storytelling, invite reactions
        return `${cleanBase}\n\nWhat do you think about this? Share your experience in the comments! 👇`;
      }
      default:
        return cleanBase;
    }
  }
}
