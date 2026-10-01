begin;

alter table public.campaigns
  add column skill_limit integer not null default 70,
  add column rules_revision bigint not null default 1,
  add constraint campaigns_skill_limit_range check (skill_limit between 1 and 999),
  add constraint campaigns_rules_revision_positive check (rules_revision > 0);

grant insert (skill_limit) on table public.campaigns to authenticated;

create or replace function public.update_campaign_details(
  p_campaign_id uuid,
  p_name text,
  p_description text,
  p_skill_limit integer
)
returns public.campaigns
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := pg_catalog.btrim(coalesce(p_name, ''));
  v_description text := pg_catalog.btrim(coalesce(p_description, ''));
  v_campaign public.campaigns;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if pg_catalog.char_length(v_name) not between 1 and 100
    or pg_catalog.char_length(v_description) > 5000
    or p_skill_limit is null or p_skill_limit not between 1 and 999 then
    raise exception 'invalid campaign settings' using errcode = '22023';
  end if;
  update public.campaigns
  set name = v_name,
      description = v_description,
      skill_limit = p_skill_limit,
      rules_revision = rules_revision + case when skill_limit <> p_skill_limit then 1 else 0 end
  where id = p_campaign_id and owner_id = v_user_id
  returning * into v_campaign;
  if not found then
    raise exception 'campaign owner required' using errcode = '42501';
  end if;
  return v_campaign;
end;
$$;

revoke all privileges on function public.update_campaign_details(uuid, text, text, integer)
from public, anon, authenticated;
grant execute on function public.update_campaign_details(uuid, text, text, integer) to authenticated;

create or replace function private.enforce_character_slots()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(28901, pg_catalog.hashtext(v_user_id::text));
  select count(*) into v_count from public.characters where owner_id = v_user_id;
  if v_count >= 5 then
    raise exception 'character slots full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all privileges on function private.enforce_character_slots() from public, anon, authenticated;
create trigger marufia_character_slots_before_insert
before insert on public.characters
for each row execute function private.enforce_character_slots();

create or replace function public.delete_character(
  p_character_id uuid,
  p_confirmation_name text,
  p_expected_revision bigint
)
returns table (character_id uuid, character_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_character public.characters;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into v_character from public.characters
  where id = p_character_id and owner_id = v_user_id for update;
  if not found then
    raise exception 'character owner required' using errcode = '42501';
  end if;
  if pg_catalog.btrim(coalesce(p_confirmation_name, '')) <> v_character.name then
    raise exception 'character name confirmation mismatch' using errcode = '22023';
  end if;
  if p_expected_revision is null or p_expected_revision <> v_character.revision then
    raise exception 'character revision conflict' using errcode = '40001';
  end if;
  delete from public.characters where id = v_character.id and owner_id = v_user_id;
  return query select v_character.id, v_character.name;
end;
$$;

revoke all privileges on function public.delete_character(uuid, text, bigint)
from public, anon, authenticated;
grant execute on function public.delete_character(uuid, text, bigint) to authenticated;

commit;
