begin;

create or replace function private.join_campaign_by_code(normalized_join_code text)
returns table (
  campaign_id uuid,
  campaign_name text,
  member_role text,
  already_member boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_campaign_id uuid;
  v_campaign_name text;
  v_member_role text;
  v_already_member boolean;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select campaigns.id, campaigns.name
  into v_campaign_id, v_campaign_name
  from public.campaigns as campaigns
  where campaigns.join_code = normalized_join_code;

  if not found then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;

  select members.role
  into v_member_role
  from public.campaign_members as members
  where members.campaign_id = v_campaign_id
    and members.user_id = v_user_id;

  if found then
    return query select
      v_campaign_id,
      v_campaign_name,
      v_member_role,
      true;
    return;
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_campaign_id, v_user_id, 'player')
  on conflict (campaign_id, user_id) do nothing
  returning role into v_member_role;

  if v_member_role is null then
    select members.role
    into v_member_role
    from public.campaign_members as members
    where members.campaign_id = v_campaign_id
      and members.user_id = v_user_id;
    v_already_member := true;
  else
    v_already_member := false;
  end if;

  return query select
    v_campaign_id,
    v_campaign_name,
    v_member_role,
    v_already_member;
end;
$$;

comment on function private.join_campaign_by_code(text) is
  'Localiza o convite no servidor e cria somente um vínculo player, preservando qualquer vínculo existente.';

revoke all privileges on function private.join_campaign_by_code(text)
from public, anon, authenticated;
grant execute on function private.join_campaign_by_code(text) to authenticated;

create or replace function public.join_campaign(p_join_code text)
returns table (
  campaign_id uuid,
  campaign_name text,
  member_role text,
  already_member boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_join_code text;
begin
  v_join_code := upper(btrim(coalesce(p_join_code, '')));

  if v_join_code !~ '^MRF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$' then
    raise exception 'invalid campaign join code' using errcode = '22023';
  end if;

  return query
  select result.campaign_id, result.campaign_name, result.member_role, result.already_member
  from private.join_campaign_by_code(v_join_code) as result;
end;
$$;

comment on function public.join_campaign(text) is
  'Entrada autenticada por código. Novos participantes recebem player; papéis existentes nunca são alterados.';

revoke all privileges on function public.join_campaign(text)
from public, anon, authenticated;
grant execute on function public.join_campaign(text) to authenticated;

commit;
