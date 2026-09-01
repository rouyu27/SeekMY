alter table public.seekmy_activities
  add column if not exists status text not null default 'approved'
    check (status in ('pending','approved','rejected')),
  add column if not exists rejection_reason text not null default '',
  add column if not exists reviewed_at timestamptz,
  add column if not exists user_name text not null default 'Explorer';

create index if not exists seekmy_activities_status_idx
  on public.seekmy_activities(status, activity_date desc);

create index if not exists seekmy_activities_user_status_idx
  on public.seekmy_activities(firebase_uid, status, activity_date desc);
