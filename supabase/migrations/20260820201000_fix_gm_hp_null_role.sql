begin;

create or replace function public.gm_set_character_hp(
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
  'Permissão granular de PV; recusa explicitamente papel ausente, além de qualquer papel diferente de gm.';

revoke all privileges on function public.gm_set_character_hp(uuid, integer, bigint)
from public, anon;
grant execute on function public.gm_set_character_hp(uuid, integer, bigint)
to authenticated;

commit;
