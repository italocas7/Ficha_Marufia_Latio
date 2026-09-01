# Marufia Server — Fase 6: Row Level Security

## Resultado

As regras RLS do Marufia foram validadas no PostgreSQL self-hosted tanto dentro
do banco quanto pela API REST usada pelo aplicativo. Nenhuma falha de isolamento
foi encontrada e, por isso, nenhuma policy, migration ou regra do RPG foi
alterada.

O teste ponta a ponta usa três contas locais descartáveis:

- Mestre da Campanha A;
- Jogador A, participante da Campanha A;
- usuário externo, proprietário da Campanha B.

As contas e todos os dados relacionados são removidos por cascade ao final. O
teste só aceita `localhost`/`127.0.0.1`, exige confirmação automática local e se
recusa a iniciar se o banco experimental não estiver vazio.

## Camadas de autorização

O acesso do cliente passa por três controles acumulativos:

```text
grant da operação/coluna
          |
          v
policy RLS da linha
          |
          v
validação interna da RPC, quando houver escrita privilegiada
```

Uma policy não concede sozinha o direito de executar uma operação. O papel
também precisa do grant adequado. Essa separação permite, por exemplo, que o
Mestre leia personagens da própria campanha sem receber `UPDATE` direto sobre a
ficha.

## Inventário confirmado

As oito tabelas públicas estão com RLS habilitado e possuem 13 policies:

| Tabela | Policies | Regra principal |
|---|---|---|
| `profiles` | `profiles_select_own`, `profiles_update_own` | cada conta acessa somente o próprio perfil |
| `campaigns` | `campaigns_select_member`, `campaigns_insert_owned` | somente membros veem; criador vira proprietário |
| `campaign_members` | `campaign_members_select_by_campaign_role` | jogador vê a si; Mestre vê membros da própria campanha |
| `characters` | duas de leitura, uma de criação e uma de atualização | proprietário controla a ficha; Mestre somente lê personagens vinculados |
| `rolls` | `rolls_select_by_campaign_visibility` | visibilidade pública, secreta e do Mestre aplicada no banco |
| `campaign_events` | `campaign_events_select_campaign_gm` | histórico disponível somente ao Mestre da campanha |
| `campaign_presence` | `campaign_presence_select_campaign_gm` | presença disponível somente ao Mestre da campanha |
| `campaign_sessions` | `campaign_sessions_select_campaign_gm` | sessões disponíveis somente ao Mestre da campanha |

O papel `anon` não possui grants nas tabelas públicas. `authenticated` não tem
`BYPASSRLS`; suas permissões por coluna continuam mínimas. `service_role` possui
o bypass administrativo esperado do Supabase e deve permanecer exclusivamente
no servidor, nunca no cliente ou nos logs.

## Cenários pela API

O novo `test-rls.ps1` confirmou:

| Tentativa | Resultado |
|---|---|
| usuário sem login consulta qualquer uma das oito tabelas | negado |
| usuário sem login chama `join_campaign` | negado |
| Mestre consulta perfil de outro usuário | zero linhas |
| Jogador A consulta Campanha B | zero linhas |
| Jogador A consulta personagem da Campanha B | zero linhas |
| usuário externo consulta Campanha/Personagem A | zero linhas |
| Jogador A altera o próprio papel para `gm` | negado |
| Jogador A cria vínculo administrativo diretamente | negado |
| Jogador A salva personagem externo por UUID conhecido | negado |
| Jogador A chama operação granular do Mestre | negado |
| Mestre A altera personagem da Campanha B | negado |
| Mestre A escreve diretamente na ficha do Jogador A | zero linhas alteradas |
| Mestre A altera PV pela RPC da própria campanha | permitido |
| proprietário salva sua própria ficha pela RPC | permitido |
| Jogador A inicia sessão da campanha | negado |
| Mestre A inicia sessão da própria campanha | permitido |
| usuário externo vê rolagem, histórico, presença ou sessão da Campanha A | zero linhas |

Também foram confirmados os controles de revisão e origem: a alteração granular
do Mestre gerou `last_change_origin=gm`, e o salvamento posterior do proprietário
gerou `last_change_origin=player` sem aceitar metadados de autoridade do cliente.

## Testes SQL complementares

A suíte `supabase/tests/rls_security.test.sql` executa 35 ataques em uma
transação com rollback. Ela cobre UUIDs conhecidos, conflito de revisão,
elevação de papel, associação de campanha, rolagens, histórico, presença,
sessões e todas as operações granulares do Mestre.

Os 35 cenários passaram no banco local e no Supabase Cloud. A suíte remota não
persistiu contas ou dados. O histórico remoto continua alinhado às 26 migrations
locais.

## Testes executados

| Verificação | Resultado |
|---|---|
| RLS ponta a ponta pela API, três identidades | OK |
| oito tabelas sem acesso anônimo | OK |
| 13 policies e grants mínimos | OK |
| 35 ataques SQL locais com rollback | OK |
| 35 ataques SQL remotos com rollback | OK |
| banco local vazio após cada teste | OK |
| 12 testes Python | OK |
| 379 testes JavaScript | OK |
| smoke test desktop e celular | OK |
| Auth Cloud | HTTP 200 |
| Realtime Cloud | conectado |

A Data API Cloud continua retornando `503/PGRST002`, condição preexistente desde
a Fase 0. A conexão direta usada pelos testes SQL e o Realtime continuam
funcionais; o problema não foi causado por esta fase.

## Arquivos e impacto

Esta fase adiciona somente teste, documentação e comandos de execução. Não
altera `app.js`, `data.js`, migrations, banco, interface, site publicado ou o
Worker existente em `server/`.

Como o site permaneceu intacto, não houve nova publicação pelo serviço Sites.
O smoke test confirma que abas, campos, persistência local e fluxos online
continuam funcionando em desktop e celular.

## Riscos remanescentes

- qualquer nova tabela no schema exposto precisa nascer com RLS e grants
  explícitos na mesma migration;
- policies permissivas se combinam por `OR`, portanto uma nova policy ampla pode
  abrir linhas mesmo sem remover as atuais;
- funções `security definer` exigem `search_path` restrito, revogação de `PUBLIC`
  e validação interna de identidade/campanha;
- uma `service_role` exposta ignora RLS e comprometeria todo o isolamento;
- RLS não substitui backup, segurança do host, HTTPS ou proteção das chaves.

O procedimento obrigatório para mudanças futuras está em
`docs/SERVER_RLS_SECURITY.md`.

## Rollback

O rollback de código é a reversão do commit único da Fase 6. Isso remove o novo
teste e a documentação, sem alterar o PostgreSQL.

Não há rollback de dados: nenhuma migration foi aplicada e todas as contas e
linhas descartáveis foram removidas. O Supabase Cloud continua sendo o fallback
inalterado.

## Referências

- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Próxima etapa

A próxima fase é a Fase 7 — Realtime. Ela deverá validar rolagens, alterações de
personagem e eventos de campanha entre clientes, incluindo encerramento correto
dos canais e ausência de subscriptions duplicadas.
