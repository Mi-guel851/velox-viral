-- Add security_phrase column to profiles for password recovery.
-- This replaces email-based recovery: users set a memorable phrase during
-- onboarding and use it to verify identity when resetting their password.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS security_phrase text DEFAULT NULL;

COMMENT ON COLUMN profiles.security_phrase IS
  'User-chosen memorable phrase for password recovery. Verified server-side during the forgot-password flow.';

-- Index for fast lookup during recovery (email + phrase match).
-- The query pattern is: SELECT security_phrase FROM profiles WHERE id = $user_id
-- so no additional index is needed beyond the primary key.
