import React from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

/**
 * The recovery link lands on /auth/confirm first, which exchanges the token for
 * a session and redirects here. Verifying that session server-side means an
 * expired or forged link renders the "invalid link" state instead of a password
 * form that would fail on submit.
 */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  return <ResetPasswordForm hasRecoverySession={Boolean(user)} />;
}
