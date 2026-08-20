-- SeekMY server-owned data used by the seekmy-backend Edge Function.
-- Run this file once in Supabase Dashboard > SQL Editor.

create table if not exists public.seekmy_activities (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  location_id text not null,
  location_name text not null,
  state text not null default '',
  activity text not null default '',
  is_hidden_gem boolean not null default false,
  distance_km numeric(8,2) not null check (distance_km > 0 and distance_km <= 1000),
  duration text not null default '',
  activity_date date not null check (activity_date <= current_date),
  notes text not null default '',
  comment text not null default '',
  photo_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists seekmy_activities_user_idx on public.seekmy_activities(firebase_uid, activity_date desc);
create index if not exists seekmy_activities_period_idx on public.seekmy_activities(activity_date desc);

create table if not exists public.seekmy_reviews (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  location_id text not null,
  location_name text not null,
  user_name text not null default 'Explorer',
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 2000),
  photo_url text not null default '',
  status text not null default 'approved' check (status in ('approved','flagged','removed','rejected')),
  flag_reason text,
  flagged_by text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists seekmy_one_active_review_idx
  on public.seekmy_reviews(firebase_uid, location_id)
  where status not in ('removed','rejected');
create index if not exists seekmy_reviews_location_idx on public.seekmy_reviews(location_id, created_at desc);

create table if not exists public.seekmy_badges (
  firebase_uid text not null,
  badge_key text not null,
  name text not null,
  description text not null,
  icon text not null,
  progress numeric not null default 0,
  earned_at timestamptz not null default now(),
  primary key (firebase_uid, badge_key)
);

create table if not exists public.seekmy_user_stats (
  firebase_uid text primary key,
  display_name text not null default 'Explorer',
  total_km numeric(10,2) not null default 0,
  checkins integer not null default 0,
  states integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.seekmy_activities enable row level security;
alter table public.seekmy_reviews enable row level security;
alter table public.seekmy_badges enable row level security;
alter table public.seekmy_user_stats enable row level security;

-- No browser policies are intentionally created. Only the Edge Function's
-- built-in service-role client can access these tables.
