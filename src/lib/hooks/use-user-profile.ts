"use client";

import { useState, useEffect, useCallback } from "react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  timezone?: string;
}

interface UseUserProfileResult {
  profile: UserProfile | null;
  authenticated: boolean;
  connectedAccounts: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  displayName: string;
  displayEmail: string;
  avatarUrl: string;
}

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

/**
 * Fetches the authenticated user's profile from the server.
 * Returns display-friendly data including name, email, and avatar.
 */
export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      setProfile(data.profile);
      setAuthenticated(data.authenticated);
      setConnectedAccounts(data.connectedAccounts || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayName =
    profile?.full_name ||
    profile?.username ||
    profile?.email?.split("@")[0] ||
    "User";

  const displayEmail = profile?.email || "";

  const avatarUrl = profile?.avatar_url || DEFAULT_AVATAR;

  return {
    profile,
    authenticated,
    connectedAccounts,
    loading,
    error,
    refresh: fetchProfile,
    displayName,
    displayEmail,
    avatarUrl,
  };
}
