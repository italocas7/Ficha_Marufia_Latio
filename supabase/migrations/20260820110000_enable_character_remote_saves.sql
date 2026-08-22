begin;

grant update (state) on table public.characters to authenticated;

comment on column public.characters.state is
  'Documento integral da ficha Marufia; o proprietário autenticado pode atualizar somente esta coluna e campaign_id.';

commit;
