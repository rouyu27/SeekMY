create table if not exists public.seekmy_bookmark_folder_shares (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  folder_key text not null,
  folder_name text not null check (char_length(folder_name) between 1 and 80),
  token_hash text not null unique check (char_length(token_hash) = 64),
  locations jsonb not null default '[]'::jsonb check (jsonb_typeof(locations) = 'array'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firebase_uid, folder_key)
);

create index if not exists seekmy_bookmark_folder_shares_token_idx
  on public.seekmy_bookmark_folder_shares(token_hash)
  where enabled = true;

alter table public.seekmy_bookmark_folder_shares enable row level security;

-- No browser policies are created. The Edge Function service-role client is
-- the only direct reader/writer; it returns a public-safe projection by token.
