-- Link a collaborative share to its source personal folder by stable ID.
-- Legacy rows remain valid with a null personal_folder_id and are adopted
-- lazily by the Edge Function when their owner next opens sharing controls.

alter table public.seekmy_bookmark_folder_shares
  add column if not exists personal_folder_id text;

alter table public.seekmy_bookmark_folder_shares
  drop constraint if exists seekmy_bookmark_folder_shares_firebase_uid_folder_key_key;

create unique index if not exists seekmy_bookmark_folder_shares_personal_folder_idx
  on public.seekmy_bookmark_folder_shares(firebase_uid, personal_folder_id)
  where personal_folder_id is not null;
