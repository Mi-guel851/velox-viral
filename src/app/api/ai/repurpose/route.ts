import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai/ai-service";

export async function POST(request: Request) {
  try {
    const { sourceText, sourceType } = await request.json();
    if (!sourceText || sourceText.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Source text is required" }, { status: 400 });
    }

    const results = await AIService.repurposeContent(sourceText, sourceType || "notes");
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
