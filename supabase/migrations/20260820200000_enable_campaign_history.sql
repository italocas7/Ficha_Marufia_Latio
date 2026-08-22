begin;

grant select (
  id,
  campaign_id,
  character_id,
  actor_id,
  event_type,
  payload,
  created_at
) on table public.campaign_events to authenticated;

create policy campaign_events_select_campaign_gm
on public.campaign_events
for select
to authenticated
using (
  private.campaign_role(campaign_id) = 'gm'
  and (
    event_type <> 'roll'
    or coalesce(payload ->> 'visibility', '') <> 'gm'
    or actor_id = (select auth.uid())
  )
);

create function private.record_character_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_old_effect_count integer;
  v_new_effect_count integer;
  v_old_item_count integer;
  v_new_item_count integer;
begin
  if new.campaign_id is null then
    return new;
  end if;
  v_actor_id := (select auth.uid());

  if (old.state #> '{resources,hpCurrent}') is distinct from (new.state #> '{resources,hpCurrent}') then
    insert into public.campaign_events (campaign_id, character_id, actor_id, event_type, payload)
    values (
      new.campaign_id,
      new.id,
      v_actor_id,
      'hp_changed',
      jsonb_build_object(
        'character_name', new.name,
        'old_value', old.state #> '{resources,hpCurrent}',
        'new_value', new.state #> '{resources,hpCurrent}',
        'origin', new.last_change_origin
      )
    );
  end if;

  if (old.state #> '{resources,pmCurrent}') is distinct from (new.state #> '{resources,pmCurrent}') then
    insert into public.campaign_events (campaign_id, character_id, actor_id, event_type, payload)
    values (
      new.campaign_id,
      new.id,
      v_actor_id,
      'pm_changed',
      jsonb_build_object(
        'character_name', new.name,
        'old_value', old.state #> '{resources,pmCurrent}',
        'new_value', new.state #> '{resources,pmCurrent}',
        'origin', new.last_change_origin
      )
    );
  end if;

  if (old.state -> 'effects') is distinct from (new.state -> 'effects')
    or (old.state #> '{resources,injury}') is distinct from (new.state #> '{resources,injury}')
    or (old.state #> '{resources,unconscious}') is distinct from (new.state #> '{resources,unconscious}')
    or (old.state #> '{resources,dying}') is distinct from (new.state #> '{resources,dying}') then
    v_old_effect_count := case
      when jsonb_typeof(old.state -> 'effects') = 'array' then jsonb_array_length(old.state -> 'effects')
      else 0
    end;
    v_new_effect_count := case
      when jsonb_typeof(new.state -> 'effects') = 'array' then jsonb_array_length(new.state -> 'effects')
      else 0
    end;
    insert into public.campaign_events (campaign_id, character_id, actor_id, event_type, payload)
    values (
      new.campaign_id,
      new.id,
      v_actor_id,
      'conditions_changed',
      jsonb_build_object(
        'character_name', new.name,
        'old_count', v_old_effect_count,
        'new_count', v_new_effect_count,
        'origin', new.last_change_origin
      )
    );
  end if;

  if (old.state #> '{inventory,weapons}') is distinct from (new.state #> '{inventory,weapons}')
    or (old.state #> '{inventory,equipment}') is distinct from (new.state #> '{inventory,equipment}') then
    v_old_item_count := (
      case when jsonb_typeof(old.state #> '{inventory,weapons}') = 'array'
        then jsonb_array_length(old.state #> '{inventory,weapons}') else 0 end
      + case when jsonb_typeof(old.state #> '{inventory,equipment}') = 'array'
        then jsonb_array_length(old.state #> '{inventory,equipment}') else 0 end
    );
    v_new_item_count := (
      case when jsonb_typeof(new.state #> '{inventory,weapons}') = 'array'
        then jsonb_array_length(new.state #> '{inventory,weapons}') else 0 end
      + case when jsonb_typeof(new.state #> '{inventory,equipment}') = 'array'
        then jsonb_array_length(new.state #> '{inventory,equipment}') else 0 end
    );
    insert into public.campaign_events (campaign_id, character_id, actor_id, event_type, payload)
    values (
      new.campaign_id,
      new.id,
      v_actor_id,
      'item_changed',
      jsonb_build_object(
        'character_name', new.name,
        'old_count', v_old_item_count,
        'new_count', v_new_item_count,
        'origin', new.last_change_origin
      )
    );
  end if;

  return new;
end;
$$;

comment on function private.record_character_history() is
  'Registra somente mudanças relevantes de PV, PM, condições e itens; ignora campos textuais comuns.';

revoke all privileges on function private.record_character_history()
from public, anon, authenticated;

create trigger marufia_character_history_after_update
after update of state on public.characters
for each row execute function private.record_character_history();

create function private.record_roll_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.campaign_events (campaign_id, character_id, actor_id, event_type, payload)
  values (
    new.campaign_id,
    new.character_id,
    new.user_id,
    'roll',
    jsonb_build_object(
      'roll_id', new.id,
      'character_name', new.character_name,
      'roll_type', new.roll_type,
      'skill_name', new.skill_name,
      'total', new.total,
      'outcome', new.outcome,
      'visibility', new.visibility
    )
  );
  return new;
end;
$$;

comment on function private.record_roll_history() is
  'Espelha no histórico somente o resumo autorizado de uma rolagem registrada.';

revoke all privileges on function private.record_roll_history()
from public, anon, authenticated;

create trigger marufia_roll_history_after_insert
after insert on public.rolls
for each row execute function private.record_roll_history();

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaign_events'
  ) then
    alter publication supabase_realtime add table public.campaign_events;
  end if;
end;
$$;

comment on policy campaign_events_select_campaign_gm on public.campaign_events is
  'O Mæstre vê eventos da própria campanha; rolagem gm permanece exclusiva do próprio autor.';

commit;
