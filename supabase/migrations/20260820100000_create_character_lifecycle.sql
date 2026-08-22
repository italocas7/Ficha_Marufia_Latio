begin;

create or replace function private.prepare_character_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_schema_version_text text;
  v_character_name text;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := v_user_id;
    new.campaign_id := null;
  else
    if old.owner_id <> v_user_id then
      raise exception 'character owner required' using errcode = '42501';
    end if;
    new.owner_id := old.owner_id;
  end if;

  v_schema_version_text := new.state #>> '{meta,schemaVersion}';
  if v_schema_version_text is null
    or v_schema_version_text !~ '^[1-9][0-9]{0,4}$'
    or v_schema_version_text::integer > 32767 then
    raise exception 'invalid character schema version' using errcode = '22023';
  end if;
  new.schema_version := v_schema_version_text::smallint;

  v_character_name := btrim(coalesce(new.state #>> '{character,name}', ''));
  new.name := left(
    case when v_character_name = '' then 'Personagem sem nome' else v_character_name end,
    120
  );

  if new.campaign_id is not null and not exists (
    select 1
    from public.campaign_members as members
    where members.campaign_id = new.campaign_id
      and members.user_id = new.owner_id
  ) then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function private.prepare_character_write() is
  'Define proprietário e metadados no servidor e só permite associar o personagem a campanhas do próprio usuário.';

revoke all privileges on function private.prepare_character_write()
from public, anon, authenticated;

create trigger marufia_prepare_character_before_write
before insert or update on public.characters
for each row execute function private.prepare_character_write();

grant select on table public.characters to authenticated;
grant insert (state) on table public.characters to authenticated;
grant update (campaign_id) on table public.characters to authenticated;

create policy characters_select_owned
on public.characters
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
);

create policy characters_insert_owned
on public.characters
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
);

create policy characters_update_owned
on public.characters
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
);

commit;
