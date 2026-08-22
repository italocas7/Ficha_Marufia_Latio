begin;

-- O teste ofensivo da Fase 36 revelou que o gatilho original aceitava somente
-- o proprietário, inclusive quando uma RPC já havia confirmado o gm. A
-- exceção abaixo exige simultaneamente origem interna gm, papel exato na
-- campanha atual e campanha imutável. Grants e policies diretos não mudam.
create or replace function private.prepare_character_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_schema_version_text text;
  v_character_name text;
  v_authorized_gm_write boolean := false;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := v_user_id;
    new.campaign_id := null;
  else
    if old.owner_id <> v_user_id then
      v_authorized_gm_write :=
        current_setting('marufia.character_change_origin', true) = 'gm'
        and old.campaign_id is not null
        and new.campaign_id is not distinct from old.campaign_id
        and private.campaign_role(old.campaign_id) = 'gm';

      if not v_authorized_gm_write then
        raise exception 'character owner required' using errcode = '42501';
      end if;
    end if;
    new.owner_id := old.owner_id;
  end if;

  v_schema_version_text := new.state #>> '{meta,schemaVersion}';
  if v_schema_version_text is null
    or v_schema_version_text !~ '^[1-9][0-9]{0,4}$'
    or v_schema_version_text::integer > 32767 then
    raise exception 'invalid character schema version' using errcode = '22023';
  end if;
  new.schema_version := v_schema_version_text::smallint;

  v_character_name := btrim(coalesce(new.state #>> '{character,name}', ''));
  new.name := left(
    case when v_character_name = '' then 'Personagem sem nome' else v_character_name end,
    120
  );

  if new.campaign_id is not null and not exists (
    select 1
    from public.campaign_members as members
    where members.campaign_id = new.campaign_id
      and members.user_id = new.owner_id
  ) then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function private.prepare_character_write() is
  'Protege proprietário e metadados; aceita escrita de gm somente pela origem interna e na campanha exata já vinculada.';

revoke all privileges on function private.prepare_character_write()
from public, anon, authenticated;

commit;
