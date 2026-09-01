-- Turn the existing public bookmark-folder share into a canonical collaborative
-- folder. Firebase identities are handled by the Edge Function; browser roles
-- have no direct access to these tables.

create table if not exists public.seekmy_bookmark_folder_members (
  id uuid primary key default gen_random_uuid(),
  folder_share_id uuid not null references public.seekmy_bookmark_folder_shares(id) on delete cascade,
  firebase_uid text not null,
  display_name text not null default 'Explorer' check (char_length(display_name) between 1 and 120),
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (folder_share_id, firebase_uid)
);

create index if not exists seekmy_bookmark_folder_members_user_idx
  on public.seekmy_bookmark_folder_members(firebase_uid);

create table if not exists public.seekmy_bookmark_folder_locations (
  folder_share_id uuid not null references public.seekmy_bookmark_folder_shares(id) on delete cascade,
  location_id text not null,
  location jsonb not null check (jsonb_typeof(location) = 'object'),
  added_by text not null,
  added_at timestamptz not null default now(),
  primary key (folder_share_id, location_id)
);

create index if not exists seekmy_bookmark_folder_locations_added_by_idx
  on public.seekmy_bookmark_folder_locations(added_by);

insert into public.seekmy_bookmark_folder_members (folder_share_id, firebase_uid, display_name, role, joined_at)
select id, firebase_uid, 'Owner', 'owner', created_at
from public.seekmy_bookmark_folder_shares
on conflict (folder_share_id, firebase_uid) do nothing;

insert into public.seekmy_bookmark_folder_locations (folder_share_id, location_id, location, added_by, added_at)
select share.id, location_item ->> 'id', location_item, share.firebase_uid, share.created_at
from public.seekmy_bookmark_folder_shares as share
cross join lateral jsonb_array_elements(share.locations) as location_item
where coalesce(location_item ->> 'id', '') <> ''
on conflict (folder_share_id, location_id) do nothing;

alter table public.seekmy_bookmark_folder_members enable row level security;
alter table public.seekmy_bookmark_folder_locations enable row level security;

revoke all on table public.seekmy_bookmark_folder_members from anon, authenticated;
revoke all on table public.seekmy_bookmark_folder_locations from anon, authenticated;
grant select, insert, update, delete on table public.seekmy_bookmark_folder_members to service_role;
grant select, insert, update, delete on table public.seekmy_bookmark_folder_locations to service_role;

