-- ============================================================================
-- Velox Viral — 0003_content
-- Media assets, master posts, and per-platform publish targets.
--
-- Design note: rather than separate `scheduled_posts` and `published_posts`
-- tables, a post's lifecycle lives in one `posts` row (status column) with a
-- child `post_targets` row per platform. Cross-posting can partially succeed —
-- X publishes, Instagram rejects the caption — and only a per-target table can
-- record that truthfully. Splitting by status would duplicate content and lose
-- the per-platform result.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- media_assets — uploads backing a post, stored in the `post-media` bucket
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  mime_type    text not null,
  kind         text not null check (kind in ('image','video')),
  size_bytes   bigint not null check (size_bytes > 0),
  width        integer,
  height       integer,
  duration_ms  integer,
  alt_text     text,
  created_at   timestamptz not null default now()
);

comment on table public.media_assets is 'Metadata for user uploads in Supabase Storage. Path is owner-scoped: {user_id}/{uuid}.{ext}';

create index if not exists media_assets_user_idx on public.media_assets (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- posts — the master record the composer edits
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  title            text,
  -- Master draft. Per-platform overrides live in platform_content.
  content          text not null default '',
  platform_content jsonb not null default '{}'::jsonb,
  first_comment    jsonb not null default '{}'::jsonb,
  -- Ordered [{ asset_id, url, kind, alt_text }] resolved at publish time.
  media            jsonb not null default '[]'::jsonb,
  media_type       text not null default 'text'
                     check (media_type in ('text','image','video','carousel')),
  target_platforms text[] not null default '{}',
  status           text not null default 'draft'
                     check (status in ('draft','scheduled','publishing','published','failed','cancelled')),
  scheduled_at     timestamptz,
  published_at     timestamptz,
  publish_attempts integer not null default 0 check (publish_attempts >= 0),
  last_error       text,
  -- Deterministic local heuristic score, not a platform metric.
  viral_score      jsonb,
  tags             text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- A scheduled post must have a time; anything published must have a timestamp.
  constraint posts_scheduled_requires_time
    check (status <> 'scheduled' or scheduled_at is not null),
  constraint posts_published_requires_time
    check (status <> 'published' or published_at is not null)
);

comment on table public.posts is 'Master post. One row per composed post regardless of how many platforms it targets.';
comment on column public.posts.status is 'draft | scheduled | publishing | published | failed | cancelled';

create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);
create index if not exists posts_user_status_idx on public.posts (user_id, status);
-- Calendar range queries.
create index if not exists posts_user_scheduled_idx on public.posts (user_id, scheduled_at)
  where scheduled_at is not null;
-- The cron's hot path: find everything due.
create index if not exists posts_due_idx on public.posts (scheduled_at)
  where status = 'scheduled';
-- Full-text search for the content library.
create index if not exists posts_search_idx on public.posts
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || content));

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- post_targets — one row per (post, platform). Holds the real publish result.
-- ---------------------------------------------------------------------------
create table if not exists public.post_targets (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.posts (id) on delete cascade,
  -- Denormalised so RLS can authorise without a join on every row.
  user_id           uuid not null references auth.users (id) on delete cascade,
  social_account_id uuid references public.social_accounts (id) on delete set null,
  platform          text not null
                      check (platform in ('instagram','tiktok','twitter','linkedin','facebook','threads','youtube')),
  -- The exact text sent to the platform, frozen at publish time.
  resolved_content  text,
  status            text not null default 'pending'
                      check (status in ('pending','publishing','published','failed','skipped','cancelled')),
  -- Identifiers returned BY the platform. Proof a publish actually happened.
  remote_post_id    text,
  remote_url        text,
  attempts          integer not null default 0 check (attempts >= 0),
  last_error        text,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (post_id, platform)
);

comment on table public.post_targets is 'Per-platform publish outcome for a post. remote_post_id is the only proof of publication.';
comment on column public.post_targets.remote_post_id is 'ID returned by the platform API. Absent means NOT published, whatever the UI says.';

create index if not exists post_targets_post_idx on public.post_targets (post_id);
create index if not exists post_targets_user_idx on public.post_targets (user_id, created_at desc);
create index if not exists post_targets_account_idx on public.post_targets (social_account_id)
  where social_account_id is not null;
-- Drives metric collection: published targets we can still poll for insights.
create index if not exists post_targets_published_idx on public.post_targets (published_at desc)
  where status = 'published';

drop trigger if exists post_targets_set_updated_at on public.post_targets;
create trigger post_targets_set_updated_at
  before update on public.post_targets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- claim_due_posts — atomic job claim for the publishing worker.
--
-- Flips due `scheduled` posts to `publishing` and returns them. FOR UPDATE
-- SKIP LOCKED means two overlapping cron invocations can never claim the same
-- post, so a post cannot be double-published. Service-role only.
-- ---------------------------------------------------------------------------
create or replace function public.claim_due_posts(
  p_limit integer default 25,
  p_grace_seconds integer default 30
)
returns setof public.posts
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select p.id
    from public.posts p
    where p.status = 'scheduled'
      and p.scheduled_at <= now() + make_interval(secs => p_grace_seconds)
    order by p.scheduled_at asc
    limit p_limit
    for update skip locked
  )
  update public.posts p
     set status = 'publishing',
         publish_attempts = p.publish_attempts + 1,
         last_error = null,
         updated_at = now()
   where p.id in (select id from due)
  returning p.*;
end;
$$;

revoke all on function public.claim_due_posts(integer, integer) from public, anon, authenticated;

comment on function public.claim_due_posts is 'Atomically claims due scheduled posts for publishing. Service role only.';

-- ---------------------------------------------------------------------------
-- reclaim_stuck_posts — recover jobs orphaned by a crashed/timed-out worker.
-- ---------------------------------------------------------------------------
create or replace function public.reclaim_stuck_posts(p_stale_minutes integer default 15)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  with stuck as (
    update public.posts
       set status = case when publish_attempts >= 3 then 'failed' else 'scheduled' end,
           last_error = case
             when publish_attempts >= 3
               then 'Publishing timed out after 3 attempts. Please retry manually.'
             else 'Worker did not finish; re-queued automatically.'
           end,
           updated_at = now()
     where status = 'publishing'
       and updated_at < now() - make_interval(mins => p_stale_minutes)
    returning 1
  )
  select count(*)::integer into affected from stuck;
  return affected;
end;
$$;

revoke all on function public.reclaim_stuck_posts(integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.media_assets enable row level security;
alter table public.posts        enable row level security;
alter table public.post_targets enable row level security;

drop policy if exists "media_assets_all_own" on public.media_assets;
create policy "media_assets_all_own" on public.media_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "posts_all_own" on public.posts;
create policy "posts_all_own" on public.posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "post_targets_all_own" on public.post_targets;
create policy "post_targets_all_own" on public.post_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
