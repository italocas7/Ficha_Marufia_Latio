begin;

create function private.require_gm_character_campaign(
  p_character_id uuid,
  p_expected_revision bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
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

  return v_campaign_id;
end;
$$;

comment on function private.require_gm_character_campaign(uuid, bigint) is
  'Confirma autenticação, revisão válida e papel exato de Mæstre antes de qualquer ação granular.';

revoke all privileges on function private.require_gm_character_campaign(uuid, bigint)
from public, anon, authenticated;

create function public.gm_set_character_pm(
  p_character_id uuid,
  p_pm_current integer,
  p_expected_revision bigint
)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_id uuid;
  v_character public.characters;
begin
  if p_pm_current is null or p_pm_current < 0 or p_pm_current > 1000000 then
    raise exception 'invalid character pm value' using errcode = '22023';
  end if;
  v_campaign_id := private.require_gm_character_campaign(p_character_id, p_expected_revision);

  perform set_config('marufia.character_change_origin', 'gm', true);
  update public.characters as characters
  set state = jsonb_set(characters.state, '{resources,pmCurrent}', to_jsonb(p_pm_current), true)
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

comment on function public.gm_set_character_pm(uuid, integer, bigint) is
  'Permissão granular: altera somente o PM atual do personagem da campanha administrada.';
revoke all privileges on function public.gm_set_character_pm(uuid, integer, bigint) from public, anon;
grant execute on function public.gm_set_character_pm(uuid, integer, bigint) to authenticated;

create function public.gm_add_character_condition(
  p_character_id uuid,
  p_condition_name text,
  p_ca integer,
  p_block integer,
  p_expected_revision bigint
)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_id uuid;
  v_name text;
  v_state jsonb;
  v_condition jsonb;
  v_character public.characters;
begin
  v_name := btrim(coalesce(p_condition_name, ''));
  if char_length(v_name) < 1 or char_length(v_name) > 120
    or p_ca is null or p_ca < -1000000 or p_ca > 1000000
    or p_block is null or p_block < -1000000 or p_block > 1000000 then
    raise exception 'invalid character condition' using errcode = '22023';
  end if;
  v_campaign_id := private.require_gm_character_campaign(p_character_id, p_expected_revision);

  select characters.state into v_state
  from public.characters as characters
  where characters.id = p_character_id and characters.campaign_id = v_campaign_id;
  if jsonb_typeof(v_state -> 'effects') is distinct from 'array'
    or jsonb_array_length(v_state -> 'effects') >= 5000 then
    raise exception 'invalid character condition collection' using errcode = '22023';
  end if;

  v_condition := jsonb_build_object(
    'id', 'gm:' || gen_random_uuid()::text,
    'name', v_name,
    'ca', p_ca,
    'block', jsonb_build_object(
      'cortante', p_block,
      'perfurante', p_block,
      'contundente', p_block
    )
  );
  v_state := jsonb_set(v_state, '{effects}', (v_state -> 'effects') || jsonb_build_array(v_condition), true);

  perform set_config('marufia.character_change_origin', 'gm', true);
  update public.characters as characters
  set state = v_state
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

comment on function public.gm_add_character_condition(uuid, text, integer, integer, bigint) is
  'Adiciona somente uma condição temporária no formato já usado pela ficha.';
revoke all privileges on function public.gm_add_character_condition(uuid, text, integer, integer, bigint) from public, anon;
grant execute on function public.gm_add_character_condition(uuid, text, integer, integer, bigint) to authenticated;

create function public.gm_remove_character_condition(
  p_character_id uuid,
  p_condition_id text,
  p_expected_revision bigint
)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_id uuid;
  v_condition_id text;
  v_state jsonb;
  v_effects jsonb;
  v_character public.characters;
begin
  v_condition_id := btrim(coalesce(p_condition_id, ''));
  if v_condition_id !~ '^[A-Za-z0-9._:-]{1,128}$' then
    raise exception 'invalid character condition id' using errcode = '22023';
  end if;
  v_campaign_id := private.require_gm_character_campaign(p_character_id, p_expected_revision);

  select characters.state into v_state
  from public.characters as characters
  where characters.id = p_character_id and characters.campaign_id = v_campaign_id;
  if jsonb_typeof(v_state -> 'effects') is distinct from 'array' then
    raise exception 'invalid character condition collection' using errcode = '22023';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(v_state -> 'effects') as effects(effect)
    where effects.effect ->> 'id' = v_condition_id
  ) then
    raise exception 'character condition not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(effects.effect order by effects.ordinality), '[]'::jsonb)
  into v_effects
  from jsonb_array_elements(v_state -> 'effects') with ordinality as effects(effect, ordinality)
  where effects.effect ->> 'id' <> v_condition_id;
  v_state := jsonb_set(v_state, '{effects}', v_effects, true);

  perform set_config('marufia.character_change_origin', 'gm', true);
  update public.characters as characters
  set state = v_state
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

comment on function public.gm_remove_character_condition(uuid, text, bigint) is
  'Remove somente a condição temporária identificada, preservando as demais.';
revoke all privileges on function public.gm_remove_character_condition(uuid, text, bigint) from public, anon;
grant execute on function public.gm_remove_character_condition(uuid, text, bigint) to authenticated;

create function public.gm_add_character_item(
  p_character_id uuid,
  p_item_kind text,
  p_name text,
  p_category text,
  p_quantity integer,
  p_weight text,
  p_damage text,
  p_property text,
  p_description text,
  p_expected_revision bigint
)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_id uuid;
  v_kind text;
  v_name text;
  v_category text;
  v_weight text;
  v_damage text;
  v_property text;
  v_description text;
  v_collection text;
  v_state jsonb;
  v_item jsonb;
  v_items jsonb;
  v_character public.characters;
begin
  v_kind := btrim(coalesce(p_item_kind, ''));
  v_name := btrim(coalesce(p_name, ''));
  v_category := btrim(coalesce(p_category, ''));
  v_weight := btrim(coalesce(p_weight, ''));
  v_damage := btrim(coalesce(p_damage, ''));
  v_property := btrim(coalesce(p_property, ''));
  v_description := btrim(coalesce(p_description, ''));
  if v_kind not in ('weapon', 'equipment')
    or char_length(v_name) < 1 or char_length(v_name) > 120
    or char_length(v_category) < 1 or char_length(v_category) > 120
    or p_quantity is null or p_quantity < 1 or p_quantity > 1000000
    or char_length(v_weight) > 120 or char_length(v_description) > 5000
    or char_length(v_damage) > 120 or char_length(v_property) > 1000
    or (v_kind = 'weapon' and char_length(v_damage) < 1) then
    raise exception 'invalid character item' using errcode = '22023';
  end if;
  v_campaign_id := private.require_gm_character_campaign(p_character_id, p_expected_revision);
  v_collection := case when v_kind = 'weapon' then 'weapons' else 'equipment' end;

  select characters.state into v_state
  from public.characters as characters
  where characters.id = p_character_id and characters.campaign_id = v_campaign_id;
  v_items := v_state #> array['inventory', v_collection];
  if jsonb_typeof(v_items) is distinct from 'array' or jsonb_array_length(v_items) >= 5000 then
    raise exception 'invalid character item collection' using errcode = '22023';
  end if;

  if v_kind = 'weapon' then
    v_item := jsonb_build_object(
      'id', 'gm:' || gen_random_uuid()::text,
      'type', v_category,
      'name', v_name,
      'damage', v_damage,
      'weight', v_weight,
      'property', v_property,
      'description', v_description
    );
  else
    v_item := jsonb_build_object(
      'id', 'gm:' || gen_random_uuid()::text,
      'name', v_name,
      'category', v_category,
      'qty', p_quantity,
      'weight', v_weight,
      'description', v_description
    );
  end if;
  v_state := jsonb_set(v_state, array['inventory', v_collection], v_items || jsonb_build_array(v_item), true);

  perform set_config('marufia.character_change_origin', 'gm', true);
  update public.characters as characters
  set state = v_state
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

comment on function public.gm_add_character_item(uuid, text, text, text, integer, text, text, text, text, bigint) is
  'Adiciona somente uma arma ou equipamento com os campos já usados pelo inventário schema v5.';
revoke all privileges on function public.gm_add_character_item(uuid, text, text, text, integer, text, text, text, text, bigint) from public, anon;
grant execute on function public.gm_add_character_item(uuid, text, text, text, integer, text, text, text, text, bigint) to authenticated;

create function public.gm_remove_character_item(
  p_character_id uuid,
  p_item_kind text,
  p_item_id text,
  p_expected_revision bigint
)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_id uuid;
  v_kind text;
  v_item_id text;
  v_collection text;
  v_state jsonb;
  v_items jsonb;
  v_character public.characters;
begin
  v_kind := btrim(coalesce(p_item_kind, ''));
  v_item_id := btrim(coalesce(p_item_id, ''));
  if v_kind not in ('weapon', 'equipment') or v_item_id !~ '^[A-Za-z0-9._:-]{1,128}$' then
    raise exception 'invalid character item id' using errcode = '22023';
  end if;
  v_campaign_id := private.require_gm_character_campaign(p_character_id, p_expected_revision);
  v_collection := case when v_kind = 'weapon' then 'weapons' else 'equipment' end;

  select characters.state into v_state
  from public.characters as characters
  where characters.id = p_character_id and characters.campaign_id = v_campaign_id;
  v_items := v_state #> array['inventory', v_collection];
  if jsonb_typeof(v_items) is distinct from 'array' then
    raise exception 'invalid character item collection' using errcode = '22023';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(v_items) as items(item)
    where items.item ->> 'id' = v_item_id
  ) then
    raise exception 'character item not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(items.item order by items.ordinality), '[]'::jsonb)
  into v_items
  from jsonb_array_elements(v_items) with ordinality as items(item, ordinality)
  where items.item ->> 'id' <> v_item_id;
  v_state := jsonb_set(v_state, array['inventory', v_collection], v_items, true);
  if v_kind = 'weapon' and v_state #>> '{inventory,selectedWeaponId}' = v_item_id then
    v_state := jsonb_set(v_state, '{inventory,selectedWeaponId}', to_jsonb(''::text), true);
  end if;

  perform set_config('marufia.character_change_origin', 'gm', true);
  update public.characters as characters
  set state = v_state
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

comment on function public.gm_remove_character_item(uuid, text, text, bigint) is
  'Remove somente a arma ou equipamento identificado e limpa a seleção se a arma removida estava ativa.';
revoke all privileges on function public.gm_remove_character_item(uuid, text, text, bigint) from public, anon;
grant execute on function public.gm_remove_character_item(uuid, text, text, bigint) to authenticated;

commit;
