begin;

create or replace function public.roll_dice_tray(
  p_roll_id uuid,
  p_character_id uuid,
  p_dice jsonb,
  p_visibility text,
  p_dice_theme text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_campaign_id uuid;
  v_character_name text;
  v_player_name text;
  v_total_count integer := 0;
  v_total integer := 0;
  v_type text;
  v_count integer;
  v_sides integer;
  v_result integer;
  v_tens integer;
  v_units integer;
  v_formula text := '';
  v_pool jsonb := '[]'::jsonb;
  v_results jsonb := '[]'::jsonb;
  v_row public.rolls%rowtype;
  v_entry jsonb;
  v_index integer;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_roll_id is null or p_character_id is null then
    raise exception 'roll and character identifiers required' using errcode = '22023';
  end if;
  select characters.campaign_id, characters.name
    into v_campaign_id, v_character_name
    from public.characters as characters
    where characters.id = p_character_id and characters.owner_id = v_user_id;
  if not found or v_campaign_id is null then
    raise exception 'linked character owner required' using errcode = '42501';
  end if;
  if private.campaign_role(v_campaign_id) is null then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;
  if p_visibility not in ('public', 'secret') or p_visibility is null then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;
  if p_dice_theme not in ('wine', 'azure', 'forest', 'amethyst', 'gold', 'obsidian', 'ivory', 'copper', 'rose', 'turquoise')
    or p_dice_theme is null then
    raise exception 'invalid dice theme' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_dice) is distinct from 'array'
    or pg_catalog.jsonb_array_length(p_dice) not between 1 and 7 then
    raise exception 'invalid dice pool' using errcode = '22023';
  end if;

  for v_entry in select value from pg_catalog.jsonb_array_elements(p_dice) loop
    if pg_catalog.jsonb_typeof(v_entry) <> 'object'
      or not (v_entry ? 'type' and v_entry ? 'count')
      or (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(v_entry)) <> 2
      or v_entry ->> 'type' not in ('d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100')
      or pg_catalog.jsonb_typeof(v_entry -> 'count') <> 'number'
      or (v_entry ->> 'count') !~ '^[1-9][0-9]?$' then
      raise exception 'invalid dice selection' using errcode = '22023';
    end if;
    v_type := v_entry ->> 'type';
    v_count := (v_entry ->> 'count')::integer;
    if exists (
      select 1 from pg_catalog.jsonb_array_elements(v_pool) as prior(value)
      where prior.value ->> 'type' = v_type
    ) then
      raise exception 'duplicate dice type' using errcode = '22023';
    end if;
    v_total_count := v_total_count + v_count;
    if v_total_count > 50 then
      raise exception 'too many dice' using errcode = '22023';
    end if;
    v_pool := v_pool || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('type', v_type, 'count', v_count));
    v_formula := v_formula || case when v_formula = '' then '' else ' + ' end || v_count::text || v_type;
  end loop;
  if pg_catalog.char_length(v_formula) > 120 then
    raise exception 'dice formula too long' using errcode = '22023';
  end if;
  select pg_catalog.jsonb_agg(entry.value order by die.ord)
    into v_pool
    from pg_catalog.jsonb_array_elements(v_pool) as entry(value)
    join pg_catalog.unnest(array['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'])
      with ordinality as die(type, ord) on entry.value ->> 'type' = die.type;
  select pg_catalog.string_agg((entry.value ->> 'count') || (entry.value ->> 'type'), ' + ' order by entry.ord)
    into v_formula
    from pg_catalog.jsonb_array_elements(v_pool) with ordinality as entry(value, ord);

  select rolls.* into v_row from public.rolls as rolls where rolls.id = p_roll_id;
  if found then
    if v_row.user_id = v_user_id and v_row.character_id = p_character_id
      and v_row.campaign_id = v_campaign_id and v_row.roll_type = 'tray'
      and v_row.dice_pool = v_pool and v_row.dice_theme = p_dice_theme
      and v_row.visibility = p_visibility then
      return pg_catalog.to_jsonb(v_row);
    end if;
    raise exception 'roll identifier already used' using errcode = '23505';
  end if;

  for v_entry in select value from pg_catalog.jsonb_array_elements(v_pool) loop
    v_type := v_entry ->> 'type';
    v_count := (v_entry ->> 'count')::integer;
    v_sides := pg_catalog.substring(v_type, 2)::integer;
    for v_index in 1..v_count loop
      if v_type = 'd100' then
        v_tens := pg_catalog.floor(pg_catalog.random() * 10)::integer;
        v_units := pg_catalog.floor(pg_catalog.random() * 10)::integer;
        v_result := case when v_tens = 0 and v_units = 0 then 100 else v_tens * 10 + v_units end;
        v_results := v_results || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object('type', v_type, 'tens', v_tens * 10, 'units', v_units, 'result', v_result)
        );
      else
        v_result := pg_catalog.floor(pg_catalog.random() * v_sides)::integer + 1;
        v_results := v_results || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object('type', v_type, 'result', v_result)
        );
      end if;
      v_total := v_total + v_result;
    end loop;
  end loop;

  select pg_catalog.left(coalesce(nullif(pg_catalog.btrim(profiles.display_name), ''), v_character_name), 80)
    into v_player_name
    from public.profiles as profiles where profiles.id = v_user_id;
  v_player_name := coalesce(v_player_name, pg_catalog.left(v_character_name, 80));

  insert into public.rolls (
    id, campaign_id, character_id, user_id, character_name, player_name,
    roll_type, mode, formula, raw_roll, modifier, total, visibility,
    dice_theme, dice_pool, session_id
  ) values (
    p_roll_id, v_campaign_id, p_character_id, v_user_id, v_character_name, v_player_name,
    'tray', 'normal', v_formula, v_results, 0, v_total, p_visibility,
    p_dice_theme, v_pool, private.active_campaign_session(v_campaign_id)
  ) returning * into v_row;
  return pg_catalog.to_jsonb(v_row);
end;
$$;

revoke all privileges on function public.roll_dice_tray(uuid, uuid, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.roll_dice_tray(uuid, uuid, jsonb, text, text) to authenticated;

commit;

