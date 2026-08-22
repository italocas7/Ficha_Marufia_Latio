begin;

alter table public.characters
  add column revision bigint not null default 1,
  add column last_change_origin text not null default 'system';

alter table public.characters
  add constraint characters_revision_positive check (revision > 0),
  add constraint characters_last_change_origin_valid check (
    last_change_origin in ('player', 'gm', 'system')
  );

comment on column public.characters.revision is
  'Revisão monotônica controlada pelo banco para impedir sobrescritas concorrentes silenciosas.';
comment on column public.characters.last_change_origin is
  'Origem autorizada da última alteração: player, gm ou system.';

create or replace function private.version_character_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.revision := 1;
  else
    new.revision := old.revision + 1;
  end if;

  if (select auth.uid()) is null then
    new.last_change_origin := 'system';
  else
    new.last_change_origin := 'player';
  end if;

  return new;
end;
$$;

comment on function private.version_character_write() is
  'Define revisão e origem no servidor; o navegador não controla esses metadados diretamente.';

revoke all privileges on function private.version_character_write()
from public, anon, authenticated;

create trigger marufia_version_character_before_write
before insert or update on public.characters
for each row execute function private.version_character_write();

create or replace function public.save_character_state(
  p_character_id uuid,
  p_state jsonb,
  p_expected_revision bigint
)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_character public.characters;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception 'invalid expected character revision' using errcode = '22023';
  end if;

  update public.characters as characters
  set state = p_state
  where characters.id = p_character_id
    and characters.owner_id = v_user_id
    and characters.revision = p_expected_revision
  returning characters.* into v_character;

  if not found then
    if exists (
      select 1
      from public.characters as characters
      where characters.id = p_character_id
        and characters.owner_id = v_user_id
    ) then
      raise exception 'character revision conflict' using errcode = '40001';
    end if;
    raise exception 'character owner required' using errcode = '42501';
  end if;

  return v_character;
end;
$$;

comment on function public.save_character_state(uuid, jsonb, bigint) is
  'Salva a ficha do proprietário somente quando a revisão esperada ainda é a atual.';

revoke all privileges on function public.save_character_state(uuid, jsonb, bigint)
from public, anon;
grant execute on function public.save_character_state(uuid, jsonb, bigint)
to authenticated;

revoke update (state) on table public.characters from authenticated;

commit;
