begin;

create or replace function public.list_campaign_party_summary(p_campaign_id uuid)
returns table (
  character_id uuid,
  character_name text,
  hp_current integer,
  pm_current integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.campaign_members as member
    where member.campaign_id = p_campaign_id
      and member.user_id = (select auth.uid())
  ) then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;

  return query
  select character.id, character.name,
    case when pg_catalog.jsonb_typeof(character.state #> '{resources,hpCurrent}') = 'number'
      then least(2147483647::numeric,
        greatest(0::numeric, pg_catalog.floor((character.state #>> '{resources,hpCurrent}')::numeric)))::integer
      else null end,
    case when pg_catalog.jsonb_typeof(character.state #> '{resources,pmCurrent}') = 'number'
      then least(2147483647::numeric,
        greatest(0::numeric, pg_catalog.floor((character.state #>> '{resources,pmCurrent}')::numeric)))::integer
      else null end
  from public.characters as character
  where character.campaign_id = p_campaign_id
  order by character.name, character.id;
end;
$$;

comment on function public.list_campaign_party_summary(uuid) is
  'Expõe somente nome e recursos atuais das fichas aos integrantes da própria campanha.';

revoke all privileges on function public.list_campaign_party_summary(uuid) from public, anon;
grant execute on function public.list_campaign_party_summary(uuid) to authenticated;

commit;
