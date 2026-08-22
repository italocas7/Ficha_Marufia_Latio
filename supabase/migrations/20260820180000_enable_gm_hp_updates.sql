begin;

create or replace function private.version_character_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested_origin text;
begin
  if tg_op = 'INSERT' then
    new.revision := 1;
  else
    new.revision := old.revision + 1;
  end if;

  v_requested_origin := current_setting('marufia.character_change_origin', true);
  if (select auth.uid()) is null then
    new.last_change_origin := 'system';
  elsif v_requested_origin = 'gm'
    and new.campaign_id is not null
    and private.campaign_role(new.campaign_id) = 'gm' then
    new.last_change_origin := 'gm';
  else
    new.last_change_origin := 'player';
  end if;

  return new;
end;
$$;

comment on function private.version_character_write() is
  'Versiona a ficha e reconhece origem gm somente quando o papel é confirmado na campanha pelo servidor.';

revoke all privileges on function private.version_character_write()
from public, anon, authenticated;

create function public.gm_set_character_hp(
  p_character_id uuid,
  p_hp_current integer,
  p_expected_revision bigint
)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_campaign_id uuid;
  v_character public.characters;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_hp_current is null or p_hp_current < 0 or p_hp_current > 1000000 then
    raise exception 'invalid character hp value' using errcode = '22023';
  end if;
  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'invalid expected character revision' using errcode = '22023';
  end if;

  select characters.campaign_id
  into v_campaign_id
  from public.characters as characters
  where characters.id = p_character_id;

  if not found or v_campaign_id is null then
    raise exception 'campaign character required' using errcode = 'P0002';
  end if;
  if private.campaign_role(v_campaign_id) is distinct from 'gm' then
    raise exception 'campaign gm required' using errcode = '42501';
  end if;

  perform set_config('marufia.character_change_origin', 'gm', true);
  update public.characters as characters
  set state = jsonb_set(
    characters.state,
    '{resources,hpCurrent}',
    to_jsonb(p_hp_current),
    true
  )
  where characters.id = p_character_id
    and characters.campaign_id = v_campaign_id
    and characters.revision = p_expected_revision
  returning characters.* into v_character;

  if not found then
    raise exception 'character revision conflict' using errcode = '40001';
  end if;

  return v_character;
end;
$$;

comment on function public.gm_set_character_hp(uuid, integer, bigint) is
  'Permissão granular: o Mæstre altera somente o PV atual de personagem da própria campanha, com revisão esperada.';

revoke all privileges on function public.gm_set_character_hp(uuid, integer, bigint)
from public, anon;
grant execute on function public.gm_set_character_hp(uuid, integer, bigint)
to authenticated;

commit;
