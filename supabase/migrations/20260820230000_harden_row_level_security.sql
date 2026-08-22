begin;

-- As policies reais foram construídas progressivamente nas fases anteriores.
-- A Fase 35 primeiro confirma que todas continuam instaladas e que as oito
-- tabelas públicas permanecem protegidas, sem reescrever policies funcionais.
do $$
declare
  v_missing text;
begin
  select string_agg(expected.table_name, ', ' order by expected.table_name)
  into v_missing
  from (values
    ('profiles'),
    ('campaigns'),
    ('campaign_members'),
    ('characters'),
    ('rolls'),
    ('campaign_events'),
    ('campaign_presence'),
    ('campaign_sessions')
  ) as expected(table_name)
  where not exists (
    select 1
    from pg_catalog.pg_class as classes
    join pg_catalog.pg_namespace as namespaces
      on namespaces.oid = classes.relnamespace
    where namespaces.nspname = 'public'
      and classes.relname = expected.table_name
      and classes.relrowsecurity
  );

  if v_missing is not null then
    raise exception 'row level security required: %', v_missing
      using errcode = '42501';
  end if;

  select string_agg(expected.policy_name, ', ' order by expected.policy_name)
  into v_missing
  from (values
    ('profiles', 'profiles_select_own', 'SELECT'),
    ('profiles', 'profiles_update_own', 'UPDATE'),
    ('campaigns', 'campaigns_select_member', 'SELECT'),
    ('campaigns', 'campaigns_insert_owned', 'INSERT'),
    ('campaign_members', 'campaign_members_select_by_campaign_role', 'SELECT'),
    ('characters', 'characters_select_owned', 'SELECT'),
    ('characters', 'characters_select_campaign_gm', 'SELECT'),
    ('characters', 'characters_insert_owned', 'INSERT'),
    ('characters', 'characters_update_owned', 'UPDATE'),
    ('rolls', 'rolls_select_by_campaign_visibility', 'SELECT'),
    ('campaign_events', 'campaign_events_select_campaign_gm', 'SELECT'),
    ('campaign_presence', 'campaign_presence_select_campaign_gm', 'SELECT'),
    ('campaign_sessions', 'campaign_sessions_select_campaign_gm', 'SELECT')
  ) as expected(table_name, policy_name, command_name)
  where not exists (
    select 1
    from pg_catalog.pg_policies as policies
    where policies.schemaname = 'public'
      and policies.tablename = expected.table_name
      and policies.policyname = expected.policy_name
      and pg_catalog.upper(policies.cmd) = expected.command_name
  );

  if v_missing is not null then
    raise exception 'required row level policies missing: %', v_missing
      using errcode = '42501';
  end if;
end;
$$;

-- Usuários não autenticados não possuem nenhuma operação direta nas tabelas.
revoke all privileges on table
  public.profiles,
  public.campaigns,
  public.campaign_members,
  public.characters,
  public.rolls,
  public.campaign_events,
  public.campaign_presence,
  public.campaign_sessions
from public, anon;

-- Para authenticated, removemos somente caminhos que nunca fizeram parte da
-- interface. Grants legítimos por coluna (perfil, criação de campanha,
-- associação de personagem) e todas as policies existentes são preservados.
revoke insert, delete, truncate, references, trigger
on table public.profiles from authenticated;
revoke update (id, created_at, updated_at)
on table public.profiles from authenticated;

revoke update, delete, truncate, references, trigger
on table public.campaigns from authenticated;
revoke insert (id, owner_id, join_code, created_at, updated_at)
on table public.campaigns from authenticated;

revoke insert, update, delete, truncate, references, trigger
on table public.campaign_members from authenticated;

revoke delete, truncate, references, trigger
on table public.characters from authenticated;
revoke insert (
  id,
  owner_id,
  campaign_id,
  name,
  schema_version,
  revision,
  last_change_origin,
  created_at,
  updated_at
) on table public.characters from authenticated;
revoke update (
  id,
  owner_id,
  name,
  state,
  schema_version,
  revision,
  last_change_origin,
  created_at,
  updated_at
) on table public.characters from authenticated;

revoke insert, update, delete, truncate, references, trigger
on table public.rolls from authenticated;
revoke insert, update, delete, truncate, references, trigger
on table public.campaign_events from authenticated;
revoke insert, update, delete, truncate, references, trigger
on table public.campaign_presence from authenticated;
revoke insert, update, delete, truncate, references, trigger
on table public.campaign_sessions from authenticated;

-- As operações que escrevem com autoridade continuam exigindo autenticação e
-- validação dentro de funções específicas. A Fase 35 não amplia EXECUTE.
revoke all privileges on function public.join_campaign(text)
from public, anon;
revoke all privileges on function public.save_character_state(uuid, jsonb, bigint)
from public, anon;
revoke all privileges on function public.record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text, text)
from public, anon;
revoke all privileges on function public.touch_campaign_presence(uuid, boolean)
from public, anon;
revoke all privileges on function public.gm_set_character_hp(uuid, integer, bigint)
from public, anon;
revoke all privileges on function public.gm_set_character_pm(uuid, integer, bigint)
from public, anon;
revoke all privileges on function public.gm_add_character_condition(uuid, text, integer, integer, bigint)
from public, anon;
revoke all privileges on function public.gm_remove_character_condition(uuid, text, bigint)
from public, anon;
revoke all privileges on function public.gm_add_character_item(uuid, text, text, text, integer, text, text, text, text, bigint)
from public, anon;
revoke all privileges on function public.gm_remove_character_item(uuid, text, text, bigint)
from public, anon;
revoke all privileges on function public.start_campaign_session(uuid, text)
from public, anon;
revoke all privileges on function public.end_campaign_session(uuid)
from public, anon;

commit;
