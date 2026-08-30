# Auditoria do Marufia Server — Fase 0

Data da auditoria: 30/08/2026

Repositório: `Ficha de Marufia (Latio)`

Versão observada: Marufia Online Alpha `0.2.2`

Branch observada: `main`

Escopo: inventário e diagnóstico; nenhuma migração ou infraestrutura self-hosted foi criada.

## 1. Resumo executivo

O Marufia já é uma aplicação online funcional e não precisa ser reconstruído. O mesmo cliente HTML/CSS/JavaScript é usado no navegador e no aplicativo Windows/Tauri. Ele mantém a ficha primeiro no armazenamento local e, quando existe uma conta e um personagem vinculado, comunica-se diretamente com o Supabase Cloud usando a biblioteca oficial `@supabase/supabase-js`.

Não existe hoje um backend de aplicação separado entre o cliente e o Supabase. A autorização real está concentrada no PostgreSQL por meio de Row Level Security (RLS), grants por coluna, funções SQL protegidas e identidade derivada de `auth.uid()`. Esse desenho é compatível com Supabase Self-Hosted e deve ser preservado.

Principais conclusões:

- o projeto Cloud atual é `https://nuczqjyahusjyvepqthx.supabase.co`;
- URL, chave pública, URL do site e CSP do Tauri ainda contêm destinos fixos;
- o banco possui oito tabelas públicas, todas com RLS;
- o cliente usa as oito tabelas e quinze RPCs públicas;
- seis tabelas participam da publicação `supabase_realtime`;
- autenticação por email e senha, sessão persistente e refresh automático já estão implementados;
- Supabase Storage e Edge Functions não são usados;
- já existem fila offline, sincronização com debounce, revisão monotônica e tratamento explícito de conflitos;
- as 26 migrations locais aparecem no histórico remoto, inclusive a migration `20260822130000`, que documentação anterior ainda descrevia como pendente;
- na verificação de 30/08/2026, o Realtime Cloud aceitou conexão, mas a Data API respondeu `HTTP 503 / PGRST002` ao tentar carregar seu cache de schema;
- Docker, Docker Compose, `cloudflared` e `psql` não estavam disponíveis no `PATH` desta máquina durante a auditoria.

Não foram encontrados motivos para abandonar Supabase. O caminho de menor risco é portar a configuração, as migrations e os testes existentes para uma instalação self-hosted experimental, mantendo o Cloud ativo até a validação final.

## 2. Fontes e método

A auditoria utilizou:

- código-fonte em `src/online/`, `src/core/`, `app.js`, `index.html` e `gm_view.html`;
- configurações de build, site e Tauri;
- todas as migrations em `supabase/migrations/`;
- suíte SQL ofensiva em `supabase/tests/rls_security.test.sql`;
- testes Python, JavaScript e navegador existentes;
- histórico de migrations do projeto Cloud vinculado;
- sondas públicas de Auth, REST/Data API e Realtime;
- documentação oficial atual do Supabase Self-Hosted.

Segredos não foram copiados para este documento. A chave pública distribuída no cliente é identificada apenas como `sb_publishable_…`.

Referências oficiais usadas para orientar a avaliação:

- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting): diferencia a pilha local da CLI de uma implantação self-hosted de produção e atribui ao operador manutenção, segurança, backups e disponibilidade.
- [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker): descreve o Compose oficial, gateway, configuração por ambiente e serviços disponíveis.
- [Restore a Platform Project to Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform): documenta exportação de roles, schema e dados, inclusão de `auth.users` e itens que precisam de configuração separada.
- [Auth Self-Hosting Config](https://supabase.com/docs/guides/self-hosting/auth/config): documenta URL do site, redirects, cadastro e configuração do Auth por variáveis de ambiente.

## 3. Arquitetura atual

```text
NAVEGADOR OU APLICATIVO WINDOWS/TAURI
│
├── HTML, CSS e JavaScript da ficha
├── estado completo schema v5 em localStorage
├── backups locais e importação/exportação JSON
├── fila offline de personagens e rolagens
└── @supabase/supabase-js
       │
       ├── Auth: email/senha e sessão
       ├── PostgREST: leitura e operações permitidas por RLS
       ├── RPC: escritas protegidas e validadas no banco
       └── Realtime: postgres_changes por campanha/personagem
              │
              ▼
        SUPABASE CLOUD ATUAL
        ├── PostgreSQL
        ├── Auth
        ├── REST API / PostgREST
        └── Realtime

HOSPEDAGEM WEB ATUAL
└── server/index.js
    └── Worker de arquivos estáticos e app-update.json
        (não é um backend do jogo)
```

### Fluxo de salvamento de personagem

```text
edição na ficha
   ↓
salvamento local imediato
   ↓
debounce remoto de 1 segundo
   ↓
RPC save_character_state(expected_revision)
   ↓
PostgreSQL valida proprietário, schema e revisão
   ↓
UPDATE em characters
   ↓
Realtime notifica Jogador e Mæstre autorizado
```

### Fluxo de rolagem

```text
rolagem gerada localmente
   ↓
RPC record_roll
   ↓
banco deriva usuário, campanha e visibilidade efetiva
   ↓
INSERT em rolls
   ↓
Realtime
   ↓
participantes autorizados recebem a rolagem
```

### Fluxo offline já existente

```text
servidor indisponível
   ↓
ficha continua salva localmente
   ↓
última versão pendente do personagem fica na fila
rolagens pendentes ficam preservadas separadamente
   ↓
conexão retorna
   ↓
sincronização usa a revisão esperada
   ↓
divergência abre conflito; não sobrescreve silenciosamente
```

## 4. Configuração e criação do cliente Supabase

### Arquivos envolvidos

| Arquivo | Responsabilidade atual |
|---|---|
| `src/online/project.js` | Define diretamente URL do Supabase, chave pública e URL do site. |
| `src/online/config.js` | Valida URL/chave e recusa chave secreta ou JWT com papel `service_role`. |
| `src/online/supabase.js` | Cria e reutiliza o cliente oficial Supabase. |
| `.env` | Não versionado; contém somente URL e chave pública, mas não é lido pelo build atual. |
| `.env.example` | Modelo seguro com `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. |
| `tools/build.py` | Copia `src/online/project.js` para o pacote sem gerar configuração por ambiente. |
| `src-tauri/tauri.conf.json` | CSP permite explicitamente somente o Supabase Cloud atual e o site oficial. |

### Estado da configuração

- URL pública atual: `https://nuczqjyahusjyvepqthx.supabase.co`.
- Chave no frontend: chave pública `sb_publishable_…`, apropriada para cliente.
- URL de confirmação/site: `https://ficha-marufia-latio.italocas7.chatgpt.site`.
- O cliente também aceita conceitualmente `SUPABASE_ANON_KEY`, mas o projeto utiliza `SUPABASE_PUBLISHABLE_KEY`.
- HTTPS é obrigatório, exceto `http://localhost`, `127.0.0.1` ou `::1` para desenvolvimento local.
- `autoRefreshToken`, `persistSession` e `detectSessionInUrl` estão ativos.
- A sessão usa a chave isolada `marufia-online-auth-v1`.
- `.gitignore` ignora `.env` e variantes, preservando somente `.env.example`.
- Não há `service_role`, senha de banco, JWT secret ou chave administrativa no cliente versionado.

### Pontos fixos que precisarão de adaptação

1. `src/online/project.js` contém o destino Cloud diretamente.
2. O build apenas copia esse arquivo; não existe seleção Cloud/local/self-hosted.
3. A CSP do Tauri contém os hosts HTTPS/WSS do projeto Cloud.
4. Testes de site e prontidão verificam literalmente o host Cloud atual.
5. Auth usa a URL pública do site para confirmação de email.
6. O manifesto de atualização do aplicativo continua hospedado no site atual e é independente do backend do jogo.

## 5. Bibliotecas e serviços utilizados

| Componente | Uso atual | Versão/observação |
|---|---|---|
| `@supabase/supabase-js` | Auth, PostgREST, RPC e Realtime | `2.112.3`; também existe cópia vendorizada em `vendor/supabase.js`. |
| Supabase CLI | Migrations, ligação ao projeto e testes remotos | `2.115.0` no repositório. |
| PostgreSQL | Dados, JSONB, autorização, funções e histórico | Versão do Cloud deve ser consultada antes do restore. |
| Auth/GoTrue | Email e senha | Usado diretamente pelo cliente. |
| PostgREST | Consultas e chamadas RPC | Usado para as oito tabelas públicas. |
| Realtime | `postgres_changes` | Seis tabelas publicadas. |
| Storage | Não utilizado | Nenhum bucket, policy ou chamada `storage.*`. |
| Edge Functions | Não utilizadas | Não existe `supabase/functions/` nem `functions.invoke`. |
| Supabase Studio | Administração do Cloud | Não faz parte do funcionamento do cliente. |

O arquivo `src/core/storage.js` é uma abstração de persistência local/remota do próprio aplicativo. Apesar do nome, ele não utiliza Supabase Storage.

## 6. Autenticação e sessões

### Fluxos implementados

- cadastro com nome exibido, email e senha;
- confirmação de email e reenvio da confirmação;
- login com `signInWithPassword`;
- restauração da sessão com `getSession`;
- atualização automática de access token pelo cliente oficial;
- reação a mudanças de sessão por `onAuthStateChange`;
- logout do dispositivo atual;
- leitura do perfil correspondente em `public.profiles`;
- continuidade da ficha local quando o serviço online falha.

### Fluxos não implementados

- redefinição/recuperação de senha;
- OAuth/social login;
- login por telefone;
- MFA;
- SSO/SAML;
- contas administrativas no frontend.

### Implicações para self-hosted

- `auth.users` e hashes de senha podem ser incluídos em uma exportação oficial do banco; contas não precisam ser recriadas manualmente.
- Com um novo segredo JWT, tokens existentes do Cloud deixam de ser válidos e os usuários terão de entrar novamente.
- Reutilizar segredo JWT exige decisão de segurança explícita e manuseio fora do repositório; não deve ser presumido.
- Cadastro e reenvio de confirmação exigirão SMTP real no servidor self-hosted.
- `SITE_URL`, allow-list de redirects e templates de email terão de ser configurados no ambiente do Auth.
- Nenhuma conta será apagada ou recriada automaticamente.

## 7. Banco de dados

### 7.1 Tabelas e colunas finais

Todas as oito tabelas abaixo estão no schema `public` e possuem RLS habilitado.

#### `profiles`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid` | PK e FK para `auth.users.id`, `ON DELETE CASCADE`. |
| `display_name` | `text` | Opcional, 1–80 caracteres quando informado. |
| `avatar_url` | `text` | Opcional, 1–2048 caracteres quando informada. |
| `created_at` | `timestamptz` | Definido pelo banco. |
| `updated_at` | `timestamptz` | Atualizado por gatilho. |

#### `campaigns`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid` | PK gerada no banco. |
| `name` | `text` | Obrigatório, 1–100 caracteres. |
| `description` | `text` | Até 5000 caracteres. |
| `owner_id` | `uuid` | FK para `auth.users.id`, `ON DELETE CASCADE`. |
| `join_code` | `text` | Único; formato `MRF-XXXX-XX`. |
| `roll_history_revision` | `bigint` | Revisão monotônica da limpeza de rolagens; padrão 0. |
| `created_at` | `timestamptz` | Definido pelo banco. |
| `updated_at` | `timestamptz` | Atualizado por gatilho. |

#### `campaign_members`

| Coluna | Tipo | Observação |
|---|---|---|
| `campaign_id` | `uuid` | PK composta e FK para `campaigns.id`, `ON DELETE CASCADE`. |
| `user_id` | `uuid` | PK composta e FK para `auth.users.id`, `ON DELETE CASCADE`. |
| `role` | `text` | `gm`, `player`, `assistant_gm` ou `spectator`. |
| `joined_at` | `timestamptz` | Definido pelo banco. |

Somente o papel exato `gm` recebe permissões de Mæstre nas policies/RPCs atuais. Os demais papéis existem para compatibilidade futura, não como equivalentes administrativos.

#### `characters`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid` | PK gerada no banco. |
| `owner_id` | `uuid` | FK para `auth.users.id`, `ON DELETE CASCADE`. |
| `campaign_id` | `uuid` | FK opcional para `campaigns.id`, `ON DELETE SET NULL`. |
| `name` | `text` | Derivado de `state`, 1–120 caracteres. |
| `state` | `jsonb` | Documento integral da ficha schema v5. |
| `schema_version` | `smallint` | Cópia protegida de `state.meta.schemaVersion`. |
| `revision` | `bigint` | Revisão positiva, inicia em 1 e avança em alterações. |
| `last_change_origin` | `text` | `player`, `gm` ou `system`, definido no banco. |
| `created_at` | `timestamptz` | Definido pelo banco. |
| `updated_at` | `timestamptz` | Atualizado por gatilho. |

O estado precisa conter `meta.appId = "marufia-latio"` e `meta.schemaVersion` igual a `schema_version`. A ficha não foi normalizada em dezenas de tabelas; regras, atributos, inventário e magias permanecem no JSONB versionado existente.

#### `rolls`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid` | PK; o UUID enviado permite repetição idempotente. |
| `campaign_id` | `uuid` | FK para `campaigns.id`, `ON DELETE CASCADE`. |
| `character_id` | `uuid` | FK opcional para `characters.id`, `ON DELETE SET NULL`. |
| `user_id` | `uuid` | FK opcional para `auth.users.id`, `ON DELETE SET NULL`. |
| `character_name` | `text` | Snapshot seguro do nome na rolagem. |
| `roll_type` | `text` | Tipo validado da rolagem. |
| `skill_name` | `text` | Perícia opcional. |
| `mode` | `text` | Modo da rolagem. |
| `formula` | `text` | Fórmula validada. |
| `raw_roll` | `jsonb` | Resultado bruto. |
| `modifier`, `target`, `total` | `integer` | Valores conferidos no servidor. |
| `outcome` | `text` | Resultado textual validado. |
| `visibility` | `text` | `public`, `secret` ou `gm`. |
| `created_at` | `timestamptz` | Definido pelo banco. |

#### `campaign_events`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid` | PK gerada no banco. |
| `campaign_id` | `uuid` | FK para `campaigns.id`, `ON DELETE CASCADE`. |
| `character_id` | `uuid` | FK opcional para `characters.id`, `ON DELETE SET NULL`. |
| `actor_id` | `uuid` | FK opcional para `auth.users.id`, `ON DELETE SET NULL`. |
| `session_id` | `uuid` | FK opcional para `campaign_sessions.id`, `ON DELETE SET NULL`. |
| `event_type` | `text` | PV, PM, condições, item ou rolagem. |
| `payload` | `jsonb` | Resumo do evento, nunca a ficha inteira. |
| `created_at` | `timestamptz` | Definido pelo banco. |

#### `campaign_presence`

| Coluna | Tipo | Observação |
|---|---|---|
| `campaign_id` | `uuid` | PK composta. |
| `user_id` | `uuid` | PK composta. |
| `seen_at` | `timestamptz` | Último heartbeat. |
| `active_at` | `timestamptz` | Última atividade. |

A FK composta exige que `(campaign_id, user_id)` exista em `campaign_members` e remove a presença quando o vínculo termina.

#### `campaign_sessions`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `uuid` | PK gerada no banco. |
| `campaign_id` | `uuid` | FK para `campaigns.id`, `ON DELETE CASCADE`. |
| `name` | `text` | 1–120 caracteres. |
| `started_at` | `timestamptz` | Definido pelo banco. |
| `ended_at` | `timestamptz` | Nulo enquanto ativa. |
| `status` | `text` | `active` ou `ended`. |

Um índice único parcial impede mais de uma sessão ativa na mesma campanha.

### 7.2 Relacionamentos principais

```text
auth.users
├── profiles (1:1)
├── campaigns.owner_id
├── campaign_members.user_id
├── characters.owner_id
├── rolls.user_id
└── campaign_events.actor_id

campaigns
├── campaign_members
├── characters
├── rolls
├── campaign_events
├── campaign_presence (por vínculo composto)
└── campaign_sessions

characters
├── rolls
└── campaign_events

campaign_sessions
└── campaign_events
```

### 7.3 Índices

Além de PKs e unicidade de `campaigns.join_code`, existem índices para:

- campanhas por `owner_id`;
- membros por `user_id` e por `(campaign_id, role)`;
- personagens por proprietário, campanha e atualização recente;
- rolagens por campanha, personagem e usuário, ordenadas por criação;
- eventos por campanha, personagem, autor e sessão, ordenados por criação;
- presença por `seen_at` e `active_at` dentro da campanha;
- sessões por campanha/início e uma única sessão ativa por campanha.

### 7.4 Views, enums, Storage e extensões

- Não existem views ou materialized views criadas pelas migrations do Marufia.
- Não existem enums PostgreSQL próprios; os papéis e estados usam `text` com constraints.
- Não existem buckets ou policies do Supabase Storage.
- Não existem Edge Functions.
- As migrations do aplicativo não declaram `CREATE EXTENSION`. Elas usam recursos disponíveis no Supabase, como geração de UUID; a suíte SQL remota usa pgTAP. A lista completa de extensões instaladas no Cloud deverá ser capturada antes da restauração.

## 8. Funções SQL e RPCs

### 8.1 Quinze RPCs chamadas pelo cliente

| Função | Contrato resumido | Autoridade |
|---|---|---|
| `join_campaign(text)` | Entra por código e retorna campanha/papel. | Identidade vem de `auth.uid()`; novo vínculo sempre nasce `player`. |
| `save_character_state(uuid, jsonb, bigint)` | Salva ficha na revisão esperada. | Somente proprietário; conflito usa SQLSTATE `40001`. |
| `record_roll(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text, text)` | Registra rolagem e retorna ID/visibilidade efetiva. | Deriva usuário/campanha e valida fórmula/resultado. |
| `touch_campaign_presence(uuid, boolean)` | Atualiza heartbeat e atividade. | Somente participante autenticado. |
| `gm_set_character_hp(uuid, integer, bigint)` | Altera PV atual. | Somente `gm` da campanha, com revisão. |
| `gm_set_character_pm(uuid, integer, bigint)` | Altera PM atual. | Somente `gm` da campanha, com revisão. |
| `gm_add_character_condition(uuid, text, integer, integer, bigint)` | Adiciona condição temporária. | Somente `gm`, operação granular. |
| `gm_remove_character_condition(uuid, text, bigint)` | Remove condição por ID. | Somente `gm`, operação granular. |
| `gm_add_character_item(uuid, text, text, text, integer, text, text, text, text, bigint)` | Adiciona arma/equipamento. | Somente `gm`, tipos permitidos. |
| `gm_remove_character_item(uuid, text, text, bigint)` | Remove arma/equipamento por ID. | Somente `gm`, tipos permitidos. |
| `start_campaign_session(uuid, text)` | Inicia uma sessão. | Somente `gm`; horário vem do banco. |
| `end_campaign_session(uuid)` | Encerra uma sessão. | Somente `gm`; idempotente. |
| `update_campaign(uuid, text, text)` | Edita nome e descrição. | Somente proprietário da campanha. |
| `delete_campaign(uuid, text)` | Exclui após confirmação exata do nome. | Somente proprietário; mantém personagens desvinculados. |
| `clear_campaign_roll_history(uuid)` | Apaga rolagens e resumos correspondentes. | Somente `gm`; incrementa `roll_history_revision`. |

### 8.2 Funções internas e de gatilho

- `public.set_updated_at()` — mantém timestamps.
- `public.create_profile_for_new_user()` — cria perfil após cadastro em Auth.
- `public.prepare_new_campaign()` — deriva proprietário e código de convite.
- `private.is_campaign_owner(uuid)` — verificação histórica de proprietário.
- `private.add_campaign_owner_membership()` — registra o proprietário como `gm`.
- `private.campaign_role(uuid)` — resolve o papel do usuário atual na campanha.
- `private.join_campaign_by_code(text)` — consulta protegida do convite.
- `private.prepare_character_write()` — deriva e valida metadados do JSONB.
- `private.version_character_write()` — controla revisão e origem.
- `private.record_character_history()` — cria eventos seletivos de ficha.
- `private.record_roll_history()` — cria resumo de rolagem.
- `private.active_campaign_session(uuid)` — resolve sessão ativa.
- `private.attach_campaign_event_session()` — associa evento à sessão ativa.
- `private.require_gm_character_campaign(uuid, bigint)` — valida campanha, papel e revisão para ações do Mæstre.

As funções `security definer` usam `search_path` vazio e referências qualificadas. Funções privilegiadas não são executáveis por `anon`; os caminhos autorizados para `authenticated` validam novamente identidade, campanha, papel e revisão.

## 9. Gatilhos

| Gatilho | Tabela/evento | Efeito |
|---|---|---|
| `profiles_set_updated_at` | `profiles` antes de update | Atualiza `updated_at`. |
| `campaigns_set_updated_at` | `campaigns` antes de update | Atualiza `updated_at`. |
| `characters_set_updated_at` | `characters` antes de update | Atualiza `updated_at`. |
| `marufia_create_profile_after_signup` | `auth.users` após insert | Cria `profiles`. |
| `marufia_prepare_campaign_before_insert` | `campaigns` antes de insert | Define owner e convite. |
| `marufia_add_campaign_owner_after_insert` | `campaigns` após insert | Adiciona vínculo `gm`. |
| `marufia_prepare_character_before_write` | `characters` antes de insert/update | Valida estado, nome, versão e autoridade. |
| `marufia_version_character_before_write` | `characters` antes de update | Incrementa revisão e registra origem. |
| `marufia_character_history_after_update` | `characters` após update | Registra somente mudanças relevantes. |
| `marufia_roll_history_after_insert` | `rolls` após insert | Registra resumo autorizado. |
| `marufia_campaign_event_session_before_insert` | `campaign_events` antes de insert | Liga à sessão ativa. |

## 10. RLS e permissões

### 10.1 Matriz das policies finais

| Tabela | Policy | Operação | Regra efetiva |
|---|---|---|---|
| `profiles` | `profiles_select_own` | SELECT | Usuário lê o próprio perfil. |
| `profiles` | `profiles_update_own` | UPDATE | Usuário altera somente o próprio perfil e apenas colunas concedidas. |
| `campaigns` | `campaigns_select_member` | SELECT | Proprietário ou participante lê a campanha vinculada. |
| `campaigns` | `campaigns_insert_owned` | INSERT | Campanha nasce para o usuário autenticado; campos protegidos são derivados. |
| `campaign_members` | `campaign_members_select_by_campaign_role` | SELECT | Usuário lê o próprio vínculo; `gm` lê membros da própria campanha. |
| `characters` | `characters_select_owned` | SELECT | Proprietário lê a própria ficha. |
| `characters` | `characters_select_campaign_gm` | SELECT | `gm` lê fichas vinculadas à campanha administrada. |
| `characters` | `characters_insert_owned` | INSERT | Usuário cria personagem próprio. |
| `characters` | `characters_update_owned` | UPDATE | Proprietário atualiza somente sua linha e colunas concedidas. |
| `rolls` | `rolls_select_by_campaign_visibility` | SELECT | Exige vínculo e respeita `public`, `secret` e `gm`. |
| `campaign_events` | `campaign_events_select_campaign_gm` | SELECT | Somente `gm`; rolagem `gm` fica restrita ao próprio autor. |
| `campaign_presence` | `campaign_presence_select_campaign_gm` | SELECT | Somente `gm` da campanha. |
| `campaign_sessions` | `campaign_sessions_select_campaign_gm` | SELECT | Somente `gm` da campanha. |

### 10.2 Grants e fronteira de escrita

- `public` e `anon` não têm operações diretas nas oito tabelas.
- `authenticated` recebe apenas leituras autorizadas e grants por coluna necessários.
- Não há escrita direta do navegador em membros, rolagens, eventos, presença ou sessões.
- O estado do personagem não é atualizado diretamente; usa `save_character_state`.
- O Mæstre não recebe `UPDATE` geral na ficha; usa operações granulares.
- Identidades, proprietário, papel e campanha não são aceitos do cliente como autoridade.
- RLS protege REST e também filtra as linhas entregues pelo Realtime.

### 10.3 Cenários de segurança cobertos

A suíte remota transacional contém 35 verificações com um `gm`, Jogador A e Jogador B. Ela cobre:

- leitura de campanha e personagem externos;
- enumeração de membros de outra campanha;
- salvamento de ficha alheia;
- escalada de papel e criação de vínculo `gm`;
- transferência de proprietário;
- associação a campanha externa;
- chamadas de RPC do Mæstre por jogador;
- leitura de presença, sessões e histórico;
- visibilidades `public`, `secret` e `gm`;
- caminhos legítimos de jogador e Mæstre, evitando falso positivo por bloqueio geral.

O teste abre uma transação e executa `ROLLBACK`; não deve deixar identidades ou dados de teste persistidos.

## 11. Realtime

### 11.1 Publicação do PostgreSQL

As migrations adicionam seis tabelas à publicação `supabase_realtime`:

| Tabela | Eventos consumidos | Finalidade |
|---|---|---|
| `characters` | UPDATE ou `*`, filtrado por personagem/campanha | Sincronizar ficha e painel do Mæstre. |
| `rolls` | INSERT, filtrado por campanha | Mostrar rolagens ao vivo. |
| `campaign_presence` | `*`, filtrado por campanha | Atualizar online/ausente/offline. |
| `campaign_events` | INSERT, filtrado por campanha | Atualizar histórico seletivo. |
| `campaign_sessions` | `*`, filtrado por campanha | Atualizar ciclo de sessões. |
| `campaigns` | UPDATE, filtrado por ID | Avisar limpeza de histórico via revisão. |

`campaigns` usa `REPLICA IDENTITY FULL` para que o cliente compare a revisão anterior e a nova. As demais subscriptions consomem dados novos suficientes para seus fluxos e não habilitam imagem completa antiga sem necessidade.

### 11.2 Canais do cliente

- Jogador: um canal filtrado pelo UUID do personagem.
- Mæstre: um canal por campanha para personagens, presença, eventos, sessões e revisão da campanha.
- Rolagens ao vivo: canal por campanha para inserts em `rolls` e updates de `campaigns`.
- Canais são removidos por `removeChannel` ao encerrar/trocar o contexto.
- Testes verificam filtros, payloads malformados e encerramento de canais.

### 11.3 Eventos prioritários já atendidos

```text
Jogador altera PV/PM/ficha
    → characters UPDATE
    → Mæstre recebe pelo canal da campanha

Jogador rola dado
    → rolls INSERT
    → participantes autorizados recebem pelo canal da campanha

Mæstre altera PV/PM/condição/item
    → RPC granular + nova revision
    → Jogador recebe characters UPDATE
```

Para self-hosted, o gateway externo deverá encaminhar corretamente HTTPS e WebSocket. Cloudflare Tunnel não pode publicar apenas REST e esquecer `/realtime/v1`.

## 12. Persistência local, offline e conflitos

### Chaves locais relevantes

| Chave | Conteúdo |
|---|---|
| `marufia-latio-state-v1` | Estado integral da ficha atual. |
| `marufia-latio-backups-v1` | Até cinco backups locais recentes. |
| `marufia-online-auth-v1` | Sessão mantida pelo cliente Supabase. |
| `marufia-online-character-imports-v1` | Marcadores de importação por conta/ficha. |
| `marufia-online-character-sync-v1` | Metadados de revisão e sincronização. |
| `marufia-online-pending-saves-v1` | Último snapshot pendente por conta/personagem. |
| `marufia-online-pending-rolls-v1` | Rolagens ainda não registradas. |

### Comportamento existente

- O salvamento local ocorre antes da notificação aos módulos online.
- O envio remoto de personagem espera um segundo sem novas alterações.
- A fila de personagem conserva somente o snapshot mais recente por conta/personagem.
- Rolagens pendentes são preservadas individualmente e reenviadas apenas no contexto correto.
- Falhas transitórias mantêm a fila; recusas definitivas de payload/campanha não são repetidas indefinidamente.
- `characters.revision` e `expected_revision` impedem sobrescrita cega.
- Uma divergência abre escolha explícita entre preservar a versão local ou aceitar a remota.
- A versão remota pode ser baixada no envelope de backup online v1.

### Limitações

- A fila vive no armazenamento do dispositivo; limpar dados do navegador pode removê-la.
- O aplicativo web não possui Service Worker próprio para garantir o carregamento inicial sem internet.
- O pacote Tauri carrega seus arquivos localmente, mas ainda depende do servidor para dados online.
- A fila não é um sistema distribuído multi-documento; resolve o caso atual de uma ficha por revisão.
- Trocar de backend exige separar sessão e metadados por ambiente para evitar misturar IDs do Cloud e do self-hosted.

## 13. Mapa do cliente para o Supabase

| Módulo | Tabelas | RPCs/serviços |
|---|---|---|
| `auth.js` | `profiles` | Auth: signup, login, sessão, refresh, resend e logout. |
| `campaigns.js` | `campaigns`, `campaign_members` | `join_campaign`, `update_campaign`, `delete_campaign`. |
| `characters.js` | `characters` | `save_character_state`; criação e vínculo controlados. |
| `character_realtime.js` | `characters` | Canal filtrado por personagem ou campanha. |
| `character_sync.js` | — | Fila local, debounce, revisão e conflitos. |
| `character_import.js` | `characters` indiretamente | Backup anterior e criação da cópia online. |
| `rolls.js` | — | `record_roll` e fila local de rolagens. |
| `live_rolls.js` | `rolls`, `campaigns` | Realtime e `clear_campaign_roll_history`. |
| `gm_panel.js` | `characters`, `campaign_presence`, `campaign_events`, `campaign_sessions`, `campaigns` | Presença, sessões e seis ações granulares do Mæstre. |
| `home.js` | Dados agregados pelos serviços | Coordena conta, campanhas, personagens e painéis. |
| `settings.js` | — | Exibe estado local, conta, sincronização e versão. |

Não foram encontradas URLs do Supabase dentro de `app.js` ou `data.js`.

## 14. Migrations e estado do Cloud

O repositório contém 26 migrations SQL numeradas entre:

- `20260820030000_create_marufia_online_foundation.sql`;
- `20260822130000_clear_campaign_roll_history.sql`.

Em 30/08/2026, `supabase migration list --linked` conectou ao banco remoto e informou correspondência local/remota para as 26 versões. Isso corrige a afirmação em `docs/database-schema.md` de que `20260822130000` ainda estaria somente local.

Essa confirmação valida o histórico de migrations, mas não substitui um dump do catálogo. Antes da migração deverão ser exportados e comparados:

- roles;
- schemas e objetos reais;
- dados;
- `auth.users` e tabelas relacionadas;
- extensões instaladas;
- configurações de Auth;
- publicação Realtime;
- qualquer configuração criada manualmente no painel Cloud.

`supabase/seed.sql` não contém dados de produção; está reservado para testes locais.

## 15. Classificação de compatibilidade

### COMPATÍVEL COM SELF-HOSTED

| Componente | Motivo |
|---|---|
| Cliente `supabase-js` | Já recebe URL e chave como parâmetros e usa APIs padrão. |
| PostgreSQL e migrations | SQL, JSONB, constraints, índices, triggers, functions e RLS são portáveis. |
| PostgREST | As oito tabelas e RPCs usam o contrato padrão do Supabase. |
| Auth email/senha | GoTrue self-hosted suporta os fluxos usados. |
| Realtime Postgres Changes | Publicação e filtros usados são suportados pelo serviço self-hosted. |
| RLS e grants | Residem no banco e devem ser restaurados com o schema. |
| Controle de revisão | `revision`, `updated_at` e RPC atômica independem do Cloud. |
| Persistência local | Não depende do provedor remoto. |
| Testes locais e SQL | Podem validar o novo ambiente com outra URL. |

### PRECISA DE ADAPTAÇÃO

| Componente | Adaptação necessária |
|---|---|
| Configuração pública | Gerar URL/chave/site por ambiente em vez de copiar valores fixos. |
| CSP do Tauri | Permitir somente os endpoints configurados de cada build, incluindo WSS. |
| Testes remotos | Receber configuração do ambiente em vez de importar apenas o projeto Cloud. |
| Auth | Configurar `SITE_URL`, redirects, SMTP e política de confirmação. |
| Contas existentes | Migrar `auth.*`; decidir reautenticação ou continuidade de JWT com segurança. |
| Cloudflare Tunnel | Encaminhar gateway HTTPS/WebSocket sem expor PostgreSQL. |
| Offline multi-backend | Separar sessão, vínculo e filas por identidade do backend. |
| Backups do servidor | Criar dump verificado, retenção e restauração testada. |
| Operação Windows | Instalar Docker Desktop/Compose e tratar CRLF, volumes e reinicialização. |
| Health check/logs | Verificar cada serviço sem registrar secrets/tokens. |

### DEPENDENTE DO SUPABASE CLOUD

| Componente | Situação |
|---|---|
| Projeto `nuczqjyahusjyvepqthx` | Backend ativo atual durante a transição. |
| Configurações feitas no Dashboard | Precisam ser inventariadas e convertidas em variáveis self-hosted. |
| Operação gerenciada | Backups, disponibilidade e manutenção atuais são responsabilidade da plataforma. |

O site `ficha-marufia-latio.italocas7.chatgpt.site` e seu Worker são dependências da distribuição web/atualização, não requisitos técnicos do banco self-hosted. Eles podem continuar operando enquanto o backend muda.

### NÃO UTILIZADA

- Supabase Storage e buckets;
- Edge Functions;
- OAuth/social login;
- recuperação de senha;
- MFA, telefone e SSO;
- views e enums próprios;
- acesso direto do cliente ao PostgreSQL;
- `service_role` no frontend;
- backend Node próprio para regras do RPG.

## 16. Componentes que devem ser reutilizados

1. Todas as migrations existentes, na ordem histórica.
2. Policies RLS, grants por coluna e funções `security definer`.
3. O cliente oficial Supabase e os módulos em `src/online/`.
4. O documento JSONB schema v5 sem alterar regras da ficha.
5. Fila offline de personagens e rolagens.
6. Revisão atômica, origem e diálogo de conflito.
7. Backups locais e envelope online v1.
8. Canais Realtime e remoção explícita de subscriptions.
9. Suítes local, E2E, remota e ofensiva de RLS.
10. Supabase Cloud como ambiente de fallback durante todo o desenvolvimento.

## 17. Componentes que precisarão ser criados ou adaptados

1. Geração de configuração pública por ambiente.
2. Instalação self-hosted oficial versionada e endurecida.
3. Scripts PowerShell de início, parada, reinício, saúde, backup e restore.
4. Cloudflare Tunnel e configuração de domínio opcional.
5. Exportação/restauração separada de roles, schema e dados.
6. Migração controlada de Auth e configuração SMTP.
7. Isolamento de volumes PostgreSQL e Storage, mesmo que Storage ainda esteja vazio.
8. Retenção de backups e teste de restauração em banco descartável.
9. Logs rotativos e sanitizados.
10. Ferramenta simples de administração do servidor.

Por existir `server/index.js` como Worker de hospedagem, a nova infraestrutura deve usar inicialmente o diretório `marufia-server/`. Isso evita renomear o Worker e reduz risco de quebrar o build/site atual.

## 18. Riscos da migração

| Prioridade | Risco | Mitigação obrigatória |
|---|---|---|
| Alta | Perda ou restore incompleto de dados/Auth | Backup Cloud, dumps separados, checksums, restore em banco de teste e comparação. |
| Alta | RLS diferente após restore | Aplicar migrations, executar 35 testes ofensivos e validar usuários reais isolados. |
| Alta | PC do Mestre desligado ou sem internet | Manter Cloud até o corte, filas offline, mensagens claras e procedimento de recuperação. |
| Alta | JWT/sessões incompatíveis | Migrar contas sem recriação e exigir novo login se o segredo mudar. |
| Alta | Segredos expostos no frontend/repositório | `.env` ignorado, apenas chave pública no cliente e revisão automática do build. |
| Alta | PostgreSQL publicado na internet | Tunnel aponta somente para o gateway; firewall e Compose não publicam 5432 externamente. |
| Média | Diferença de versões PostgreSQL/Auth/Storage | Fixar snapshot self-hosted, testar dump/restore e inventariar extensões. |
| Média | WebSocket/Reatime falhar pelo Tunnel | Health check WSS e teste real com dois computadores. |
| Média | SMTP ausente bloquear cadastro/confirmação | Configurar provedor SMTP antes de validar Auth. |
| Média | Mistura de IDs/filas entre Cloud e self-hosted | Incluir identidade do backend nas chaves locais antes de permitir alternância. |
| Média | Documentação divergir do banco | Gerar evidências por comandos e atualizar a auditoria a cada fase. |
| Média | Atualização de containers quebrar compatibilidade | Versões fixas, backup prévio, health check e rollback. |
| Baixa atual | Migração de Storage/Functions | Não usados; manter inventário para futura adoção. |

O `503/PGRST002` observado na Data API Cloud é um risco operacional atual. Deve ser reavaliado antes da Fase 1 e não deve ser confundido com falha das migrations: a conexão direta usada para listar migrations funcionou.

## 19. Prontidão da máquina do Mestre

Em 30/08/2026:

- Windows e PowerShell estão disponíveis;
- Git está disponível;
- havia aproximadamente 352,9 GB livres na unidade do projeto;
- Docker e Docker Compose não estavam no `PATH`;
- `cloudflared` não estava no `PATH`;
- `psql` não estava no `PATH`;
- RAM, CPU e virtualização não puderam ser consultadas com a permissão da auditoria.

A documentação oficial atual recomenda no mínimo 4 GB de RAM, 2 núcleos e 40 GB SSD para a pilha completa, com 8 GB+, 4 núcleos+ e 80 GB+ preferíveis. Esses requisitos deverão ser confirmados fisicamente antes da Fase 3.

O diretório `supabase/` atual é uma configuração da Supabase CLI para desenvolvimento/testes. A documentação oficial alerta que essa pilha local não é uma implantação self-hosted endurecida e não deve ser exposta à internet. O Marufia Server usará o Compose oficial self-hosted, não `supabase start` como servidor de produção.

## 20. Estratégia segura de migração

Durante todo o desenvolvimento:

```text
SUPABASE CLOUD ATUAL
├── permanece ativo
└── continua sendo o backend padrão estável

MARUFIA SERVER
├── ambiente experimental separado
├── recebe schema antes de dados
├── usa contas/dados de teste primeiro
└── só vira produção após todos os critérios
```

A futura migração será separada em:

1. backup anterior do Cloud;
2. exportação de roles;
3. exportação de schema;
4. exportação de dados;
5. restauração transacional em instância de teste;
6. validação de objetos, contagens, Auth, RLS e Realtime;
7. ensaio de rollback;
8. janela de corte somente após aprovação.

O procedimento oficial informa que schema, dados, roles, policies RLS, funções, gatilhos e `auth.users` podem fazer parte da restauração. JWT/API keys, SMTP, Auth providers, Storage objects, Edge Functions, DNS e domínios exigem configuração separada.

## 21. Plano de implementação atualizado

### Fase 1 — Desacoplar o endereço do Supabase

- Gerar configuração pública por ambiente durante o build.
- Suportar Cloud, desenvolvimento local e produção self-hosted.
- Adaptar CSP/Tauri e testes sem aceitar hosts arbitrários em runtime.
- Manter somente URL, `siteUrl` e publishable key no cliente.
- Preservar o Cloud como padrão até outra configuração ser explicitamente escolhida.

### Fases 2 e 3 — Marufia Server e Supabase Self-Hosted

- Criar `marufia-server/` sem alterar o Worker em `server/`.
- Partir do snapshot oficial self-hosted e fixar versão do conjunto, não imagens `latest` independentes.
- Configurar volumes persistentes, secrets locais e health checks.
- Criar scripts PowerShell seguros para Windows.
- Não publicar a pilha da CLI como produção.

### Fase 4 — Migração do banco

- Aplicar primeiro as 26 migrations em banco experimental vazio.
- Comparar catálogo e RLS com o Cloud.
- Produzir dumps separados de roles, schema e dados.
- Restaurar dados somente após backup e teste de schema.
- Documentar rollback antes do primeiro dado real.

### Fase 5 — Autenticação

- Configurar email/senha, SMTP, site e redirects.
- Migrar `auth.users` preservando hashes.
- Testar cadastro, confirmação, login, sessão, refresh, resend e logout.
- Documentar que troca de JWT pode exigir novo login.

### Fase 6 — RLS

- Reexecutar testes estruturais e os 35 ataques transacionais.
- Testar Jogador A, Jogador B, `gm` e usuário anônimo.
- Conferir grants por coluna e privilégios das funções.

### Fase 7 — Realtime

- Confirmar as seis tabelas na publicação.
- Testar PV, PM, ficha, rolagens, presença, histórico e sessões.
- Verificar filtros, reconexão, canais duplicados e limpeza de subscriptions.

### Fases 8 e 9 — Tunnel e domínio

- Publicar somente o gateway HTTP/HTTPS do Supabase.
- Encaminhar WebSocket do Realtime.
- Manter PostgreSQL e Studio privados por padrão; acesso ao Studio será local ou explicitamente protegido.
- Tornar domínio configurável, sem exigir `api.marufia.com`.

### Fase 10 — Offline e conflitos

- Reutilizar as filas existentes em vez de criar outro sistema paralelo.
- Separar chaves de sessão/sync por backend.
- Melhorar detecção de indisponibilidade e mensagens ao usuário.
- Preservar `revision`, `updated_at` e escolha explícita de conflito.

### Fase 11 — Backup e restauração

- Criar dump PostgreSQL com verificação de código de saída e arquivo válido.
- Definir retenção diária/semanal sem apagar o último backup válido.
- Fazer restore em banco de teste e comparar tabelas/contagens.
- Incluir volumes/configuração necessários para transferência futura.

### Fase 12 — Administração

- Criar health check de Database, Auth, REST, Realtime, Storage e Tunnel.
- Adicionar logs sanitizados e rotação.
- Criar comandos de iniciar/parar/reiniciar/backup/Studio.
- Oferecer inicialização automática como opção, nunca obrigação.

### Fase 13 — Validação e corte

- Testar Mestre/servidor em um computador e jogador em outro pela internet.
- Simular vários jogadores e quedas/reconexões.
- Reiniciar o computador e confirmar persistência.
- Validar backup e restore novamente.
- Trocar o backend padrão somente após todos os critérios de conclusão.

## 22. Critérios para iniciar a Fase 1

A Fase 1 pode começar sem alterar regras do RPG porque a mudança será apenas de configuração. Ela deverá manter:

- os mesmos IDs e nomes de campos;
- o mesmo schema v5;
- as mesmas RPCs;
- as mesmas policies;
- o mesmo comportamento local/offline;
- o Cloud atual disponível como fallback.

Nenhuma infraestrutura foi criada nesta auditoria. Nenhum dado, usuário, policy, migration ou configuração remota foi alterado.

## 23. Testes e evidências da Fase 0

Resultados observados em 30/08/2026:

| Verificação | Resultado |
|---|---|
| Estado inicial do Git | Limpo em `main`, alinhado com `origin/main`. |
| Suíte Python | 12 testes aprovados. |
| Suíte JavaScript | 354 testes aprovados, 0 falhas. |
| Smoke test navegador | Desktop e celular aprovados. |
| Histórico remoto de migrations | 26/26 versões locais e remotas correspondentes. |
| Realtime remoto | Canal de `rolls` conectado com a chave pública. |
| Auth público | `HTTP 200`. |
| REST/PostgREST público | `HTTP 503/PGRST002`; o cache de schema não ficou disponível nas duas sondas. |
| Suíte remota de RLS | 35/35 ataques transacionais aprovados, com rollback. |

O erro remoto não provocou escrita. O teste Realtime abriu e removeu um canal; o histórico de migrations fez consulta somente de leitura. A suíte RLS é transacional e termina em rollback.

## 24. Conclusão da auditoria

A arquitetura atual é adequada para migração incremental ao Supabase Self-Hosted. A maior parte do domínio online já está corretamente concentrada no PostgreSQL e no cliente Supabase padrão. Os principais trabalhos não são reescrever a ficha, mas operacionalizar o mesmo contrato com:

- configuração por ambiente;
- infraestrutura self-hosted versionada;
- migração segura de banco e Auth;
- Tunnel HTTPS/WSS;
- backups/restauração;
- observabilidade e administração no Windows.

A integridade dos dados depende de manter a ordem: configuração, ambiente experimental, schema, Auth/RLS/Realtime, Tunnel, dados, backup/restore e somente então corte. O Supabase Cloud não deve ser desligado durante essas etapas.
