import { Platform, ViralScoreBreakdown } from "../types";

const HIGH_VIRAL_WORDS = [
  "secret", "mistake", "blueprint", "unpopular", "shocking", "framework", 
  "insane", "transformed", "cheat sheet", "warning", "dead", "killing", 
  "revolution", "steal", "playbook", "game-changer", "hacks", "algorithm", 
  "10x", "millionaire", "stop doing", "truth", "revealed", "lies", "nobody is talking about",
  "data shows", "breakthrough", "leverage", "zero to", "masterclass"
];

const CTA_PATTERNS = [
  /save this/i,
  /bookmark/i,
  /drop a comment/i,
  /comment below/i,
  /retweet/i,
  /repost/i,
  /share with/i,
  /link in bio/i,
  /follow @/i,
  /follow for more/i,
  /what('s| is) your/i,
  /thoughts\?/i,
  /let me know/i,
  /subscribe/i,
  /👇|📌|🔖|🚀|💬/
];

export class ViralAnalyzer {
  static analyze(text: string, platform: Platform = "twitter"): ViralScoreBreakdown {
    const clean = text.trim();
    if (!clean) {
      return {
        overall: 0,
        grade: "D",
        hookScore: 0,
        emotionScore: 0,
        readabilityScore: 0,
        ctaScore: 0,
        platformFitScore: 0,
        hashtagScore: 0,
        highlights: [
          { type: "warning", message: "Content is empty. Start writing to see your AI Viral Score!" }
        ],
        improvedVersion: "",
        estimatedReachMultiplier: "1.0x (Baseline)",
      };
    }

    const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "";
    const lowerText = clean.toLowerCase();

    // 1. Hook Score Analysis (0 - 100)
    let hookScore = 40;
    // Check if first line contains strong curiosity, question, or power numbers
    if (/\d+/.test(firstLine)) hookScore += 15; // numbers increase CTR
    if (/\?|!|:/.test(firstLine)) hookScore += 10;
    if (firstLine.length >= 20 && firstLine.length <= 120) hookScore += 15; // optimal hook length
    if (/(how to|why|the secret|stop|most people|unpopular|3 years ago|i spent)/i.test(firstLine)) {
      hookScore += 20;
    }
    hookScore = Math.min(100, Math.max(20, hookScore));

    // 2. Emotion & Power Words Score (0 - 100)
    let powerWordsCount = 0;
    for (const word of HIGH_VIRAL_WORDS) {
      if (lowerText.includes(word)) {
        powerWordsCount++;
      }
    }
    let emotionScore = 45 + powerWordsCount * 12;
    // Emojis check
    const emojiMatch = clean.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g);
    const emojiCount = emojiMatch ? emojiMatch.length : 0;
    if (emojiCount >= 1 && emojiCount <= 8) emotionScore += 10;
    emotionScore = Math.min(100, Math.max(30, emotionScore));

    // 3. Readability & Formatting (0 - 100)
    let readabilityScore = 50;
    // Check line spacing & whitespace rhythm (vital for mobile skimmability)
    if (lines.length >= 3) readabilityScore += 20;
    if (lines.length >= 5) readabilityScore += 10;
    // Bullet points boost skimmability
    if (/•|-|\d\./.test(clean)) readabilityScore += 15;
    // Penalize giant unspaced wall of text
    const maxParagraphLength = Math.max(...lines.map((l) => l.length));
    if (maxParagraphLength > 280) readabilityScore -= 20;
    readabilityScore = Math.min(100, Math.max(25, readabilityScore));

    // 4. CTA (Call To Action) Score (0 - 100)
    let ctaScore = 30;
    let hasCTA = false;
    for (const pattern of CTA_PATTERNS) {
      if (pattern.test(clean)) {
        hasCTA = true;
        ctaScore += 25;
      }
    }
    if (hasCTA) ctaScore = Math.min(100, Math.max(65, ctaScore));

    // 5. Hashtag Power Score (0 - 100)
    const hashtags = (clean.match(/#[a-zA-Z0-9_]+/g) || []);
    let hashtagScore = 50;
    if (platform === "instagram" || platform === "tiktok") {
      if (hashtags.length >= 3 && hashtags.length <= 8) hashtagScore = 95;
      else if (hashtags.length > 0 && hashtags.length <= 15) hashtagScore = 80;
      else if (hashtags.length === 0) hashtagScore = 40;
      else hashtagScore = 60; // too many hashtags
    } else if (platform === "twitter" || platform === "linkedin" || platform === "threads") {
      if (hashtags.length >= 1 && hashtags.length <= 3) hashtagScore = 95;
      else if (hashtags.length === 0) hashtagScore = 80;
      else hashtagScore = 50; // too many hashtags on X/LinkedIn hurts reach
    }

    // 6. Platform Fit Score (0 - 100)
    let platformFitScore = 75;
    if (platform === "twitter" && clean.length <= 280) platformFitScore = 95;
    else if (platform === "twitter" && clean.length > 280) platformFitScore = 85; // can be thread
    else if (platform === "linkedin" && lines.length >= 4) platformFitScore = 92;
    else if (platform === "instagram" && emojiCount >= 2) platformFitScore = 90;

    // Overall Weighted Average
    const overall = Math.round(
      hookScore * 0.3 +
      emotionScore * 0.2 +
      readabilityScore * 0.2 +
      ctaScore * 0.15 +
      platformFitScore * 0.1 +
      hashtagScore * 0.05
    );

    // Grade calculation
    let grade: "S" | "A" | "B" | "C" | "D" = "C";
    if (overall >= 90) grade = "S";
    else if (overall >= 80) grade = "A";
    else if (overall >= 70) grade = "B";
    else if (overall >= 55) grade = "C";
    else grade = "D";

    // Dynamic reach multiplier estimate
    let reachMultiplier = "1.2x - 1.5x";
    if (overall >= 92) reachMultiplier = "4.5x - 7.2x (High Viral Potential)";
    else if (overall >= 82) reachMultiplier = "2.8x - 4.2x (Above Average Reach)";
    else if (overall >= 70) reachMultiplier = "1.8x - 2.5x (Good Engagement)";
    else reachMultiplier = "1.0x - 1.4x (Baseline Organic Reach)";

    // Actionable Highlights & Tips
    const highlights: ViralScoreBreakdown["highlights"] = [];

    if (hookScore >= 80) {
      highlights.push({
        type: "positive",
        message: "High-impact opening hook! Grabs attention in the first 3 seconds.",
      });
    } else {
      highlights.push({
        type: "warning",
        message: "The opening line lacks curiosity or tension.",
        fix: "Start with a contrarian statement, a specific number, or a bold promise.",
      });
    }

    if (powerWordsCount >= 2) {
      highlights.push({
        type: "positive",
        message: `Includes ${powerWordsCount} high-arousal viral trigger words.`,
      });
    } else {
      highlights.push({
        type: "tip",
        message: "Add emotional power words (e.g., 'secret', 'blueprint', 'mistake', 'framework').",
      });
    }

    if (readabilityScore < 70) {
      highlights.push({
        type: "warning",
        message: "Mobile readability can be improved with 1-2 sentence line breaks.",
        fix: "Break long paragraphs into punchy single-line thoughts with bullet points.",
      });
    } else {
      highlights.push({
        type: "positive",
        message: "Clean line breaks and great mobile skimmability.",
      });
    }

    if (!hasCTA) {
      highlights.push({
        type: "warning",
        message: "Missing an engagement call-to-action (CTA).",
        fix: "Add a discussion prompt (e.g. 'What's your take on this? 👇') or a bookmark reminder.",
      });
    } else {
      highlights.push({
        type: "positive",
        message: "Clear, algorithmic call-to-action included.",
      });
    }

    // Generate Auto-Improved 95+ Version
    const improvedVersion = this.generateOptimizedPost(clean, platform);

    return {
      overall,
      grade,
      hookScore,
      emotionScore,
      readabilityScore,
      ctaScore,
      platformFitScore,
      hashtagScore,
      highlights,
      improvedVersion,
      estimatedReachMultiplier: reachMultiplier,
    };
  }

  static generateOptimizedPost(content: string, platform: Platform): string {
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const coreText = lines.slice(1).join(" ") || content;
    const firstLine = lines[0] || "Most people struggle with this exact problem.";

    // Transform opening hook into viral tier
    let boostedHook = firstLine;
    if (!firstLine.includes("? ") && !firstLine.includes("! ") && !firstLine.includes(":")) {
      boostedHook = `⚡ Most people get this completely wrong:\n\n${firstLine}`;
    }

    let body = coreText;
    if (body.length > 20) {
      body = `Here is the exact framework to master it:\n\n1. 🎯 Identify the core bottleneck\n2. ⚡ Automate the high-friction steps\n3. 📈 Scale what compound daily\n\n${body}`;
    }

    switch (platform) {
      case "twitter":
        return `${boostedHook}\n\n${body}\n\n🔖 Bookmark this thread for reference.\n\n💬 What's your biggest insight here? Drop a reply below 👇`;
      case "linkedin":
        return `${boostedHook}\n\n${body}\n\n📌 Key Takeaway:\nPrioritize systems over raw willpower.\n\nWhat's your perspective on this? Let's discuss in the comments 👇\n\n#Leadership #Productivity #Innovation #GrowthHacking`;
      case "instagram":
        return `${boostedHook}\n\n${body}\n\n.\n.\n.\n👉 Save this post for later & share with a fellow creator!\n\n#creatorgrowth #productivitytips #buildinpublic #viraltips #successframework`;
      case "tiktok":
        return `🔥 STOP SCROLLING!\n\n${boostedHook}\n\n${coreText.slice(0, 160)}\n\nFollow for daily growth blueprints! 🚀 #fyp #viral #learnontiktok`;
      case "threads":
        return `${boostedHook}\n\n${body.slice(0, 380)}\n\nDo you agree or disagree? Let's debate in the replies 👇`;
      default:
        return `${boostedHook}\n\n${body}\n\nDrop a comment with your thoughts! 👇`;
    }
  }
}
