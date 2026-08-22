begin;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
      ),
      80
    ),
    left(nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''), 2048)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.create_profile_for_new_user() is
  'Cria o perfil mínimo associado ao usuário autenticado sem armazenar dados de autorização em metadata.';

revoke all privileges on function public.create_profile_for_new_user()
from public, anon, authenticated;

create trigger marufia_create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- Garante compatibilidade caso usuários tenham sido criados antes desta migration.
insert into public.profiles (id, display_name, avatar_url)
select
  users.id,
  left(
    coalesce(
      nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'full_name'), '')
    ),
    80
  ),
  left(nullif(btrim(users.raw_user_meta_data ->> 'avatar_url'), ''), 2048)
from auth.users as users
on conflict (id) do nothing;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

commit;
