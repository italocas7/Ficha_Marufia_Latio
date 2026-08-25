begin;

alter table public.campaigns
  add column if not exists roll_history_revision bigint not null default 0;

comment on column public.campaigns.roll_history_revision is
  'Versão monotônica usada para avisar participantes quando o Mæstre limpa as rolagens da campanha.';

-- UPDATEs continuam protegidos por RLS, e a imagem anterior permite distinguir
-- uma limpeza de uma edição comum da campanha sem transmitir DELETEs de rolls.
alter table public.campaigns replica identity full;

create or replace function public.clear_campaign_roll_history(p_campaign_id uuid)
returns table (deleted_rolls integer, history_revision bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_rolls integer := 0;
  v_history_revision bigint;
begin
  if p_campaign_id is null then
    raise exception 'invalid campaign id' using errcode = '22023';
  end if;

  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if private.campaign_role(p_campaign_id) is distinct from 'gm' then
    raise exception 'campaign gm required' using errcode = '42501';
  end if;

  update public.campaigns as campaigns
  set roll_history_revision = campaigns.roll_history_revision + 1
  where campaigns.id = p_campaign_id
  returning campaigns.roll_history_revision into v_history_revision;

  if not found then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;

  delete from public.campaign_events as events
  where events.campaign_id = p_campaign_id
    and events.event_type = 'roll';

  delete from public.rolls as rolls
  where rolls.campaign_id = p_campaign_id;
  get diagnostics v_deleted_rolls = row_count;

  deleted_rolls := v_deleted_rolls;
  history_revision := v_history_revision;
  return next;
end;
$$;

comment on function public.clear_campaign_roll_history(uuid) is
  'Permite somente ao Mæstre apagar permanentemente as rolagens e seus resumos da campanha exata.';

revoke all privileges on function public.clear_campaign_roll_history(uuid)
from public, anon, authenticated;
grant execute on function public.clear_campaign_roll_history(uuid) to authenticated;

-- A interface nunca recebe DELETE ou UPDATE direto para executar a limpeza.
revoke delete on table public.rolls, public.campaign_events from authenticated;
revoke update (roll_history_revision) on table public.campaigns from authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaigns'
  ) then
    alter publication supabase_realtime add table public.campaigns;
  end if;
end;
$$;

commit;
