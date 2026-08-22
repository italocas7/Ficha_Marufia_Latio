begin;

create or replace function private.campaign_role(target_campaign_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select members.role
  from public.campaign_members as members
  where members.campaign_id = target_campaign_id
    and members.user_id = (select auth.uid())
  limit 1;
$$;

comment on function private.campaign_role(uuid) is
  'Retorna o papel do usuário autenticado exclusivamente dentro da campanha informada.';

revoke all privileges on function private.campaign_role(uuid)
from public, anon, authenticated;
grant execute on function private.campaign_role(uuid) to authenticated;

drop policy campaigns_select_owned on public.campaigns;

create policy campaigns_select_member
on public.campaigns
for select
to authenticated
using (
  (select auth.uid()) is not null
  and private.campaign_role(id) is not null
);

drop policy campaign_members_select_visible on public.campaign_members;

create policy campaign_members_select_by_campaign_role
on public.campaign_members
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (select auth.uid()) = user_id
    or private.campaign_role(campaign_id) = 'gm'
  )
);

commit;
