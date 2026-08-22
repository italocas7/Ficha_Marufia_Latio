begin;

create extension if not exists pgtap with schema extensions;
set local search_path = pg_temp, public, extensions;

create temporary table tap_results (result text not null);
grant insert, select on table pg_temp.tap_results to authenticated;

create function public.is(p_got bigint, p_expected bigint, p_description text)
returns text
language plpgsql
security definer
set search_path = pg_temp, extensions
as $$
declare
  v_result text;
begin
  v_result := extensions.is(p_got, p_expected, p_description);
  insert into pg_temp.tap_results (result) values (v_result);
  return v_result;
end;
$$;

create function public.is(p_got text, p_expected text, p_description text)
returns text
language plpgsql
security definer
set search_path = pg_temp, extensions
as $$
declare
  v_result text;
begin
  v_result := extensions.is(p_got, p_expected, p_description);
  insert into pg_temp.tap_results (result) values (v_result);
  return v_result;
end;
$$;

create function public.cmp_ok(p_got bigint, p_operator text, p_expected bigint, p_description text)
returns text
language plpgsql
security definer
set search_path = pg_temp, extensions
as $$
declare
  v_result text;
begin
  v_result := extensions.cmp_ok(p_got, p_operator, p_expected, p_description);
  insert into pg_temp.tap_results (result) values (v_result);
  return v_result;
end;
$$;

select plan(35);

create function pg_temp.sqlstate_of(p_statement text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  execute p_statement;
  return '00000';
exception
  when others then
    return sqlstate;
end;
$$;

-- Identidades e dados exclusivamente transacionais. O rollback final remove
-- usuários, perfis, campanhas, personagens, rolagens e eventos deste teste.
insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('90000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gm-f36@marufia.invalid', '{}'::jsonb, '{"display_name":"GM F36"}'::jsonb, now(), now()),
  ('90000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'a-f36@marufia.invalid', '{}'::jsonb, '{"display_name":"Jogador A F36"}'::jsonb, now(), now()),
  ('90000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'b-f36@marufia.invalid', '{}'::jsonb, '{"display_name":"Jogador B F36"}'::jsonb, now(), now());

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into public.campaigns (id, name, description)
values ('91000000-0000-4000-8000-000000000001', 'Campanha F36', 'Teste transacional de RLS');

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
insert into public.campaigns (id, name, description)
values ('91000000-0000-4000-8000-000000000002', 'Campanha externa F36', 'Não pode aparecer para outras identidades');

insert into public.campaign_members (campaign_id, user_id, role)
values (
  '91000000-0000-4000-8000-000000000001',
  '90000000-0000-4000-8000-000000000002',
  'player'
);

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
insert into public.characters (id, state)
values (
  '92000000-0000-4000-8000-000000000001',
  '{
    "meta":{"appId":"marufia-latio","schemaVersion":5},
    "character":{"name":"Personagem A F36"},
    "resources":{"hpCurrent":20,"pmCurrent":10},
    "effects":[],
    "inventory":{"weapons":[],"equipment":[]}
  }'::jsonb
);
update public.characters
set campaign_id = '91000000-0000-4000-8000-000000000001'
where id = '92000000-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
insert into public.characters (id, state)
values (
  '92000000-0000-4000-8000-000000000002',
  '{
    "meta":{"appId":"marufia-latio","schemaVersion":5},
    "character":{"name":"Personagem B F36"},
    "resources":{"hpCurrent":18,"pmCurrent":9},
    "effects":[],
    "inventory":{"weapons":[],"equipment":[]}
  }'::jsonb
);
update public.characters
set campaign_id = '91000000-0000-4000-8000-000000000002'
where id = '92000000-0000-4000-8000-000000000002';

insert into public.campaign_sessions (id, campaign_id, name)
values (
  '93000000-0000-4000-8000-000000000001',
  '91000000-0000-4000-8000-000000000001',
  'Sessão F36'
);
insert into public.campaign_presence (campaign_id, user_id)
values (
  '91000000-0000-4000-8000-000000000001',
  '90000000-0000-4000-8000-000000000002'
);

insert into public.rolls (
  id, campaign_id, character_id, user_id, character_name, roll_type,
  skill_name, mode, formula, raw_roll, modifier, target, total, outcome, visibility
) values
  (
    '94000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    'Personagem A F36', 'skill', 'Atletismo', 'normal', '1d100', '[20]'::jsonb,
    0, 50, 20, 'Normal', 'public'
  ),
  (
    '94000000-0000-4000-8000-000000000002',
    '91000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    'Personagem A F36', 'skill', 'Atletismo', 'normal', '1d100', '[21]'::jsonb,
    0, 50, 21, 'Normal', 'secret'
  ),
  (
    '94000000-0000-4000-8000-000000000003',
    '91000000-0000-4000-8000-000000000001',
    null,
    '90000000-0000-4000-8000-000000000001',
    'Mæstre F36', 'skill', 'Percepção', 'normal', '1d100', '[22]'::jsonb,
    0, 50, 22, 'Normal', 'gm'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is((select count(*) from public.campaigns), 1::bigint, 'Jogador A vê somente a campanha em que participa');
select is((select count(*) from public.campaigns where id = '91000000-0000-4000-8000-000000000002'), 0::bigint, 'Jogador A não abre campanha externa');
select is((select count(*) from public.characters where id = '92000000-0000-4000-8000-000000000001'), 1::bigint, 'Jogador A vê o próprio personagem');
select is((select count(*) from public.characters where id = '92000000-0000-4000-8000-000000000002'), 0::bigint, 'Jogador A não lê personagem alheio');
select is((select count(*) from public.campaign_members where campaign_id = '91000000-0000-4000-8000-000000000002'), 0::bigint, 'Jogador A não enumera membros externos');

select is(
  pg_temp.sqlstate_of($attack$
    select public.save_character_state(
      '92000000-0000-4000-8000-000000000001',
      '{"meta":{"appId":"marufia-latio","schemaVersion":5},"character":{"name":"A salvo"},"resources":{"hpCurrent":20,"pmCurrent":10},"effects":[],"inventory":{"weapons":[],"equipment":[]}}'::jsonb,
      2
    )
  $attack$),
  '00000',
  'Jogador A salva a própria ficha pela função autorizada'
);
select is(
  pg_temp.sqlstate_of($attack$
    select public.save_character_state(
      '92000000-0000-4000-8000-000000000002',
      '{"meta":{"appId":"marufia-latio","schemaVersion":5},"character":{"name":"Ataque"}}'::jsonb,
      2
    )
  $attack$),
  '42501',
  'Jogador A não salva personagem alheio mesmo conhecendo o UUID'
);
select is(
  pg_temp.sqlstate_of('update public.campaign_members set role = ''gm'' where campaign_id = ''91000000-0000-4000-8000-000000000001'' and user_id = ''90000000-0000-4000-8000-000000000002'''),
  '42501',
  'Jogador A não promove o próprio papel'
);
select is(
  pg_temp.sqlstate_of('insert into public.campaign_members (campaign_id, user_id, role) values (''91000000-0000-4000-8000-000000000002'', ''90000000-0000-4000-8000-000000000002'', ''gm'')'),
  '42501',
  'Jogador A não cria um vínculo gm diretamente'
);
select is(
  pg_temp.sqlstate_of('update public.characters set owner_id = ''90000000-0000-4000-8000-000000000002'' where id = ''92000000-0000-4000-8000-000000000002'''),
  '42501',
  'Jogador A não altera proprietário por ID conhecido'
);
select is(
  pg_temp.sqlstate_of('update public.characters set campaign_id = ''91000000-0000-4000-8000-000000000002'' where id = ''92000000-0000-4000-8000-000000000001'''),
  '42501',
  'Jogador A não associa a própria ficha a campanha externa'
);
select is(
  pg_temp.sqlstate_of('select public.gm_set_character_hp(''92000000-0000-4000-8000-000000000001'', 5, 3)'),
  '42501',
  'Jogador A não chama a operação de PV do Mæstre'
);
select is(
  pg_temp.sqlstate_of('select public.start_campaign_session(''91000000-0000-4000-8000-000000000001'', ''Ataque'')'),
  '42501',
  'Jogador A não inicia sessão da campanha'
);
select is((select count(*) from public.campaign_sessions), 0::bigint, 'Jogador A não lê sessões do Mæstre');
select is((select count(*) from public.campaign_presence), 0::bigint, 'Jogador A não lê presença da campanha');
select is((select count(*) from public.campaign_events), 0::bigint, 'Jogador A não lê histórico do Mæstre');
select is((select count(*) from public.rolls), 2::bigint, 'Jogador A vê rolagem pública e a própria secreta, mas não a rolagem gm');
select is(
  pg_temp.sqlstate_of(format('select public.join_campaign(%L)', (select join_code from public.campaigns where id = '91000000-0000-4000-8000-000000000001'))),
  '00000',
  'Reutilizar o convite existente é idempotente'
);
select is(
  (select role from public.campaign_members where campaign_id = '91000000-0000-4000-8000-000000000001' and user_id = '90000000-0000-4000-8000-000000000002'),
  'player',
  'Código de convite não transforma Jogador A em Mæstre'
);

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is((select count(*) from public.campaigns), 1::bigint, 'GM vê somente a campanha administrada');
select is((select count(*) from public.campaigns where id = '91000000-0000-4000-8000-000000000002'), 0::bigint, 'GM não abre campanha externa');
select is((select count(*) from public.characters where id = '92000000-0000-4000-8000-000000000001'), 1::bigint, 'GM lê personagem da própria campanha');
select is((select count(*) from public.characters where id = '92000000-0000-4000-8000-000000000002'), 0::bigint, 'GM não lê personagem de campanha externa');
select is(
  pg_temp.sqlstate_of('select public.gm_set_character_hp(''92000000-0000-4000-8000-000000000001'', 7, 3)'),
  '00000',
  'GM altera PV somente na campanha administrada'
);
select is(
  pg_temp.sqlstate_of('select public.gm_set_character_hp(''92000000-0000-4000-8000-000000000002'', 7, 2)'),
  '42501',
  'GM não altera personagem de campanha externa por UUID'
);
select is((select count(*) from public.campaign_sessions), 1::bigint, 'GM lê sessão da própria campanha');
select is((select count(*) from public.campaign_presence), 1::bigint, 'GM lê presença da própria campanha');
select cmp_ok((select count(*) from public.campaign_events), '>=', 3::bigint, 'GM lê o histórico autorizado da própria campanha');
select is((select count(*) from public.rolls), 3::bigint, 'GM vê pública, secreta e a própria rolagem gm');

select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000003","role":"authenticated"}', true);

select is((select count(*) from public.campaigns), 1::bigint, 'Jogador B vê somente sua campanha externa');
select is((select count(*) from public.campaigns where id = '91000000-0000-4000-8000-000000000001'), 0::bigint, 'Jogador B não abre a campanha do GM');
select is((select count(*) from public.characters where id = '92000000-0000-4000-8000-000000000002'), 1::bigint, 'Jogador B vê o próprio personagem');
select is((select count(*) from public.characters where id = '92000000-0000-4000-8000-000000000001'), 0::bigint, 'Jogador B não lê personagem A');
select is(
  pg_temp.sqlstate_of('select public.save_character_state(''92000000-0000-4000-8000-000000000001'', ''{"meta":{"appId":"marufia-latio","schemaVersion":5},"character":{"name":"Ataque B"}}''::jsonb, 4)'),
  '42501',
  'Jogador B não salva personagem A usando UUID e revisão conhecidos'
);
select is(
  pg_temp.sqlstate_of('update public.campaign_members set role = ''gm'' where campaign_id = ''91000000-0000-4000-8000-000000000002'' and user_id = ''90000000-0000-4000-8000-000000000003'''),
  '42501',
  'Jogador B também não altera o próprio papel'
);

reset role;
select * from finish();
select string_agg(result, E'\n') as security_results from pg_temp.tap_results;
rollback;
