begin;

alter table public.rolls
add column if not exists character_name text;

update public.rolls as rolls
set character_name = coalesce(characters.name, 'Personagem removido')
from public.characters as characters
where rolls.character_id = characters.id
  and rolls.character_name is null;

update public.rolls
set character_name = 'Personagem removido'
where character_name is null;

alter table public.rolls
alter column character_name set not null;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'rolls_character_name_length'
      and conrelid = 'public.rolls'::regclass
  ) then
    alter table public.rolls
    add constraint rolls_character_name_length check (
      char_length(btrim(character_name)) between 1 and 120
    );
  end if;
end;
$$;

comment on column public.rolls.character_name is
  'Nome do personagem no instante da rolagem; evita expor o documento integral da ficha a outros participantes.';

grant select (character_name) on table public.rolls to authenticated;

update public.rolls as rolls
set visibility = 'gm'
from public.campaign_members as members
where members.campaign_id = rolls.campaign_id
  and members.user_id = rolls.user_id
  and members.role = 'gm'
  and rolls.visibility = 'public';

drop policy rolls_select_public_campaign_gm on public.rolls;

create policy rolls_select_by_campaign_visibility
on public.rolls
for select
to authenticated
using (
  private.campaign_role(campaign_id) is not null
  and (
    visibility = 'public'
    or (
      visibility = 'secret'
      and (
        user_id = (select auth.uid())
        or private.campaign_role(campaign_id) = 'gm'
      )
    )
    or (
      visibility = 'gm'
      and user_id = (select auth.uid())
      and private.campaign_role(campaign_id) = 'gm'
    )
  )
);

comment on policy rolls_select_by_campaign_visibility on public.rolls is
  'Public: participantes; secret: autor e Mæstre; gm: somente o próprio Mæstre autor.';

drop function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text);

create function public.record_roll(
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
  p_outcome text,
  p_visibility text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_campaign_id uuid;
  v_character_name text;
  v_role text;
  v_visibility text;
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

  select characters.campaign_id, characters.name
  into v_campaign_id, v_character_name
  from public.characters as characters
  where characters.id = p_character_id
    and characters.owner_id = v_user_id;

  if not found then
    raise exception 'character owner required' using errcode = '42501';
  end if;
  if v_campaign_id is null then
    raise exception 'character campaign required' using errcode = 'P0002';
  end if;

  select members.role
  into v_role
  from public.campaign_members as members
  where members.campaign_id = v_campaign_id
    and members.user_id = v_user_id;

  if not found then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;
  if p_visibility is null or p_visibility not in ('public', 'secret') then
    raise exception 'invalid requested roll visibility' using errcode = '22023';
  end if;

  v_visibility := case when v_role = 'gm' then 'gm' else p_visibility end;

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
      and v_existing.character_name = v_character_name
      and v_existing.roll_type = p_roll_type
      and v_existing.skill_name is not distinct from p_skill_name
      and v_existing.mode is not distinct from p_mode
      and v_existing.formula is not distinct from p_formula
      and v_existing.raw_roll = p_raw_roll
      and v_existing.modifier is not distinct from p_modifier
      and v_existing.target is not distinct from p_target
      and v_existing.total is not distinct from p_total
      and v_existing.outcome is not distinct from p_outcome
      and v_existing.visibility = v_visibility then
      return jsonb_build_object('id', v_existing.id, 'visibility', v_existing.visibility);
    end if;
    raise exception 'roll identifier already used' using errcode = '23505';
  end if;

  insert into public.rolls (
    id,
    campaign_id,
    character_id,
    user_id,
    character_name,
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
    v_character_name,
    p_roll_type,
    nullif(btrim(p_skill_name), ''),
    p_mode,
    p_formula,
    p_raw_roll,
    p_modifier,
    p_target,
    p_total,
    p_outcome,
    v_visibility
  );

  return jsonb_build_object('id', p_roll_id, 'visibility', v_visibility);
end;
$$;

comment on function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text, text) is
  'Registra uma rolagem com personagem e identidade derivados; Mæstre sempre privado, jogadores public ou secret.';

revoke all privileges on function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text, text)
from public, anon, authenticated;
grant execute on function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text, text)
to authenticated;

commit;
