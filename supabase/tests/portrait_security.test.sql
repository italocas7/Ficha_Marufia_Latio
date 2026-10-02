begin;

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('93000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'portrait-owner@marufia.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('93000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'portrait-member@marufia.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('93000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'portrait-outsider@marufia.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());

select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into public.campaigns (id, name, description)
values ('93100000-0000-4000-8000-000000000001', 'Retratos', 'Teste transacional');
insert into public.campaign_members (campaign_id, user_id, role)
values ('93100000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000002', 'player');
insert into public.characters (id, state) values (
  '93200000-0000-4000-8000-000000000001',
  '{"meta":{"appId":"marufia-latio","schemaVersion":6},"character":{"name":"Retrato seguro"},"resources":{"hpCurrent":12,"pmCurrent":5}}'::jsonb
);
update public.characters set campaign_id = '93100000-0000-4000-8000-000000000001'
where id = '93200000-0000-4000-8000-000000000001';

set local role authenticated;
insert into storage.objects (bucket_id, name, owner_id) values (
  'character-portraits',
  '93200000-0000-4000-8000-000000000001/93300000-0000-4000-8000-000000000001.webp',
  '93000000-0000-4000-8000-000000000001'
);
select public.set_character_portrait(
  '93200000-0000-4000-8000-000000000001',
  '93200000-0000-4000-8000-000000000001/93300000-0000-4000-8000-000000000001.webp'
);
do $$ begin
  if (select count(*) from storage.objects where bucket_id = 'character-portraits') <> 1 then
    raise exception 'owner cannot read portrait';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$ begin
  if not public.can_read_character_portrait('93200000-0000-4000-8000-000000000001/93300000-0000-4000-8000-000000000001.webp')
    or (select count(*) from storage.objects where bucket_id = 'character-portraits') <> 1
    or (select count(*) from public.characters where id = '93200000-0000-4000-8000-000000000001') <> 0
    or (select count(*) from public.list_campaign_party_summary('93100000-0000-4000-8000-000000000001')) <> 1 then
    raise exception 'campaign member portrait or character permissions are incorrect';
  end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin
    perform public.set_character_portrait('93200000-0000-4000-8000-000000000001', null);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'member changed another character portrait'; end if;
end $$;
do $$ declare blocked boolean := false; begin
  begin
    insert into storage.objects (bucket_id, name, owner_id) values (
      'character-portraits',
      '93200000-0000-4000-8000-000000000001/93300000-0000-4000-8000-000000000002.webp',
      '93000000-0000-4000-8000-000000000002'
    );
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'member uploaded for another character'; end if;
end $$;

select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"93000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
do $$ begin
  if public.can_read_character_portrait('93200000-0000-4000-8000-000000000001/93300000-0000-4000-8000-000000000001.webp')
    or (select count(*) from storage.objects where bucket_id = 'character-portraits') <> 0 then
    raise exception 'outsider can read portrait';
  end if;
end $$;

rollback;
