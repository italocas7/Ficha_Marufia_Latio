begin;

alter table public.campaigns
  add column age_mechanic_enabled boolean not null default false;

grant insert (age_mechanic_enabled) on table public.campaigns to authenticated;

create function public.update_campaign_details(
  p_campaign_id uuid,
  p_name text,
  p_description text,
  p_skill_limit integer,
  p_age_mechanic_enabled boolean
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
  if pg_catalog.char_length(v_name) not between 1 and 100
    or pg_catalog.char_length(v_description) > 5000
    or p_skill_limit is null or p_skill_limit not between 1 and 999
    or p_age_mechanic_enabled is null then
    raise exception 'invalid campaign settings' using errcode = '22023';
  end if;
  update public.campaigns
  set name = v_name,
      description = v_description,
      skill_limit = p_skill_limit,
      age_mechanic_enabled = p_age_mechanic_enabled,
      rules_revision = rules_revision + case
        when skill_limit <> p_skill_limit or age_mechanic_enabled <> p_age_mechanic_enabled then 1
        else 0 end
  where id = p_campaign_id and owner_id = v_user_id
  returning * into v_campaign;
  if not found then
    raise exception 'campaign owner required' using errcode = '42501';
  end if;
  return v_campaign;
end;
$$;

revoke all privileges on function public.update_campaign_details(uuid, text, text, integer, boolean)
from public, anon, authenticated;
grant execute on function public.update_campaign_details(uuid, text, text, integer, boolean) to authenticated;

commit;
