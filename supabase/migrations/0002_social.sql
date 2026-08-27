-- ============================================================================
-- Velox Viral — 0002_social
-- Connected social accounts, isolated token vault, OAuth handshake state.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- social_accounts — one row per connected platform account.
-- Contains NO secrets. Safe for the owner to read from the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.social_accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  platform          text not null
                      check (platform in ('instagram','tiktok','twitter','linkedin','facebook','threads','youtube')),
  -- The platform's own stable identifier for the account (IG user id, page id, channel id...).
  platform_user_id  text not null,
  username          text not null,
  display_name      text,
  avatar_url        text,
  follower_count    bigint not null default 0 check (follower_count >= 0),
  -- Extra per-platform routing data: IG business id, FB page id, YT channel id, etc.
  platform_metadata jsonb not null default '{}'::jsonb,
  scopes            text[] not null default '{}',
  status            text not null default 'connected'
                      check (status in ('connected','expired','revoked','error')),
  -- Mirrored from the secret vault so the UI can warn before expiry without
  -- ever reading a token.
  token_expires_at  timestamptz,
  last_synced_at    timestamptz,
  last_error        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Reconnecting the same platform account updates the existing row.
  unique (user_id, platform, platform_user_id)
);

comment on table public.social_accounts is 'Connected platform accounts. Secret-free by design; tokens live in social_account_secrets.';
comment on column public.social_accounts.token_expires_at is 'Mirror of the vault expiry so the UI can surface "reconnect needed" without touching secrets.';

create index if not exists social_accounts_user_idx on public.social_accounts (user_id);
create index if not exists social_accounts_user_status_idx on public.social_accounts (user_id, status);
-- Drives the token-refresh sweep.
create index if not exists social_accounts_expiring_idx
  on public.social_accounts (token_expires_at)
  where status = 'connected' and token_expires_at is not null;

drop trigger if exists social_accounts_set_updated_at on public.social_accounts;
create trigger social_accounts_set_updated_at
  before update on public.social_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- social_account_secrets — the token vault.
--
-- Deliberately a separate table with RLS enabled and NO policies, which means
-- every anon/authenticated request is denied. Only the service role (server)
-- can read or write it, so an OAuth token can never reach a browser even if a
-- client query is compromised. Values are AES-256-GCM ciphertext produced by
-- the application layer, so the key never lives in the database either.
-- ---------------------------------------------------------------------------
create table if not exists public.social_account_secrets (
  social_account_id     uuid primary key references public.social_accounts (id) on delete cascade,
  access_token_enc      text not null,
  refresh_token_enc     text,
  token_expires_at      timestamptz,
  refresh_expires_at    timestamptz,
  last_refreshed_at     timestamptz,
  refresh_failure_count integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.social_account_secrets is 'Encrypted OAuth tokens. RLS on with zero policies: service-role access only.';

drop trigger if exists social_account_secrets_set_updated_at on public.social_account_secrets;
create trigger social_account_secrets_set_updated_at
  before update on public.social_account_secrets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- oauth_states — short-lived CSRF + PKCE state for the authorize/callback round trip.
-- Also service-role only: the code_verifier must never be readable by a client.
-- ---------------------------------------------------------------------------
create table if not exists public.oauth_states (
  state         text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  platform      text not null
                  check (platform in ('instagram','tiktok','twitter','linkedin','facebook','threads','youtube')),
  code_verifier text,
  redirect_to   text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '15 minutes')
);

comment on table public.oauth_states is 'One-time OAuth state + PKCE verifier. Consumed on callback, swept when expired.';

create index if not exists oauth_states_expires_idx on public.oauth_states (expires_at);
create index if not exists oauth_states_user_idx on public.oauth_states (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.social_accounts        enable row level security;
alter table public.social_account_secrets enable row level security;  -- no policies == deny all
alter table public.oauth_states           enable row level security;  -- no policies == deny all

-- social_accounts: full ownership for the account holder. Inserts still go
-- through the server (the callback route) because a row is only meaningful
-- alongside its vault entry, but owning delete lets "Disconnect" work directly.
drop policy if exists "social_accounts_select_own" on public.social_accounts;
create policy "social_accounts_select_own" on public.social_accounts
  for select using (auth.uid() = user_id);

drop policy if exists "social_accounts_update_own" on public.social_accounts;
create policy "social_accounts_update_own" on public.social_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "social_accounts_delete_own" on public.social_accounts;
create policy "social_accounts_delete_own" on public.social_accounts
  for delete using (auth.uid() = user_id);
