begin;

create or replace function public.record_roll(
  p_roll_id uuid,
  p_character_id uuid,
  p_roll_type text,
  p_skill_name text,
  p_mode text,
  p_formula text,
  p_raw_roll jsonb,
  p_modifier integer,
  p_target integer,
  p_total integer,
  p_outcome text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_campaign_id uuid;
  v_count integer;
  v_min integer;
  v_max integer;
  v_expected_total integer;
  v_existing public.rolls%rowtype;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_roll_id is null or p_character_id is null then
    raise exception 'roll and character identifiers are required' using errcode = '22023';
  end if;

  select characters.campaign_id
  into v_campaign_id
  from public.characters as characters
  where characters.id = p_character_id
    and characters.owner_id = v_user_id;

  if not found then
    raise exception 'character owner required' using errcode = '42501';
  end if;
  if v_campaign_id is null then
    raise exception 'character campaign required' using errcode = 'P0002';
  end if;
  if not exists (
    select 1
    from public.campaign_members as members
    where members.campaign_id = v_campaign_id
      and members.user_id = v_user_id
  ) then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;

  if p_roll_type is null
    or p_roll_type not in ('skill', 'attribute', 'combat', 'world_duration', 'core_damage_reduction')
    or p_mode is null
    or p_mode not in ('normal', 'adv', 'dis')
    or p_formula is null
    or p_total is null
    or jsonb_typeof(p_raw_roll) <> 'array'
    or jsonb_array_length(p_raw_roll) = 0
    or exists (
      select 1
      from jsonb_array_elements(p_raw_roll) as raw(value)
      where jsonb_typeof(raw.value) <> 'number'
        or raw.value::text !~ '^[0-9]+$'
    ) then
    raise exception 'invalid roll payload' using errcode = '22023';
  end if;

  select count(*), min(raw.value::text::integer), max(raw.value::text::integer)
  into v_count, v_min, v_max
  from jsonb_array_elements(p_raw_roll) as raw(value);

  if p_roll_type in ('skill', 'attribute', 'combat') then
    if p_skill_name is null
      or char_length(btrim(p_skill_name)) not between 1 and 120
      or p_modifier is distinct from 0
      or p_target is null
      or p_outcome is null
      or p_outcome not in ('Crítico natural', 'Extremo', 'Bom/Sólido', 'Normal', 'Falha')
      or v_min < 1
      or v_max > 100 then
      raise exception 'invalid d100 roll payload' using errcode = '22023';
    end if;
    if p_mode = 'normal' then
      if p_formula <> '1d100' or v_count <> 1 then
        raise exception 'invalid normal d100 roll' using errcode = '22023';
      end if;
      v_expected_total := v_min;
    elsif p_mode = 'adv' then
      if p_formula <> '2d100' or v_count <> 2 then
        raise exception 'invalid advantage d100 roll' using errcode = '22023';
      end if;
      v_expected_total := v_min;
    else
      if p_formula <> '2d100' or v_count <> 2 then
        raise exception 'invalid disadvantage d100 roll' using errcode = '22023';
      end if;
      v_expected_total := v_max;
    end if;
  elsif p_roll_type = 'world_duration' then
    if p_skill_name is not null
      or p_mode <> 'normal'
      or p_formula not in ('1d4', '1d4+2')
      or (p_formula = '1d4' and p_modifier is distinct from 0)
      or (p_formula = '1d4+2' and p_modifier is distinct from 2)
      or p_target is not null
      or p_outcome is not null
      or v_count <> 1
      or v_min < 1
      or v_max > 4 then
      raise exception 'invalid World duration roll' using errcode = '22023';
    end if;
    v_expected_total := v_min + p_modifier;
  else
    if p_skill_name is not null
      or p_mode <> 'normal'
      or p_formula <> '1d6'
      or p_modifier is distinct from 0
      or p_target is not null
      or p_outcome is not null
      or v_count <> 1
      or v_min < 1
      or v_max > 6 then
      raise exception 'invalid core damage reduction roll' using errcode = '22023';
    end if;
    v_expected_total := v_min;
  end if;

  if p_total <> v_expected_total then
    raise exception 'roll total does not match raw dice' using errcode = '22023';
  end if;

  select rolls.*
  into v_existing
  from public.rolls as rolls
  where rolls.id = p_roll_id;

  if found then
    if v_existing.campaign_id = v_campaign_id
      and v_existing.character_id = p_character_id
      and v_existing.user_id = v_user_id
      and v_existing.roll_type = p_roll_type
      and v_existing.skill_name is not distinct from p_skill_name
      and v_existing.mode is not distinct from p_mode
      and v_existing.formula is not distinct from p_formula
      and v_existing.raw_roll = p_raw_roll
      and v_existing.modifier is not distinct from p_modifier
      and v_existing.target is not distinct from p_target
      and v_existing.total is not distinct from p_total
      and v_existing.outcome is not distinct from p_outcome
      and v_existing.visibility = 'public' then
      return v_existing.id;
    end if;
    raise exception 'roll identifier already used' using errcode = '23505';
  end if;

  insert into public.rolls (
    id,
    campaign_id,
    character_id,
    user_id,
    roll_type,
    skill_name,
    mode,
    formula,
    raw_roll,
    modifier,
    target,
    total,
    outcome,
    visibility
  ) values (
    p_roll_id,
    v_campaign_id,
    p_character_id,
    v_user_id,
    p_roll_type,
    nullif(btrim(p_skill_name), ''),
    p_mode,
    p_formula,
    p_raw_roll,
    p_modifier,
    p_target,
    p_total,
    p_outcome,
    'public'
  );

  return p_roll_id;
end;
$$;

comment on function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text) is
  'Registra de forma idempotente uma rolagem atual da ficha; usuário, campanha e visibilidade são controlados no servidor.';

revoke all privileges on function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text)
from public, anon, authenticated;
grant execute on function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text)
to authenticated;

commit;
