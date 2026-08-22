begin;

create schema if not exists private;

revoke all privileges on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_campaign_owner(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaigns
    where campaigns.id = target_campaign_id
      and campaigns.owner_id = (select auth.uid())
  );
$$;

comment on function private.is_campaign_owner(uuid) is
  'Verifica propriedade da campanha sem expor a tabela a consultas externas.';

revoke all privileges on function private.is_campaign_owner(uuid)
from public, anon, authenticated;
grant execute on function private.is_campaign_owner(uuid) to authenticated;

create or replace function private.add_campaign_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role, joined_at)
  values (new.id, new.owner_id, 'gm', new.created_at)
  on conflict (campaign_id, user_id) do update
    set role = 'gm';

  return new;
end;
$$;

comment on function private.add_campaign_owner_membership() is
  'Registra o proprietário de cada nova campanha como Mæstre da própria campanha.';

revoke all privileges on function private.add_campaign_owner_membership()
from public, anon, authenticated;

create trigger marufia_add_campaign_owner_after_insert
after insert on public.campaigns
for each row execute function private.add_campaign_owner_membership();

-- Compatibilidade com campanhas criadas antes desta fase.
insert into public.campaign_members (campaign_id, user_id, role, joined_at)
select campaigns.id, campaigns.owner_id, 'gm', campaigns.created_at
from public.campaigns
on conflict (campaign_id, user_id) do update
  set role = 'gm';

grant select on table public.campaign_members to authenticated;

create policy campaign_members_select_visible
on public.campaign_members
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (select auth.uid()) = user_id
    or private.is_campaign_owner(campaign_id)
  )
);

commit;
