import { NextResponse } from "next/server";
import {
  generateCaptions,
  generateHooks,
  improveContent,
  generateCaptionsFromImage,
} from "@/lib/ai/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, topic, platform, tone, length, text, customPrompt } = body;

    // Image-to-caption analysis
    if (action === "analyze_image") {
      const { imageBase64, mimeType, topic: imgTopic, platform: imgPlatform, tone: imgTone } = body;
      if (!imageBase64) {
        return NextResponse.json(
          { success: false, error: "Image data is required" },
          { status: 400 }
        );
      }

      const result = await generateCaptionsFromImage({
        imageBase64,
        mimeType: mimeType || "image/jpeg",
        topic: imgTopic,
        platform: imgPlatform || platform || "instagram",
        tone: imgTone || tone || "casual",
      });

      return NextResponse.json({ success: true, ...result });
    }

    if (action === "improve" && text) {
      const improved = await improveContent(
        text,
        body.improvementType || "boost_viral",
        platform || "twitter"
      );
      return NextResponse.json({ success: true, result: improved });
    }

    if (action === "hooks") {
      const hooks = await generateHooks(
        topic || "Social Media Strategy",
        body.niche || "General"
      );
      return NextResponse.json({ success: true, hooks });
    }

    // Default: caption generation
    const variations = await generateCaptions({
      topic: topic || "AI Automation for Creators",
      platform: platform || "twitter",
      tone: tone || "provocative",
      length: length || "medium",
      keywords: body.keywords,
      audience: body.audience,
      customPrompt,
    });

    return NextResponse.json({ success: true, variations });
  } catch (error: any) {
    console.error("[/api/ai/generate]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process AI generation",
      },
      { status: 500 }
    );
  }
}
