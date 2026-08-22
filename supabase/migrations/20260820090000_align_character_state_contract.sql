begin;

alter table public.characters
drop constraint characters_state_version_matches;

alter table public.characters
add constraint characters_state_version_matches check (
  state @> jsonb_build_object(
    'meta',
    jsonb_build_object(
      'appId', 'marufia-latio',
      'schemaVersion', schema_version
    )
  )
);

comment on column public.characters.state is
  'Estado serializado integral da ficha; appId e schemaVersion permanecem dentro de meta, conforme o contrato local.';

comment on column public.characters.schema_version is
  'Cópia indexável de state.meta.schemaVersion, protegida por constraint de consistência.';

commit;
