import React from "react";
import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free Velox Viral workspace and start cross-posting.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm configured={isSupabaseConfigured()} />;
}
