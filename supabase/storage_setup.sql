-- Run this file once in Supabase Dashboard > SQL Editor.
-- Firebase Authentication tokens are trusted through Authentication > Third-Party Auth.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('seekmy-photos', 'seekmy-photos', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('contributor-documents', 'contributor-documents', false, 20971520, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "SeekMY users upload own files" on storage.objects;
drop policy if exists "SeekMY users update own files" on storage.objects;
drop policy if exists "SeekMY users delete own files" on storage.objects;
drop policy if exists "SeekMY users read own private files" on storage.objects;

create policy "SeekMY users upload own files"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id in ('seekmy-photos', 'contributor-documents')
  and (select auth.jwt()->>'sub') is not null
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

create policy "SeekMY users update own files"
on storage.objects for update to anon, authenticated
using (owner_id = (select auth.jwt()->>'sub'))
with check (owner_id = (select auth.jwt()->>'sub'));

create policy "SeekMY users delete own files"
on storage.objects for delete to anon, authenticated
using (owner_id = (select auth.jwt()->>'sub'));

create policy "SeekMY users read own private files"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'contributor-documents'
  and owner_id = (select auth.jwt()->>'sub')
);
