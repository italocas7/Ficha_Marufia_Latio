begin;

create table public.campaign_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active',
  constraint campaign_sessions_name_length check (
    char_length(btrim(name)) between 1 and 120
  ),
  constraint campaign_sessions_status_valid check (
    status in ('active', 'ended')
  ),
  constraint campaign_sessions_end_consistent check (
    (status = 'active' and ended_at is null)
    or (status = 'ended' and ended_at is not null and ended_at >= started_at)
  )
);

create unique index campaign_sessions_one_active_idx
on public.campaign_sessions (campaign_id)
where status = 'active';

create index campaign_sessions_campaign_started_idx
on public.campaign_sessions (campaign_id, started_at desc);

alter table public.campaign_sessions enable row level security;
revoke all privileges on table public.campaign_sessions from public, anon, authenticated;
grant select (id, campaign_id, name, started_at, ended_at, status)
on table public.campaign_sessions to authenticated;

create policy campaign_sessions_select_campaign_gm
on public.campaign_sessions
for select
to authenticated
using (
  private.campaign_role(campaign_id) = 'gm'
);

alter table public.campaign_events
  add column session_id uuid references public.campaign_sessions (id) on delete set null;

create index campaign_events_session_created_at_idx
on public.campaign_events (session_id, created_at desc)
where session_id is not null;

grant select (session_id) on table public.campaign_events to authenticated;

create function private.active_campaign_session(target_campaign_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select sessions.id
  from public.campaign_sessions as sessions
  where sessions.campaign_id = target_campaign_id
    and sessions.status = 'active'
  order by sessions.started_at desc
  limit 1
$$;

comment on function private.active_campaign_session(uuid) is
  'Resolve internamente a única sessão ativa da campanha para associar novos eventos.';

revoke all privileges on function private.active_campaign_session(uuid)
from public, anon, authenticated;

create function private.attach_campaign_event_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.session_id := private.active_campaign_session(new.campaign_id);
  return new;
end;
$$;

comment on function private.attach_campaign_event_session() is
  'Associa o evento à sessão ativa sem aceitar identidade de sessão do navegador.';

revoke all privileges on function private.attach_campaign_event_session()
from public, anon, authenticated;

create trigger marufia_campaign_event_session_before_insert
before insert on public.campaign_events
for each row execute function private.attach_campaign_event_session();

create function public.start_campaign_session(
  p_campaign_id uuid,
  p_name text
)
returns public.campaign_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_name text;
  v_session public.campaign_sessions;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_campaign_id is null or private.campaign_role(p_campaign_id) is distinct from 'gm' then
    raise exception 'campaign gm required' using errcode = '42501';
  end if;
  if exists (
    select 1
    from public.campaign_sessions as sessions
    where sessions.campaign_id = p_campaign_id
      and sessions.status = 'active'
  ) then
    raise exception 'campaign session already active' using errcode = 'P0001';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if char_length(v_name) < 1 or char_length(v_name) > 120 then
    raise exception 'invalid campaign session name' using errcode = '22023';
  end if;

  insert into public.campaign_sessions (campaign_id, name)
  values (p_campaign_id, v_name)
  returning * into v_session;

  return v_session;
end;
$$;

comment on function public.start_campaign_session(uuid, text) is
  'Inicia uma única sessão na campanha administrada, usando o relógio e o papel confirmados no servidor.';

revoke all privileges on function public.start_campaign_session(uuid, text)
from public, anon;
grant execute on function public.start_campaign_session(uuid, text)
to authenticated;

create function public.end_campaign_session(p_session_id uuid)
returns public.campaign_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_campaign_id uuid;
  v_session public.campaign_sessions;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select sessions.campaign_id
  into v_campaign_id
  from public.campaign_sessions as sessions
  where sessions.id = p_session_id;

  if not found then
    raise exception 'campaign session not found' using errcode = 'P0002';
  end if;
  if private.campaign_role(v_campaign_id) is distinct from 'gm' then
    raise exception 'campaign gm required' using errcode = '42501';
  end if;

  update public.campaign_sessions as sessions
  set status = 'ended', ended_at = now()
  where sessions.id = p_session_id
    and sessions.status = 'active'
  returning * into v_session;

  if not found then
    select sessions.*
    into v_session
    from public.campaign_sessions as sessions
    where sessions.id = p_session_id;
  end if;

  return v_session;
end;
$$;

comment on function public.end_campaign_session(uuid) is
  'Encerra com o relógio do servidor uma sessão da campanha administrada; repetir a operação é idempotente.';

revoke all privileges on function public.end_campaign_session(uuid)
from public, anon;
grant execute on function public.end_campaign_session(uuid)
to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaign_sessions'
  ) then
    alter publication supabase_realtime add table public.campaign_sessions;
  end if;
end;
$$;

comment on table public.campaign_sessions is
  'Sessões opcionais de campanha, iniciadas e encerradas somente pelo Mæstre autorizado.';
comment on column public.campaign_events.session_id is
  'Sessão ativa no instante em que o evento relevante foi registrado, quando houver.';

commit;
