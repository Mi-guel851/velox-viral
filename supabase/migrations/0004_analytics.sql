-- ============================================================================
-- Velox Viral — 0004_analytics
-- Normalised platform metrics + daily rollups + server-side aggregation.
--
-- Every metric here originates from a platform API response. Nothing is
-- synthesised. A user with no connected accounts has no rows, and the UI is
-- expected to render an empty state rather than invent numbers.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- post_metrics — time series of insights for a published target.
--
-- Append-only per collection run so follower/impression deltas and growth
-- curves are derivable. `collected_for` is the UTC day the sample belongs to,
-- which keeps one authoritative sample per target per day.
-- ---------------------------------------------------------------------------
create table if not exists public.post_metrics (
  id              uuid primary key default gen_random_uuid(),
  post_target_id  uuid not null references public.post_targets (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  platform        text not null
                    check (platform in ('instagram','tiktok','twitter','linkedin','facebook','threads','youtube')),
  collected_for   date not null,
  collected_at    timestamptz not null default now(),

  impressions     bigint not null default 0 check (impressions >= 0),
  reach           bigint not null default 0 check (reach >= 0),
  likes           bigint not null default 0 check (likes >= 0),
  comments        bigint not null default 0 check (comments >= 0),
  shares          bigint not null default 0 check (shares >= 0),
  saves           bigint not null default 0 check (saves >= 0),
  clicks          bigint not null default 0 check (clicks >= 0),
  video_views     bigint not null default 0 check (video_views >= 0),
  -- Stored as a percentage, e.g. 4.82 means 4.82%. Computed from the raw
  -- counters by the collector, never guessed.
  engagement_rate numeric(6,3) not null default 0 check (engagement_rate >= 0),
  -- Untouched provider payload, for debugging and for metrics we don't model yet.
  raw             jsonb not null default '{}'::jsonb,

  unique (post_target_id, collected_for)
);

comment on table public.post_metrics is 'Per-post platform insights, one authoritative sample per target per UTC day.';
comment on column public.post_metrics.engagement_rate is 'Percentage (4.82 = 4.82%), derived from raw counters by the collector.';

create index if not exists post_metrics_user_day_idx on public.post_metrics (user_id, collected_for desc);
create index if not exists post_metrics_target_idx on public.post_metrics (post_target_id, collected_for desc);
create index if not exists post_metrics_platform_idx on public.post_metrics (user_id, platform, collected_for desc);

-- ---------------------------------------------------------------------------
-- analytics_snapshots — daily per-account rollup (account-level, not per post).
-- Source of truth for follower growth and channel totals.
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_snapshots (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  platform          text not null
                      check (platform in ('instagram','tiktok','twitter','linkedin','facebook','threads','youtube')),
  snapshot_date     date not null,

  followers         bigint not null default 0 check (followers >= 0),
  -- Net change vs the previous snapshot. Can legitimately be negative.
  followers_delta   bigint not null default 0,
  impressions       bigint not null default 0 check (impressions >= 0),
  reach             bigint not null default 0 check (reach >= 0),
  likes             bigint not null default 0 check (likes >= 0),
  comments          bigint not null default 0 check (comments >= 0),
  shares            bigint not null default 0 check (shares >= 0),
  saves             bigint not null default 0 check (saves >= 0),
  clicks            bigint not null default 0 check (clicks >= 0),
  posts_count       integer not null default 0 check (posts_count >= 0),
  engagement_rate   numeric(6,3) not null default 0 check (engagement_rate >= 0),
  raw               jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),

  unique (social_account_id, snapshot_date)
);

comment on table public.analytics_snapshots is 'Daily account-level rollup per connected channel. Drives follower growth trends.';

create index if not exists analytics_snapshots_user_date_idx
  on public.analytics_snapshots (user_id, snapshot_date desc);
create index if not exists analytics_snapshots_platform_idx
  on public.analytics_snapshots (user_id, platform, snapshot_date desc);

-- ---------------------------------------------------------------------------
-- Aggregation: one shared implementation so every new platform plugs into the
-- same maths. All three functions are owner-scoped via auth.uid() and are safe
-- to call directly from the client with an authenticated session.
-- ---------------------------------------------------------------------------

-- Headline KPIs for a date range.
create or replace function public.analytics_summary(
  p_from date,
  p_to   date
)
returns table (
  total_followers      bigint,
  followers_delta      bigint,
  follower_growth_pct  numeric,
  total_impressions    bigint,
  total_reach          bigint,
  total_likes          bigint,
  total_comments       bigint,
  total_shares         bigint,
  total_saves          bigint,
  total_clicks         bigint,
  total_engagement     bigint,
  avg_engagement_rate  numeric,
  posts_published      bigint,
  connected_accounts   bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with
  -- Latest snapshot per account inside the window = current audience size.
  latest as (
    select distinct on (social_account_id)
           social_account_id, followers
      from public.analytics_snapshots
     where user_id = auth.uid()
       and snapshot_date between p_from and p_to
     order by social_account_id, snapshot_date desc
  ),
  -- Earliest snapshot per account = baseline for growth.
  earliest as (
    select distinct on (social_account_id)
           social_account_id, followers
      from public.analytics_snapshots
     where user_id = auth.uid()
       and snapshot_date between p_from and p_to
     order by social_account_id, snapshot_date asc
  ),
  audience as (
    select
      coalesce((select sum(followers) from latest), 0)::bigint   as now_followers,
      coalesce((select sum(followers) from earliest), 0)::bigint as then_followers
  ),
  -- Post-level engagement uses the newest sample per target in the window so
  -- cumulative counters are not double-counted across days.
  newest_per_target as (
    select distinct on (post_target_id)
           post_target_id, impressions, reach, likes, comments, shares,
           saves, clicks, engagement_rate
      from public.post_metrics
     where user_id = auth.uid()
       and collected_for between p_from and p_to
     order by post_target_id, collected_for desc
  ),
  engagement as (
    select
      coalesce(sum(impressions), 0)::bigint as impressions,
      coalesce(sum(reach), 0)::bigint       as reach,
      coalesce(sum(likes), 0)::bigint       as likes,
      coalesce(sum(comments), 0)::bigint    as comments,
      coalesce(sum(shares), 0)::bigint      as shares,
      coalesce(sum(saves), 0)::bigint       as saves,
      coalesce(sum(clicks), 0)::bigint      as clicks,
      round(coalesce(avg(engagement_rate), 0), 2) as avg_rate
      from newest_per_target
  ),
  published as (
    select count(*)::bigint as n
      from public.post_targets
     where user_id = auth.uid()
       and status = 'published'
       and published_at::date between p_from and p_to
  ),
  accounts as (
    select count(*)::bigint as n
      from public.social_accounts
     where user_id = auth.uid()
       and status = 'connected'
  )
  select
    a.now_followers,
    (a.now_followers - a.then_followers),
    case when a.then_followers > 0
         then round(((a.now_followers - a.then_followers)::numeric / a.then_followers) * 100, 1)
         else 0
    end,
    e.impressions, e.reach, e.likes, e.comments, e.shares, e.saves, e.clicks,
    (e.likes + e.comments + e.shares + e.saves),
    e.avg_rate,
    p.n,
    ac.n
  from audience a, engagement e, published p, accounts ac;
$$;

comment on function public.analytics_summary is 'Owner-scoped headline analytics for a date range. Returns zeros when no data exists.';

-- Daily series for charts. Gap-filled so a chart never shows a broken line.
create or replace function public.analytics_timeseries(
  p_from date,
  p_to   date
)
returns table (
  day         date,
  impressions bigint,
  reach       bigint,
  engagement  bigint,
  followers   bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as day
  ),
  post_daily as (
    select collected_for as day,
           sum(impressions)::bigint as impressions,
           sum(reach)::bigint       as reach,
           sum(likes + comments + shares + saves)::bigint as engagement
      from public.post_metrics
     where user_id = auth.uid()
       and collected_for between p_from and p_to
     group by collected_for
  ),
  follower_daily as (
    select snapshot_date as day, sum(followers)::bigint as followers
      from public.analytics_snapshots
     where user_id = auth.uid()
       and snapshot_date between p_from and p_to
     group by snapshot_date
  )
  select d.day,
         coalesce(pd.impressions, 0),
         coalesce(pd.reach, 0),
         coalesce(pd.engagement, 0),
         coalesce(fd.followers, 0)
    from days d
    left join post_daily pd     on pd.day = d.day
    left join follower_daily fd on fd.day = d.day
   order by d.day asc;
$$;

comment on function public.analytics_timeseries is 'Gap-filled daily analytics series for charting. Owner-scoped.';

-- Per-platform breakdown for the channel cards.
create or replace function public.analytics_by_platform(
  p_from date,
  p_to   date
)
returns table (
  platform        text,
  followers       bigint,
  followers_delta bigint,
  impressions     bigint,
  engagement      bigint,
  posts_count     bigint,
  engagement_rate numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest as (
    select distinct on (social_account_id)
           social_account_id, platform, followers
      from public.analytics_snapshots
     where user_id = auth.uid()
       and snapshot_date between p_from and p_to
     order by social_account_id, snapshot_date desc
  ),
  earliest as (
    select distinct on (social_account_id)
           social_account_id, platform, followers
      from public.analytics_snapshots
     where user_id = auth.uid()
       and snapshot_date between p_from and p_to
     order by social_account_id, snapshot_date asc
  ),
  aud as (
    select l.platform,
           sum(l.followers)::bigint as followers,
           (sum(l.followers) - coalesce(sum(e.followers), 0))::bigint as delta
      from latest l
      left join earliest e on e.social_account_id = l.social_account_id
     group by l.platform
  ),
  newest_per_target as (
    select distinct on (post_target_id)
           post_target_id, platform, impressions, likes, comments, shares, saves, engagement_rate
      from public.post_metrics
     where user_id = auth.uid()
       and collected_for between p_from and p_to
     order by post_target_id, collected_for desc
  ),
  eng as (
    select platform,
           sum(impressions)::bigint as impressions,
           sum(likes + comments + shares + saves)::bigint as engagement,
           round(avg(engagement_rate), 2) as rate
      from newest_per_target
     group by platform
  ),
  pub as (
    select platform, count(*)::bigint as n
      from public.post_targets
     where user_id = auth.uid()
       and status = 'published'
       and published_at::date between p_from and p_to
     group by platform
  ),
  -- Union of platforms so a connected-but-quiet channel still appears at zero.
  keys as (
    select platform from aud
    union select platform from eng
    union select platform from pub
    union select platform from public.social_accounts
      where user_id = auth.uid() and status = 'connected'
  )
  select k.platform,
         coalesce(a.followers, 0),
         coalesce(a.delta, 0),
         coalesce(e.impressions, 0),
         coalesce(e.engagement, 0),
         coalesce(p.n, 0),
         coalesce(e.rate, 0)
    from keys k
    left join aud a on a.platform = k.platform
    left join eng e on e.platform = k.platform
    left join pub p on p.platform = k.platform
   order by coalesce(a.followers, 0) desc;
$$;

comment on function public.analytics_by_platform is 'Per-channel analytics breakdown. Connected channels appear with zeros when quiet.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.post_metrics        enable row level security;
alter table public.analytics_snapshots enable row level security;

-- Read-only for the owner: metrics are written exclusively by the server-side
-- collector, so a client can never fabricate its own analytics.
drop policy if exists "post_metrics_select_own" on public.post_metrics;
create policy "post_metrics_select_own" on public.post_metrics
  for select using (auth.uid() = user_id);

drop policy if exists "analytics_snapshots_select_own" on public.analytics_snapshots;
create policy "analytics_snapshots_select_own" on public.analytics_snapshots
  for select using (auth.uid() = user_id);
