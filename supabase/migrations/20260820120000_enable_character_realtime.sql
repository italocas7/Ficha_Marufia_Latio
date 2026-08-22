begin;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'characters'
  ) then
    alter publication supabase_realtime add table public.characters;
  end if;
end;
$$;

create policy characters_select_campaign_gm
on public.characters
for select
to authenticated
using (
  campaign_id is not null
  and private.campaign_role(campaign_id) = 'gm'
);

comment on policy characters_select_campaign_gm on public.characters is
  'Permite ao Mæstre receber personagens vinculados somente nas campanhas em que possui papel gm.';

commit;
