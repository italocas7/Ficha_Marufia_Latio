begin;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rolls'
  ) then
    alter publication supabase_realtime add table public.rolls;
  end if;
end;
$$;

grant select (
  id,
  campaign_id,
  character_id,
  user_id,
  roll_type,
  skill_name,
  mode,
  formula,
  raw_roll,
  modifier,
  target,
  total,
  outcome,
  visibility,
  created_at
) on table public.rolls to authenticated;

create policy rolls_select_public_campaign_gm
on public.rolls
for select
to authenticated
using (
  visibility = 'public'
  and private.campaign_role(campaign_id) = 'gm'
);

comment on policy rolls_select_public_campaign_gm on public.rolls is
  'Permite ao Mæstre acompanhar somente rolagens públicas das campanhas em que possui papel gm.';

commit;
