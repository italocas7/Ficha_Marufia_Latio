begin;

create or replace function public.prepare_new_campaign()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entropy bytea;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  entropy := pg_catalog.uuid_send(pg_catalog.gen_random_uuid());

  new.name := pg_catalog.btrim(new.name);
  new.description := coalesce(new.description, '');
  new.owner_id := (select auth.uid());
  new.join_code := 'MRF-'
    || pg_catalog.substr(alphabet, (pg_catalog.get_byte(entropy, 0) % 32) + 1, 1)
    || pg_catalog.substr(alphabet, (pg_catalog.get_byte(entropy, 1) % 32) + 1, 1)
    || pg_catalog.substr(alphabet, (pg_catalog.get_byte(entropy, 2) % 32) + 1, 1)
    || pg_catalog.substr(alphabet, (pg_catalog.get_byte(entropy, 3) % 32) + 1, 1)
    || '-'
    || pg_catalog.substr(alphabet, (pg_catalog.get_byte(entropy, 4) % 32) + 1, 1)
    || pg_catalog.substr(alphabet, (pg_catalog.get_byte(entropy, 5) % 32) + 1, 1);

  return new;
end;
$$;

comment on function public.prepare_new_campaign() is
  'Define no servidor o proprietário autenticado e um código de convite aleatório de 30 bits.';

revoke all privileges on function public.prepare_new_campaign()
from public, anon, authenticated;

create trigger marufia_prepare_campaign_before_insert
before insert on public.campaigns
for each row execute function public.prepare_new_campaign();

grant select on table public.campaigns to authenticated;
grant insert (name, description) on table public.campaigns to authenticated;

create policy campaigns_select_owned
on public.campaigns
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
);

create policy campaigns_insert_owned
on public.campaigns
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = owner_id
);

commit;
