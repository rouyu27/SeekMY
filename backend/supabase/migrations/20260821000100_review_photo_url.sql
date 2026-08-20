alter table public.seekmy_reviews
  add column if not exists photo_url text not null default '';
