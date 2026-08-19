insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('seekmy-photos', 'seekmy-photos', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('contributor-documents', 'contributor-documents', false, 5242880, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "SeekMY users upload own files" on storage.objects;
drop policy if exists "SeekMY users update own files" on storage.objects;
drop policy if exists "SeekMY users delete own files" on storage.objects;
drop policy if exists "SeekMY users read own private files" on storage.objects;

create policy "SeekMY users upload own files" on storage.objects for insert to anon, authenticated
with check (bucket_id in ('seekmy-photos','contributor-documents') and (auth.jwt()->>'sub') is not null and (storage.foldername(name))[1] = (auth.jwt()->>'sub'));
create policy "SeekMY users update own files" on storage.objects for update to anon, authenticated
using (owner_id = (auth.jwt()->>'sub')) with check (owner_id = (auth.jwt()->>'sub'));
create policy "SeekMY users delete own files" on storage.objects for delete to anon, authenticated
using (owner_id = (auth.jwt()->>'sub'));
create policy "SeekMY users read own private files" on storage.objects for select to anon, authenticated
using (bucket_id = 'contributor-documents' and owner_id = (auth.jwt()->>'sub'));
