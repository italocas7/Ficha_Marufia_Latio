begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Mantém updated_at no banco sem depender do relógio do aplicativo.';

revoke all privileges on function public.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null
    or char_length(btrim(display_name)) between 1 and 80
  ),
  constraint profiles_avatar_url_length check (
    avatar_url is null
    or char_length(btrim(avatar_url)) between 1 and 2048
  )
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references auth.users (id) on delete cascade,
  join_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_name_length check (
    char_length(btrim(name)) between 1 and 100
  ),
  constraint campaigns_description_length check (
    char_length(description) <= 5000
  ),
  constraint campaigns_join_code_format check (
    join_code ~ '^MRF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$'
  )
);

comment on column public.campaigns.join_code is
  'Código de convite; nunca concede privilégios administrativos por si só.';

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id),
  constraint campaign_members_role check (
    role in ('gm', 'player', 'assistant_gm', 'spectator')
  )
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  name text not null,
  state jsonb not null,
  schema_version smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint characters_name_length check (
    char_length(btrim(name)) between 1 and 120
  ),
  constraint characters_schema_version_positive check (
    schema_version > 0
  ),
  constraint characters_state_object check (
    jsonb_typeof(state) = 'object'
  ),
  constraint characters_state_version_matches check (
    state @> jsonb_build_object('schemaVersion', schema_version)
  )
);

comment on column public.characters.state is
  'Estado serializado integral da ficha; o formato atual continua sendo o schema v5.';
comment on column public.characters.campaign_id is
  'Pode ser nulo para preservar personagens que ainda não pertencem a uma campanha.';

create table public.rolls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  roll_type text not null,
  skill_name text,
  mode text,
  formula text,
  raw_roll jsonb not null,
  modifier integer,
  target integer,
  total integer,
  outcome text,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  constraint rolls_roll_type_length check (
    char_length(btrim(roll_type)) between 1 and 80
  ),
  constraint rolls_skill_name_length check (
    skill_name is null or char_length(btrim(skill_name)) between 1 and 120
  ),
  constraint rolls_mode_length check (
    mode is null or char_length(btrim(mode)) between 1 and 40
  ),
  constraint rolls_formula_length check (
    formula is null or char_length(btrim(formula)) between 1 and 120
  ),
  constraint rolls_raw_roll_shape check (
    jsonb_typeof(raw_roll) in ('number', 'array', 'object')
  ),
  constraint rolls_outcome_length check (
    outcome is null or char_length(btrim(outcome)) between 1 and 80
  ),
  constraint rolls_visibility check (
    visibility in ('public', 'gm', 'secret')
  )
);

create table public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  actor_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint campaign_events_type_length check (
    char_length(btrim(event_type)) between 1 and 80
  ),
  constraint campaign_events_payload_object check (
    jsonb_typeof(payload) = 'object'
  )
);

create index campaigns_owner_id_idx
  on public.campaigns (owner_id);

create index campaign_members_user_id_idx
  on public.campaign_members (user_id);
create index campaign_members_campaign_role_idx
  on public.campaign_members (campaign_id, role);

create index characters_owner_id_idx
  on public.characters (owner_id);
create index characters_campaign_id_idx
  on public.characters (campaign_id);
create index characters_campaign_updated_at_idx
  on public.characters (campaign_id, updated_at desc);

create index rolls_campaign_created_at_idx
  on public.rolls (campaign_id, created_at desc);
create index rolls_character_created_at_idx
  on public.rolls (character_id, created_at desc);
create index rolls_user_created_at_idx
  on public.rolls (user_id, created_at desc);

create index campaign_events_campaign_created_at_idx
  on public.campaign_events (campaign_id, created_at desc);
create index campaign_events_character_created_at_idx
  on public.campaign_events (character_id, created_at desc);
create index campaign_events_actor_created_at_idx
  on public.campaign_events (actor_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;
alter table public.rolls enable row level security;
alter table public.campaign_events enable row level security;

-- A Fase 6 termina em deny-by-default: nenhuma policy permissiva existe ainda.
-- Cada fase funcional concederá somente os privilégios e as policies de que precisar.
revoke all privileges on table
  public.profiles,
  public.campaigns,
  public.campaign_members,
  public.characters,
  public.rolls,
  public.campaign_events
from anon, authenticated;

commit;
