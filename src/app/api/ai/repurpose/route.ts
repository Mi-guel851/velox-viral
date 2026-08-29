import { NextResponse } from "next/server";
import { repurposeContent } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  try {
    const { sourceText, sourceType } = await request.json();
    if (!sourceText || sourceText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Source text is required" },
        { status: 400 }
      );
    }

    const results = await repurposeContent(sourceText, sourceType || "notes");
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("[/api/ai/repurpose]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
