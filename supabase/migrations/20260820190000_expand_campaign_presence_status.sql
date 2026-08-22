begin;

alter table public.campaign_presence
  add column active_at timestamptz not null default now();

create index campaign_presence_active_idx
on public.campaign_presence (campaign_id, active_at desc);

grant select (active_at) on table public.campaign_presence to authenticated;

revoke all privileges on function public.touch_campaign_presence(uuid)
from public, anon, authenticated;
drop function public.touch_campaign_presence(uuid);

create function public.touch_campaign_presence(
  p_campaign_id uuid,
  p_active boolean default true
)
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

  insert into public.campaign_presence (campaign_id, user_id, seen_at, active_at)
  values (p_campaign_id, v_user_id, now(), now())
  on conflict (campaign_id, user_id)
  do update set
    seen_at = excluded.seen_at,
    active_at = case
      when coalesce(p_active, false) then excluded.active_at
      else campaign_presence.active_at
    end
  returning seen_at into v_seen_at;

  return v_seen_at;
end;
$$;

comment on column public.campaign_presence.active_at is
  'Última atividade informada pelo cliente; seen_at continua sendo o batimento de conexão.';
comment on function public.touch_campaign_presence(uuid, boolean) is
  'Mantém a conexão com relógio do servidor e atualiza atividade somente quando o participante está ativo.';

revoke all privileges on function public.touch_campaign_presence(uuid, boolean)
from public, anon, authenticated;
grant execute on function public.touch_campaign_presence(uuid, boolean)
to authenticated;

commit;
