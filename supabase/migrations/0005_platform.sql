-- ============================================================================
-- Velox Viral — 0005_platform
-- AI generation log, content templates, notifications, activity audit trail,
-- and the server-side usage metering function.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- content_generations — audit + history of every AI call.
-- Doubles as the source for usage metering and lets users revisit past output.
-- ---------------------------------------------------------------------------
create table if not exists public.content_generations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         text not null
                 check (kind in ('captions','hooks','hashtags','cta','repurpose','improve','variations')),
  platform     text check (platform in ('instagram','tiktok','twitter','linkedin','facebook','threads','youtube')),
  prompt       text not null,
  params       jsonb not null default '{}'::jsonb,
  result       jsonb,
  model        text,
  input_tokens  integer,
  output_tokens integer,
  latency_ms   integer,
  status       text not null default 'succeeded'
                 check (status in ('succeeded','failed')),
  error        text,
  created_at   timestamptz not null default now()
);

comment on table public.content_generations is 'History and audit of AI generations. Written server-side only.';

create index if not exists content_generations_user_idx
  on public.content_generations (user_id, created_at desc);
create index if not exists content_generations_kind_idx
  on public.content_generations (user_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- content_templates — user-owned reusable post blueprints
-- ---------------------------------------------------------------------------
create table if not exists public.content_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  platform    text not null default 'all'
                check (platform in ('all','instagram','tiktok','twitter','linkedin','facebook','threads','youtube')),
  category    text not null default 'General',
  content     text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.content_templates is 'User-created post templates for the content library.';

create index if not exists content_templates_user_idx
  on public.content_templates (user_id, created_at desc);

drop trigger if exists content_templates_set_updated_at on public.content_templates;
create trigger content_templates_set_updated_at
  before update on public.content_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notifications — emitted by real backend events only
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null
               check (type in (
                 'post_published','post_failed','post_partial',
                 'account_connected','account_disconnected','account_expiring',
                 'schedule_upcoming','ai_completed','analytics_updated',
                 'subscription_updated'
               )),
  title      text not null,
  body       text,
  -- Deep-link payload, e.g. { "post_id": "...", "platform": "instagram" }
  data       jsonb not null default '{}'::jsonb,
  severity   text not null default 'info' check (severity in ('info','success','warning','error')),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'In-app notifications. Inserted by server-side events; clients may only read and mark read.';

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
-- Unread badge count.
create index if not exists notifications_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- activity_logs — append-only audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.activity_logs is 'Append-only audit trail of user-visible actions. Powers the dashboard activity feed.';

create index if not exists activity_logs_user_idx
  on public.activity_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- increment_usage — security-definer metering.
--
-- Runs as the definer so `usage_counters` stays read-only to clients: a user
-- cannot zero out their own quota to bypass plan limits.
-- ---------------------------------------------------------------------------
create or replace function public.increment_usage(
  p_user_id uuid,
  p_metric  text,
  p_amount  integer default 1
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  period date := date_trunc('month', now())::date;
  new_count integer;
begin
  insert into public.usage_counters (user_id, metric, period_start, count)
  values (p_user_id, p_metric, period, p_amount)
  on conflict (user_id, metric, period_start)
    do update set count = public.usage_counters.count + p_amount,
                  updated_at = now()
  returning count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_usage(uuid, text, integer) from public, anon, authenticated;

comment on function public.increment_usage is 'Atomically increments a monthly usage counter. Service role only.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.content_generations enable row level security;
alter table public.content_templates   enable row level security;
alter table public.notifications       enable row level security;
alter table public.activity_logs       enable row level security;

-- AI history: readable by the owner; rows are written by the server route.
drop policy if exists "content_generations_select_own" on public.content_generations;
create policy "content_generations_select_own" on public.content_generations
  for select using (auth.uid() = user_id);

-- Templates are fully user-managed.
drop policy if exists "content_templates_all_own" on public.content_templates;
create policy "content_templates_all_own" on public.content_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications: read + mark-as-read. No client inserts, so the feed can only
-- ever reflect genuine backend events.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- Audit log is read-only to the owner; append-only from the server.
drop policy if exists "activity_logs_select_own" on public.activity_logs;
create policy "activity_logs_select_own" on public.activity_logs
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime: publish the tables the UI subscribes to, so publish status,
-- notifications and account health update without polling.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- add_table is idempotent-unsafe, so guard each one.
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;

    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
    ) then
      alter publication supabase_realtime add table public.posts;
    end if;

    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_targets'
    ) then
      alter publication supabase_realtime add table public.post_targets;
    end if;

    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'social_accounts'
    ) then
      alter publication supabase_realtime add table public.social_accounts;
    end if;
  end if;
end
$$;
