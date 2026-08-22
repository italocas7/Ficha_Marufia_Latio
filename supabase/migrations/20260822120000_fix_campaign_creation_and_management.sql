begin;

-- O proprietário precisa enxergar a linha criada antes que o gatilho AFTER
-- registre seu vínculo de Mæstre. Sem esta exceção estreita, INSERT ... RETURNING
-- é recusado pela policy e toda a criação volta atrás.
drop policy campaigns_select_member on public.campaigns;

create policy campaigns_select_member
on public.campaigns
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (select auth.uid()) = owner_id
    or private.campaign_role(id) is not null
  )
);

create or replace function public.update_campaign(
  p_campaign_id uuid,
  p_name text,
  p_description text default ''
)
returns public.campaigns
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := pg_catalog.btrim(coalesce(p_name, ''));
  v_description text := pg_catalog.btrim(coalesce(p_description, ''));
  v_campaign public.campaigns;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if pg_catalog.char_length(v_name) not between 1 and 100 then
    raise exception 'invalid campaign name' using errcode = '22023';
  end if;
  if pg_catalog.char_length(v_description) > 5000 then
    raise exception 'invalid campaign description' using errcode = '22023';
  end if;

  update public.campaigns
  set name = v_name,
      description = v_description
  where id = p_campaign_id
    and owner_id = v_user_id
  returning * into v_campaign;

  if not found then
    raise exception 'campaign owner required' using errcode = '42501';
  end if;
  return v_campaign;
end;
$$;

comment on function public.update_campaign(uuid, text, text) is
  'Permite somente ao proprietário autenticado editar nome e descrição da própria campanha.';

revoke all privileges on function public.update_campaign(uuid, text, text)
from public, anon, authenticated;
grant execute on function public.update_campaign(uuid, text, text) to authenticated;

create or replace function public.delete_campaign(
  p_campaign_id uuid,
  p_confirmation_name text
)
returns table (campaign_id uuid, campaign_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_campaign public.campaigns;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select campaigns.*
  into v_campaign
  from public.campaigns as campaigns
  where campaigns.id = p_campaign_id
    and campaigns.owner_id = v_user_id
  for update;

  if not found then
    raise exception 'campaign owner required' using errcode = '42501';
  end if;
  if pg_catalog.btrim(coalesce(p_confirmation_name, '')) <> v_campaign.name then
    raise exception 'campaign name confirmation mismatch' using errcode = '22023';
  end if;

  delete from public.campaigns
  where id = v_campaign.id
    and owner_id = v_user_id;

  campaign_id := v_campaign.id;
  campaign_name := v_campaign.name;
  return next;
end;
$$;

comment on function public.delete_campaign(uuid, text) is
  'Exclui somente campanha do proprietário autenticado após confirmação exata do nome; fichas vinculadas são preservadas sem campanha pela FK.';

revoke all privileges on function public.delete_campaign(uuid, text)
from public, anon, authenticated;
grant execute on function public.delete_campaign(uuid, text) to authenticated;

-- A interface continua sem UPDATE ou DELETE direto na tabela.
revoke update, delete on table public.campaigns from authenticated;

commit;
