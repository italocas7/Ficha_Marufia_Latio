# Banco do Marufia Online — Fases 6 a 34

A primeira migration cria somente as seis tabelas necessárias para a fundação online:

```text
auth.users
├── profiles
├── campaigns (owner_id)
├── campaign_members (user_id)
├── characters (owner_id)
├── rolls (user_id)
└── campaign_events (actor_id)

campaigns
├── campaign_members
├── characters (vínculo opcional)
├── rolls
├── campaign_events
└── campaign_sessions

campaign_sessions
└── campaign_events (session_id opcional)
```

## Decisões de compatibilidade

- Identificadores são UUIDs.
- `characters.state` guarda a ficha completa em JSONB e mantém `schema_version` separado para consultas e migrações.
- A constraint de personagem exige que `state.schemaVersion` corresponda a `schema_version`.
- `characters.campaign_id` pode ser nulo, permitindo preservar personagens fora de campanhas sem criar outra tabela.
- `campaign_members.role` pertence à campanha e aceita `gm`, `player`, `assistant_gm` e `spectator`; não existe papel global no usuário.
- Rolagens mantêm campos opcionais para não inventar modificadores ou resultados que não existam nas regras atuais.

## Segurança inicial

Todas as tabelas públicas têm Row Level Security habilitado. A Fase 6 não concede acesso a `anon` nem a `authenticated` e não cria policies permissivas. Portanto, a API pública permanece bloqueada por padrão.

As fases funcionais seguintes adicionarão grants e policies pequenas conforme cada recurso for implementado. Nenhuma chave secreta é necessária no aplicativo.

## Profiles — Fase 7

Um gatilho em `auth.users` cria automaticamente `public.profiles` após o cadastro. `display_name` e `avatar_url` são copiados como conteúdo opcional e limitados ao tamanho aceito pelo banco; metadata nunca é usada para decidir permissões.

Usuários autenticados podem:

- selecionar somente o próprio perfil;
- atualizar somente `display_name` e `avatar_url` do próprio perfil.

O cliente não recebe permissão para criar ou apagar perfis, trocar o `id`, alterar timestamps ou consultar perfis alheios. A remoção da conta continua sendo responsável pela exclusão em cascata do perfil.

## Campanhas — Fase 9

Na criação, o navegador envia apenas `name` e `description`; um gatilho do banco substitui qualquer identidade externa pelo usuário autenticado e gera o `join_code`. Desde a Fase 11, usuários autenticados podem consultar as campanhas nas quais possuem um vínculo.

O código contém 30 bits de aleatoriedade no formato `MRF-XXXX-XX`, usa um alfabeto sem caracteres visualmente ambíguos e continua protegido por unicidade. Ele identifica o convite, mas não concede privilégios de Mæstre. Edição e exclusão permanecem bloqueadas; a entrada usa uma operação específica do servidor.

## Participantes — Fase 10

Um gatilho privado cria o vínculo `(campaign_id, owner_id, gm)` após cada campanha. A migration também preenche esse vínculo para campanhas anteriores. Usuários autenticados recebem apenas leitura: cada pessoa vê o próprio vínculo e o proprietário vê os participantes das campanhas que administra.

Nenhuma permissão de inserção, edição ou exclusão é entregue ao navegador. Assim, o usuário não consegue trocar o próprio papel nem se transformar em Mæstre. Os papéis continuam armazenados por campanha.

## Autorização por papel — Fase 11

`private.campaign_role(campaign_id)` resolve o papel do usuário autenticado a partir de `campaign_members`. A função fica fora do schema exposto e é usada pelas policies para evitar dependência circular entre campanhas e participantes.

Campanhas são selecionáveis por membros vinculados. A leitura completa dos participantes exige `gm`; cada membro continua podendo ler a própria linha. Não existe `user.role`, papel em `profiles` ou autorização baseada em metadata editável.

## Entrada por convite — Fase 12

`public.join_campaign(code)` valida o formato como usuário autenticado e delega a busca do código a `private.join_campaign_by_code(code)`. A função privada usa `security definer`, `search_path` vazio e referências de schema explícitas; somente o invólucro público faz parte da API.

Campanhas existentes aceitam seu convite na regra atual. A primeira entrada insere apenas `(campaign_id, auth.uid(), player)`. Repetir a operação preserva e devolve o papel existente, inclusive `gm`, sem executar `update`. Nenhum `grant` de inserção, edição ou exclusão em `campaign_members` é entregue ao navegador.

## Personagens — Fase 13

`characters.state` continua sendo o documento integral da ficha em JSONB. A validação do banco acompanha o contrato real do aplicativo: `state.meta.appId` identifica `marufia-latio` e `state.meta.schemaVersion` deve coincidir com `schema_version`.

A relação com campanha permanece opcional e nenhuma permissão de leitura ou escrita foi aberta nesta fase. Importação local, associação e salvamento remoto continuam separados nas fases seguintes.

## Personagens independentes — Fase 14

Novos personagens são criados com `campaign_id = null`. Um gatilho privado define `owner_id` pela sessão e deriva `name` e `schema_version` do JSONB, portanto esses metadados não ficam sob controle independente do navegador.

O proprietário pode listar as próprias linhas, criar um registro pelo estado e alterar apenas `campaign_id`. O vínculo é aceito somente se existir uma participação correspondente em `campaign_members`; remover o vínculo volta o personagem para a conta. Exclusão e atualização remota do estado continuam fechadas.

## Migração local — Fase 15

A ficha iniciada no navegador pode gerar uma única cópia inicial em `characters`. Antes da criação, o aplicativo salva o JSON local original nos backups existentes. A linha nasce sem campanha e o arquivo local permanece intacto.

Nenhuma permissão nova de banco foi necessária: a importação usa a criação independente autorizada na Fase 14. Atualizações contínuas de `state` continuam bloqueadas até a Fase 16.

## Salvamento remoto — Fase 16

O proprietário autenticado recebe permissão de atualização somente para `characters.state`. As policies existentes continuam limitando a linha ao próprio `owner_id`; o navegador não recebe permissão para alterar `owner_id`, `name`, `schema_version`, timestamps ou excluir personagens.

O mesmo gatilho protegido da Fase 14 valida o documento e deriva nome e versão no servidor. A coluna `campaign_id` mantém a permissão independente usada exclusivamente para associação a campanhas. Usuários anônimos continuam sem acesso.

## Debounce remoto — Fase 17

O debounce é inteiramente do cliente e não altera o schema ou as permissões. O Supabase recebe somente a versão estabilizada após 1 segundo sem mudanças, ou a versão pendente quando a página fica oculta ou é abandonada.

## Status de sincronização — Fase 18

Os estados `Online`, `Sincronizando`, `Offline` e `Erro de sincronização` pertencem somente à interface do cliente. Nenhuma coluna, policy, função ou permissão foi adicionada ao banco nesta fase.

## Realtime — Fase 19

Somente `public.characters` foi adicionada à publicação `supabase_realtime`. A alteração é protegida por consulta ao catálogo, podendo ser reaplicada sem tentar publicar a mesma tabela duas vezes. Não foi habilitado `replica identity full`, pois esta fase consome apenas o novo documento de eventos `UPDATE`.

A policy `characters_select_campaign_gm` permite selecionar um personagem vinculado somente quando `private.campaign_role(campaign_id)` retorna `gm`. Ela complementa a leitura do proprietário e não concede `insert`, `update` ou `delete` ao Mæstre. Usuários anônimos permanecem sem acesso. Essa leitura é necessária para que o Realtime respeite a mesma autorização por linha usada pela API.

## Controle de concorrência — Fase 20

`characters.revision` começa em 1 e é incrementada por gatilho a cada alteração. `last_change_origin` registra `player`, `gm` ou `system`; ambos são definidos pelo banco, sem permissão direta de escrita para o navegador. `updated_at` continua usando o relógio do servidor.

`public.save_character_state(character_id, state, expected_revision)` verifica autenticação, propriedade e revisão dentro da mesma transação. Uma revisão desatualizada gera o erro PostgreSQL `40001` sem alterar a linha. A atualização direta de `state` foi revogada; somente a função protegida pode executar esse fluxo. Associação por `campaign_id` permanece independente e também avança a revisão.

A função não concede escrita ao Mæstre e não aceita uma origem fornecida pelo cliente. As permissões granulares de Mæstre continuam reservadas à Fase 29.

## Operação offline — Fase 21

Nenhuma tabela, função, policy ou permissão nova foi necessária. A fila offline pertence ao navegador e mantém somente a versão mais recente por conta e personagem. Quando a conexão volta, ela utiliza a mesma `save_character_state` da Fase 20, portanto propriedade, revisão, validação JSONB e RLS continuam sendo verificadas pelo banco.

## Registro de rolagens — Fase 23

A tabela `public.rolls` criada na fundação já contém todos os campos necessários e não foi remodelada. Ela continua sem concessão direta de `select`, `insert`, `update` ou `delete` aos papéis do navegador.

`public.record_roll` é a única entrada autenticada desta fase. A função deriva `user_id` de `auth.uid()`, encontra `campaign_id` no personagem pertencente ao usuário e exige o vínculo correspondente em `campaign_members`. Identidade, campanha e visibilidade nunca são parâmetros do cliente; `visibility` permanece fixada pelo servidor como `public` até a Fase 25.

O UUID do evento permite repetição idempotente, e o servidor recusa fórmulas, faixas, seleções e totais que não correspondam às rolagens atuais da ficha. A Fase 23 não libera leitura nem adiciona `rolls` ao Realtime; essas capacidades pertencem às fases seguintes.

## Rolagens ao vivo — Fase 24

`public.rolls` foi adicionada de forma idempotente à publicação `supabase_realtime`, somente para eventos novos consumidos pelo painel. Não foi habilitado `replica identity full` e nenhuma permissão de alteração direta foi concedida ao navegador.

Usuários autenticados podem selecionar as colunas necessárias, mas a policy exige simultaneamente `visibility = 'public'` e o papel exato `gm` resolvido por `private.campaign_role(campaign_id)`. Assim, o Mæstre recebe apenas rolagens públicas da própria campanha, enquanto jogadores, outras campanhas e usuários anônimos continuam bloqueados. A autorização de `gm` e `secret` fica explicitamente reservada à Fase 25.

## Visibilidade das rolagens — Fase 25

A policy da Fase 24 foi substituída por uma decisão por linha e campanha:

- `public` exige qualquer vínculo existente na campanha;
- `secret` exige que o usuário seja o autor ou possua o papel exato `gm` naquela campanha;
- `gm` exige simultaneamente que o usuário seja o autor e o `gm` daquela campanha.

A nova versão de `record_roll` aceita somente os pedidos `public` e `secret`. O papel do autor é consultado no servidor; quando ele é `gm`, a visibilidade armazenada sempre se torna `gm`. A função devolve UUID e visibilidade efetiva, sem aceitar identidade, campanha, papel ou nome de personagem como autoridade do cliente.

`rolls.character_name` mantém o nome validado no instante da rolagem. Isso permite mostrar o personagem aos participantes autorizados sem ampliar a policy de `characters`, que continuaria expondo o JSON integral da ficha caso fosse aberta para todos. Registros existentes são preenchidos e antigas rolagens públicas de Mæstres são tornadas privadas durante a migration.

## Fronteira de geração — Fase 26

Nenhuma alteração de banco foi necessária. O cliente continua gerando localmente, e `record_roll` mantém todas as validações de fórmula, quantidade, faixa e total das fases anteriores. A nova interface versionada do cliente permite trocar futuramente o provedor local por uma operação assíncrona no backend sem mudar o contrato do resultado usado pela ficha.

## Painel e presença — Fase 27

`campaign_presence` guarda somente `(campaign_id, user_id, seen_at)` e referencia a chave composta de `campaign_members`. A função protegida `touch_campaign_presence(campaign_id)` deriva o usuário autenticado, exige sua participação e usa o relógio do servidor; o navegador não pode escolher outra identidade ou horário.

Somente o papel exato `gm` pode selecionar a presença da campanha. Não existem grants diretos de inserção, atualização ou exclusão. A tabela participa do Realtime para atualizar o contador do painel, e registros com mais de 90 segundos não são considerados online.

O Mæstre já podia selecionar personagens vinculados pela policy da Fase 19. O painel reutiliza essa leitura somente para um resumo de nome, PV, PM e atualização. Nenhuma escrita de Mæstre foi adicionada, e a abertura da ficha completa continua reservada à Fase 28.

## Visualização completa — Fase 28

Nenhuma alteração de banco foi necessária. O visualizador reutiliza a ficha schema v5 recebida da leitura de `characters` já autorizada ao `gm` da campanha e opera somente em memória, sem salvar.

## Alteração granular e sincronização — Fases 29 e 30

As operações expostas ao Mæstre são limitadas a PV atual, PM atual, adição/remoção de condições temporárias e adição/remoção de armas ou equipamentos. Todas exigem papel exato `gm` na campanha e comparação atômica de revisão. A origem `gm` somente é aceita pelo gatilho quando esse mesmo papel é confirmado no servidor. Nenhum `grant update` sobre `characters.state` foi entregue ao Mæstre.

Os valores são validados por operação. Condições são gravadas somente em `effects`; itens somente em `inventory.weapons` ou `inventory.equipment`. IDs de novas entradas vêm do servidor e remover a arma selecionada limpa apenas `selectedWeaponId`. Atributos, regras, máximos, magias e os demais campos permanecem fora dessa permissão.

O Realtime de `characters` já existente transmite a nova revisão ao proprietário. A aplicação automática ocorre apenas quando o conteúdo local ainda corresponde à revisão conhecida; alterações concorrentes continuam no fluxo explícito de conflito.

## Presença em três estados — Fase 31

`campaign_presence.active_at` separa atividade de conexão. `touch_campaign_presence(campaign_id, active)` sempre atualiza `seen_at` com o relógio do servidor e só avança `active_at` quando a sessão está ativa. O heartbeat permanece em 30 segundos e a leitura continua exclusiva do `gm`.

## Histórico seletivo — Fase 32

`campaign_events` passa a receber eventos por gatilhos privados de `characters` e `rolls`. Somente mudanças de PV, PM, condições, armas/equipamentos e rolagens são registradas; o documento integral da ficha não é copiado para o payload.

O `gm` pode selecionar eventos da própria campanha. Eventos de rolagem com visibilidade `gm` exigem também que `actor_id = auth.uid()`, preservando a privacidade entre Mæstres. A tabela participa do Realtime somente para novos eventos, sem grants diretos de escrita.

## Sessões de campanha — Fase 33

`campaign_sessions` registra `id`, campanha, nome, início, fim e estado. Um índice parcial único impede mais de uma sessão `active` na mesma campanha. Somente o papel exato `gm` pode ler a tabela ou chamar `start_campaign_session` e `end_campaign_session`; os horários e estados são definidos no servidor.

`campaign_events.session_id` é opcional para preservar eventos anteriores e atividades fora de sessão. Um gatilho privado substitui esse valor em toda inserção pelo identificador da sessão ativa da mesma campanha. Assim, o navegador não decide a associação. As mudanças de ciclo da sessão participam do Realtime, sem concessão direta de inserção, atualização ou exclusão.

## Row Level Security consolidado — Fase 35

As oito tabelas públicas permanecem com RLS habilitado. A migração de endurecimento falha sem alterar o banco se uma tabela ou policy definitiva estiver ausente. Depois remove todo acesso de `public`/`anon` e somente as escritas diretas que nunca fizeram parte do aplicativo, preservando a matriz legítima por coluna:

- perfil: leitura própria e alteração somente de nome/avatar;
- campanha: leitura por vínculo e criação com proprietário definido pelo servidor;
- participantes: leitura do próprio vínculo ou, para o papel exato `gm`, dos vínculos da campanha;
- personagens: proprietário lê a própria ficha; `gm` lê apenas fichas vinculadas à campanha administrada;
- rolagens: leitura conforme `public`, `secret` e `gm` já definidos;
- presença, histórico e sessões: leitura somente pelo `gm` da campanha.

Não existe escrita direta em participantes, rolagens, eventos, presença ou sessões. Salvamento de estado, entrada por convite, rolagens e ações do Mæstre continuam passando por funções separadas, autenticadas e validadas no servidor. Nenhuma policy reconhece `assistant_gm` ou `spectator` como `gm`.

## Testes ofensivos — Fase 36

A suíte remota cria, dentro de uma transação revertida, três identidades isoladas: um `gm`, o Jogador A e o Jogador B. Ela tenta ler campanhas e personagens externos, salvar ficha alheia, trocar `role`, criar vínculo `gm`, transferir proprietário, associar ficha a campanha externa, iniciar sessão e chamar RPCs de Mæstre com UUIDs conhecidos.

O primeiro ciclo encontrou uma regressão legítima: `private.prepare_character_write()` bloqueava também as RPCs de Mæstre já autorizadas. A correção aceita a atualização somente quando a origem interna é `gm`, o usuário possui papel exato `gm` na campanha já vinculada e `campaign_id` não muda. A RLS continua impedindo atualização direta e o proprietário nunca é transferido.

## Histórico

- `20260820030000_create_marufia_online_foundation.sql`: cria tabelas, constraints, índices, gatilhos de `updated_at` e a fronteira inicial de RLS.
- `20260820040000_create_profile_lifecycle.sql`: associa automaticamente perfis a usuários e adiciona as policies mínimas da Fase 7.
- `20260820050000_create_campaign_lifecycle.sql`: gera proprietário e convite no banco e libera somente criação e leitura das campanhas próprias.
- `20260820060000_create_campaign_membership_lifecycle.sql`: registra proprietários como `gm`, preenche campanhas anteriores e libera somente leitura autorizada de participantes.
- `20260820070000_create_campaign_role_authorization.sql`: centraliza a consulta de papel por campanha e aplica essa relação às policies de leitura.
- `20260820080000_create_campaign_join_by_code.sql`: adiciona entrada autenticada por convite, sempre como `player`, preservando vínculos anteriores.
- `20260820081000_fix_campaign_join_conflict_target.sql`: torna explícita a chave primária usada quando duas entradas coincidem.
- `20260820090000_align_character_state_contract.sql`: alinha a constraint JSONB ao caminho real `meta.schemaVersion` da ficha.
- `20260820100000_create_character_lifecycle.sql`: cria o ciclo seguro de personagens independentes e sua associação a campanhas.
- `20260820110000_enable_character_remote_saves.sql`: libera ao proprietário autenticado somente a atualização do documento integral da própria ficha.
- `20260820120000_enable_character_realtime.sql`: publica somente personagens e permite ao Mæstre ler atualizações das fichas vinculadas à sua campanha.
- `20260820130000_enable_character_conflict_control.sql`: adiciona revisão e origem controladas pelo banco e troca a gravação direta por comparação atômica de revisão.
- `20260820140000_enable_roll_registration.sql`: registra rolagens por função protegida, com identidade derivada, validação dos dados atuais e visibilidade pública controlada no servidor.
- `20260820150000_enable_roll_realtime.sql`: publica novas rolagens no Realtime e libera leitura somente das linhas públicas ao Mæstre da campanha correspondente.
- `20260820160000_enable_roll_visibility.sql`: aplica as regras definitivas `public`, `secret` e `gm`, protege as rolagens do Mæstre e registra o nome seguro do personagem.
- `20260820170000_create_campaign_presence.sql`: cria o batimento autenticado de participantes, com leitura e Realtime limitados ao Mæstre da campanha.
- `20260820180000_enable_gm_hp_updates.sql`: libera somente PV atual ao Mæstre da campanha, com revisão concorrente e origem verificada no servidor.
- `20260820190000_expand_campaign_presence_status.sql`: separa heartbeat e atividade para derivar online, ausente e offline.
- `20260820200000_enable_campaign_history.sql`: registra e publica somente eventos relevantes, preservando rolagens privadas do Mæstre.
- `20260820201000_fix_gm_hp_null_role.sql`: torna explícita a recusa de vínculo ausente na operação de PV do Mæstre.
- `20260820210000_create_campaign_sessions.sql`: cria sessões exclusivas do Mæstre e vincula automaticamente os eventos relevantes à sessão ativa.
- `20260820220000_expand_gm_character_actions.sql`: ativa as cinco ações adicionais aprovadas de PM, condições e itens sem abrir atualização direta da ficha.
- `20260820230000_harden_row_level_security.sql`: verifica as policies definitivas e remove acessos perigosos sem reescrever policies ou grants legítimos.
- `20260820231000_allow_authorized_gm_character_writes.sql`: permite que somente as RPCs granulares aprovadas atravessem o gatilho de proprietário após confirmar origem, papel e campanha.

A migration foi aplicada ao projeto `nuczqjyahusjyvepqthx` pela ferramenta oficial e consta no histórico remoto. `pnpm test:database:remote` confirma, usando somente a chave pública, que as tabelas públicas existem e permanecem bloqueadas.
