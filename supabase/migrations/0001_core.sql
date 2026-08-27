-- ============================================================================
-- Velox Viral — 0001_core
-- Extensions, shared helpers, profiles, subscriptions, usage counters.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Shared: updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users, created automatically on signup
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  citext not null,
  full_name              text,
  username               citext unique,
  avatar_url             text,
  timezone               text not null default 'UTC',
  -- Onboarding is a linear funnel; `step` is the next step the user must complete.
  onboarding_step        text not null default 'profile'
                           check (onboarding_step in ('profile','connect','platforms','preferences','first_post','done')),
  onboarding_completed_at timestamptz,
  default_platforms      text[] not null default '{}',
  notify_on_publish      boolean not null default true,
  notify_on_failure      boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9_]{3,30}$')
);

comment on table public.profiles is 'Public user profile mirroring auth.users. One row per account.';
comment on column public.profiles.onboarding_step is 'Next onboarding step to complete; ''done'' means finished.';

create index if not exists profiles_username_idx on public.profiles (username);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions — one active row per user; plan drives feature limits
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users (id) on delete cascade,
  plan                   text not null default 'free'
                           check (plan in ('free','pro','business')),
  status                 text not null default 'active'
                           check (status in ('active','trialing','past_due','canceled','incomplete')),
  -- Populated only by the server-side billing webhook. Never written from the client.
  provider               text check (provider in ('paystack')),
  -- Paystack customer_code (CUS_...) and subscription_code (SUB_...).
  provider_customer_id   text,
  provider_subscription_id text,
  -- Paystack plan code (PLN_...) the subscription is attached to.
  provider_plan_code     text,
  -- Provider-specific extras, e.g. Paystack's email_token, which is required
  -- alongside the subscription code to disable a subscription.
  provider_metadata      jsonb not null default '{}'::jsonb,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.subscriptions is 'Billing state. Only the service role may write; clients read their own row.';

create index if not exists subscriptions_provider_customer_idx
  on public.subscriptions (provider_customer_id)
  where provider_customer_id is not null;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- usage_counters — per-user, per-period metering for plan limits
-- ---------------------------------------------------------------------------
create table if not exists public.usage_counters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  metric       text not null check (metric in ('ai_generation','post_published','account_connected')),
  period_start date not null,
  count        integer not null default 0 check (count >= 0),
  updated_at   timestamptz not null default now(),
  unique (user_id, metric, period_start)
);

comment on table public.usage_counters is 'Monthly usage per metric, used to enforce subscription limits server-side.';

create index if not exists usage_counters_user_period_idx
  on public.usage_counters (user_id, period_start desc);

-- ---------------------------------------------------------------------------
-- Signup hook: provision profile + free subscription atomically
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate     text;
  suffix        integer := 0;
begin
  -- Derive a unique, URL-safe username from metadata or the email local-part.
  base_username := lower(regexp_replace(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1)
    ),
    '[^a-zA-Z0-9_]', '', 'g'
  ));

  if length(base_username) < 3 then
    base_username := 'creator' || base_username;
  end if;
  base_username := left(base_username, 24);

  candidate := base_username;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 24) || suffix::text;
  end loop;

  insert into public.profiles (id, email, full_name, username, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    candidate,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile email in sync when the user changes it via Supabase Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.usage_counters enable row level security;

-- profiles: owner reads and updates own row. Inserts happen via the signup trigger.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- subscriptions: read-only to the owner. Writes are service-role only (billing webhook).
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- usage_counters: read-only to the owner. Increments run server-side via a
-- security-definer function so a client cannot reset its own quota.
drop policy if exists "usage_counters_select_own" on public.usage_counters;
create policy "usage_counters_select_own" on public.usage_counters
  for select using (auth.uid() = user_id);
