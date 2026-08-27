import { NextResponse } from "next/server";
import { PlatformManager } from "@/lib/platforms";
import { Platform } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Posts API ready. Use frontend client or Supabase client for realtime synced posts.",
  });
}

export async function POST(request: Request) {
  try {
    const postData = await request.json();
    const { targetPlatforms, defaultContent, mediaUrls } = postData;

    // Validate platform constraints
    const validationErrors: Record<string, string[]> = {};
    for (const p of (targetPlatforms as Platform[]) || []) {
      const result = PlatformManager.validatePost(p, postData.platformContent?.[p] || defaultContent, mediaUrls);
      if (!result.valid) {
        validationErrors[p] = result.errors;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed on some platforms",
          errors: validationErrors,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      post: postData,
      message: "Post processed and scheduled successfully across platforms.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
