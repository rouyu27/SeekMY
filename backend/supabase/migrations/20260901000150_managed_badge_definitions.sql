create table if not exists public.seekmy_badge_definitions (
  id uuid primary key default gen_random_uuid(),
  badge_key text not null unique,
  name text not null,
  description text not null,
  name_ms text not null default '',
  description_ms text not null default '',
  name_zh text not null default '',
  description_zh text not null default '',
  icon text not null default '',
  image_url text not null default '',
  metric text not null,
  requirement numeric not null,
  display_order integer not null default 0,
  status text not null default 'active',
  is_system boolean not null default false,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seekmy_badge_definition_requirement_positive check (requirement > 0),
  constraint seekmy_badge_definition_status_valid check (status in ('active', 'archived')),
  constraint seekmy_badge_definition_metric_valid check (
    metric in ('activities', 'states', 'km', 'gems', 'reviews', 'hikes', 'dives', 'cycleKm', 'camps')
  )
);

create index if not exists seekmy_badge_definitions_status_order_idx
  on public.seekmy_badge_definitions(status, display_order, created_at);

alter table public.seekmy_badge_definitions enable row level security;
revoke all on table public.seekmy_badge_definitions from anon, authenticated;
grant select, insert, update, delete on table public.seekmy_badge_definitions to service_role;

insert into public.seekmy_badge_definitions
  (badge_key, name, description, icon, metric, requirement, display_order, status, is_system)
values
  ('first-footstep', 'First Footstep', 'Log your first outdoor activity', '👣', 'activities', 1, 10, 'active', true),
  ('state-explorer', 'State Explorer', 'Visit 3 different Malaysian states', '🗺️', 'states', 3, 20, 'active', true),
  ('malaysia-wanderer', 'Malaysia Wanderer', 'Visit 5 different Malaysian states', '🇲🇾', 'states', 5, 30, 'active', true),
  ('hidden-gem-hunter', 'Hidden Gem Hunter', 'Visit 3 hidden-gem locations', '💎', 'gems', 3, 40, 'active', true),
  ('first-contribution', 'First Contribution', 'Write your first community review', '✍️', 'reviews', 1, 50, 'active', true),
  ('local-storyteller', 'Local Storyteller', 'Write 3 community reviews', '📖', 'reviews', 3, 60, 'active', true),
  ('trusted-contributor', 'Trusted Contributor', 'Write 5 community reviews', '✅', 'reviews', 5, 70, 'active', true),
  ('community-favourite', 'Community Favourite', 'Write 10 community reviews', '⭐', 'reviews', 10, 80, 'active', true),
  ('malaysia-insider', 'Malaysia Insider', 'Log 100 km of outdoor activities', '🏅', 'km', 100, 90, 'active', true)
on conflict (badge_key) do nothing;
