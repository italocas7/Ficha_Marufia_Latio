begin;

create table public.campaign_presence (
  campaign_id uuid not null,
  user_id uuid not null,
  seen_at timestamptz not null default now(),
  primary key (campaign_id, user_id),
  constraint campaign_presence_membership foreign key (campaign_id, user_id)
    references public.campaign_members (campaign_id, user_id) on delete cascade
);

create index campaign_presence_recent_idx
on public.campaign_presence (campaign_id, seen_at desc);

alter table public.campaign_presence enable row level security;

revoke all privileges on table public.campaign_presence from public, anon, authenticated;
grant select (campaign_id, user_id, seen_at) on table public.campaign_presence to authenticated;

create policy campaign_presence_select_campaign_gm
on public.campaign_presence
for select
to authenticated
using (
  private.campaign_role(campaign_id) = 'gm'
);

comment on table public.campaign_presence is
  'Batimento efêmero por participante; o Mæstre conta somente registros recentes da própria campanha.';
comment on policy campaign_presence_select_campaign_gm on public.campaign_presence is
  'Somente o Mæstre lê a presença dos participantes da campanha correspondente.';

create function public.touch_campaign_presence(p_campaign_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_seen_at timestamptz;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_campaign_id is null or not exists (
    select 1
    from public.campaign_members as members
    where members.campaign_id = p_campaign_id
      and members.user_id = v_user_id
  ) then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;

  insert into public.campaign_presence (campaign_id, user_id, seen_at)
  values (p_campaign_id, v_user_id, now())
  on conflict (campaign_id, user_id)
  do update set seen_at = excluded.seen_at
  returning seen_at into v_seen_at;

  return v_seen_at;
end;
$$;

comment on function public.touch_campaign_presence(uuid) is
  'Atualiza com o relógio do servidor somente a presença do participante autenticado na campanha informada.';

revoke all privileges on function public.touch_campaign_presence(uuid)
from public, anon, authenticated;
grant execute on function public.touch_campaign_presence(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaign_presence'
  ) then
    alter publication supabase_realtime add table public.campaign_presence;
  end if;
end;
$$;

commit;
