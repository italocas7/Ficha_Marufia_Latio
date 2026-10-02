begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('character-portraits', 'character-portraits', false, 358400, array['image/webp'])
on conflict (id) do update set public = false, file_size_limit = 358400,
  allowed_mime_types = array['image/webp'];

create table public.character_portraits (
  character_id uuid primary key references public.characters(id) on delete cascade,
  object_path text,
  updated_at timestamptz not null default now(),
  constraint character_portraits_path check (
    object_path is null or object_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
  )
);

alter table public.character_portraits enable row level security;
revoke all privileges on table public.character_portraits from public, anon, authenticated;
grant select (character_id, object_path, updated_at) on public.character_portraits to authenticated;

create policy character_portraits_select_owner on public.character_portraits
for select to authenticated using (
  exists (select 1 from public.characters as c
    where c.id = character_id and c.owner_id = (select auth.uid()))
);

create function public.can_upload_character_portrait(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
    and exists (select 1 from public.characters as c
      where c.id::text = split_part(p_path, '/', 1)
        and c.owner_id = (select auth.uid()));
$$;

create function public.can_read_character_portrait(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.character_portraits as portrait
    join public.characters as character on character.id = portrait.character_id
    where portrait.object_path = p_path
      and (character.owner_id = (select auth.uid()) or exists (
        select 1 from public.campaign_members as member
        where member.campaign_id = character.campaign_id
          and member.user_id = (select auth.uid())
      ))
  );
$$;

revoke all on function public.can_upload_character_portrait(text), public.can_read_character_portrait(text) from public, anon;
grant execute on function public.can_upload_character_portrait(text), public.can_read_character_portrait(text) to authenticated;

create policy character_portraits_storage_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'character-portraits'
  and public.can_upload_character_portrait(name)
);

create policy character_portraits_storage_select on storage.objects
for select to authenticated using (
  bucket_id = 'character-portraits'
  and (owner_id = (select auth.uid()::text) or public.can_read_character_portrait(name))
);

create policy character_portraits_storage_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'character-portraits' and owner_id = (select auth.uid()::text)
);

create function public.set_character_portrait(p_character_id uuid, p_path text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null or not exists (
    select 1 from public.characters as c where c.id = p_character_id and c.owner_id = v_user_id
  ) then
    raise exception 'character owner required' using errcode = '42501';
  end if;
  if p_path is not null and (
    not public.can_upload_character_portrait(p_path)
    or split_part(p_path, '/', 1) <> p_character_id::text
    or not exists (select 1 from storage.objects as o
      where o.bucket_id = 'character-portraits' and o.name = p_path and o.owner_id = v_user_id::text)
  ) then
    raise exception 'invalid character portrait' using errcode = '22023';
  end if;
  insert into public.character_portraits (character_id, object_path)
  values (p_character_id, p_path)
  on conflict (character_id) do update
    set object_path = excluded.object_path, updated_at = now();
  return p_path;
end;
$$;

revoke all on function public.set_character_portrait(uuid, text) from public, anon;
grant execute on function public.set_character_portrait(uuid, text) to authenticated;

drop function public.list_campaign_party_summary(uuid);
create function public.list_campaign_party_summary(p_campaign_id uuid)
returns table (
  character_id uuid, character_name text, owner_id uuid, player_name text,
  hp_current integer, pm_current integer, presence_status text, portrait_path text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.campaign_members as member
    where member.campaign_id = p_campaign_id and member.user_id = (select auth.uid())
  ) then
    raise exception 'campaign membership required' using errcode = '42501';
  end if;
  return query
  select character.id, character.name, character.owner_id,
    coalesce(nullif(btrim(profile.display_name), ''), 'Não informado'),
    case when pg_catalog.jsonb_typeof(character.state #> '{resources,hpCurrent}') = 'number'
      then least(2147483647::numeric, greatest(0::numeric,
        pg_catalog.floor((character.state #>> '{resources,hpCurrent}')::numeric)))::integer
      else null end,
    case when pg_catalog.jsonb_typeof(character.state #> '{resources,pmCurrent}') = 'number'
      then least(2147483647::numeric, greatest(0::numeric,
        pg_catalog.floor((character.state #>> '{resources,pmCurrent}')::numeric)))::integer
      else null end,
    case when presence.seen_at >= now() - interval '90 seconds' then
      case when presence.active_at >= now() - interval '120 seconds' then 'online' else 'away' end
      else 'offline' end,
    portrait.object_path
  from public.characters as character
  left join public.profiles as profile on profile.id = character.owner_id
  left join public.campaign_presence as presence on presence.campaign_id = character.campaign_id
    and presence.user_id = character.owner_id
  left join public.character_portraits as portrait on portrait.character_id = character.id
  where character.campaign_id = p_campaign_id
  order by character.name, character.id;
end;
$$;

revoke all on function public.list_campaign_party_summary(uuid) from public, anon;
grant execute on function public.list_campaign_party_summary(uuid) to authenticated;

commit;
