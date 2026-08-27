import { NextResponse } from "next/server";
import { ViralAnalyzer } from "@/lib/ai/viral-analyzer";

export async function POST(request: Request) {
  try {
    const { text, platform } = await request.json();
    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const analysis = ViralAnalyzer.analyze(text, platform || "twitter");
    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
