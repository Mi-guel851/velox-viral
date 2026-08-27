import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai/ai-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, topic, platform, tone, length, text, customPrompt } = body;

    if (action === "improve" && text) {
      const improved = await AIService.improveContent(text, body.improvementType || "boost_viral", platform);
      return NextResponse.json({ success: true, result: improved });
    }

    if (action === "hooks") {
      const hooks = await AIService.generateHooks(topic || "Social Media Strategy", body.niche || "General");
      return NextResponse.json({ success: true, hooks });
    }

    const variations = await AIService.generateCaptions({
      topic: topic || "AI Automation for Creators",
      platform: platform || "twitter",
      tone: tone || "provocative",
      length: length || "medium",
      customPrompt,
    });

    return NextResponse.json({ success: true, variations });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process AI generation" },
      { status: 500 }
    );
  }
}
