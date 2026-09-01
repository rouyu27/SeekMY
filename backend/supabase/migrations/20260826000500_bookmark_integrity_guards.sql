-- Collaborative bookmark integrity guards.
-- Location duplication is already prevented by the primary key on
-- (folder_share_id, location_id), and duplicate membership is prevented by
-- unique (folder_share_id, firebase_uid).

update public.seekmy_bookmark_folder_members as member
set role = 'member'
from public.seekmy_bookmark_folder_shares as share
where member.folder_share_id = share.id
  and member.role = 'owner'
  and member.firebase_uid <> share.firebase_uid;

insert into public.seekmy_bookmark_folder_members (
  folder_share_id,
  firebase_uid,
  display_name,
  role,
  joined_at
)
select share.id, share.firebase_uid, 'Owner', 'owner', share.created_at
from public.seekmy_bookmark_folder_shares as share
where not exists (
  select 1
  from public.seekmy_bookmark_folder_members as member
  where member.folder_share_id = share.id
    and member.role = 'owner'
)
on conflict (folder_share_id, firebase_uid)
do update set role = 'owner';

create unique index if not exists seekmy_bookmark_folder_one_owner_idx
  on public.seekmy_bookmark_folder_members(folder_share_id)
  where role = 'owner';

create or replace function public.seekmy_validate_bookmark_folder_member_role()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_owner_uid text;
begin
  select firebase_uid
  into expected_owner_uid
  from public.seekmy_bookmark_folder_shares
  where id = new.folder_share_id;

  if expected_owner_uid is null then
    raise exception 'Shared bookmark folder does not exist';
  end if;

  if new.role = 'owner' and new.firebase_uid <> expected_owner_uid then
    raise exception 'Shared bookmark owner membership does not match the folder owner';
  end if;

  if new.role = 'member' and new.firebase_uid = expected_owner_uid then
    raise exception 'Shared bookmark owner cannot have a member role';
  end if;

  return new;
end;
$$;

drop trigger if exists seekmy_validate_bookmark_folder_member_role
  on public.seekmy_bookmark_folder_members;

create trigger seekmy_validate_bookmark_folder_member_role
before insert or update of folder_share_id, firebase_uid, role
on public.seekmy_bookmark_folder_members
for each row
execute function public.seekmy_validate_bookmark_folder_member_role();

revoke all on function public.seekmy_validate_bookmark_folder_member_role() from public;
grant execute on function public.seekmy_validate_bookmark_folder_member_role() to service_role;
