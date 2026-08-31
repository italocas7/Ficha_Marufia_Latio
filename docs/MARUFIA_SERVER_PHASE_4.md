# Marufia Server — Fase 4: migração do schema

## Resultado

As 26 migrations já usadas pelo projeto foram aplicadas no PostgreSQL local
experimental. O resultado contém as oito tabelas públicas, RLS, policies,
funções, gatilhos e publicações Realtime inventariados na Fase 0.

Nenhum dado, usuário ou sessão do Supabase Cloud foi copiado. O Cloud continua
sendo o backend padrão do aplicativo, e `app.js`, `data.js`, o site e seu Worker
não foram alterados.

## Separação entre schema e dados

Esta fase executa exclusivamente os arquivos versionados em
`supabase/migrations/`. O arquivo `supabase/seed.sql` não é executado e nenhuma
conexão ao banco Cloud faz parte do procedimento.

```text
26 migrations versionadas
          |
          v
validação de nomes e SHA-256
          |
          v
backup local anterior à primeira alteração
          |
          v
PostgreSQL self-hosted experimental

Supabase Cloud ------------------------ intocado
Dados e auth.users -------------------- não copiados
```

O manifesto `marufia-server/schema/MIGRATIONS.sha256` fixa o conjunto revisado.
O migrador para se algum arquivo estiver ausente, adicional ou modificado sem
uma atualização consciente do manifesto.

## Aplicação segura

`migrate-schema.ps1` exige que a primeira execução encontre zero usuários e zero
tabelas públicas. Antes de criar o histórico de migrations, ele:

1. gera um dump PostgreSQL em formato customizado;
2. valida o índice do dump com `pg_restore --list`;
3. copia o arquivo para a pasta privada e ignorada `marufia-server/backups/`;
4. grava um arquivo SHA-256 ao lado do dump;
5. somente então começa a aplicar migrations.

Cada migration é aplicada junto de seu registro em
`supabase_migrations.schema_migrations` na mesma transação. Uma falha não marca a
versão como concluída; a execução seguinte retoma apenas o que estiver pendente.

O rollback local criado nesta máquina é:

```text
phase4-pre-schema-20260831-130330.dump
SHA-256: 09b79d8db4623d634e9824978a18c8e0ee579c142d54757f3698b847090c92d7
```

Esse arquivo é um ponto de segurança da migração de schema. Ele não substitui a
política automática de backups e os ensaios completos de restauração previstos
na Fase 11.

## Estrutura validada

| Item | Resultado |
|---|---:|
| Migrations registradas | 26 |
| Tabelas públicas | 8 |
| Tabelas com RLS | 8 |
| Policies RLS | 13 |
| RPCs usadas pelo cliente | 15 |
| Gatilhos | 11 |
| Tabelas no Realtime | 6 |
| Usuários locais | 0 |
| Linhas de dados do Marufia | 0 |

Também foi verificada a ausência de privilégios diretos de tabela para `anon` e
`PUBLIC`. A Data API negou uma consulta sem login e respondeu normalmente com a
credencial administrativa mantida somente no servidor.

## Segurança testada

A suíte `supabase/tests/rls_security.test.sql` executou 35 cenários dentro de uma
transação. Ela cobre, entre outros pontos:

- jogador acessando somente os próprios personagens;
- Mestre acessando somente dados permitidos de sua campanha;
- usuário de outra campanha sendo bloqueado;
- escrita concorrente com revisão obsoleta sendo recusada;
- RPCs sensíveis e histórico de campanha;
- ausência de acesso anônimo indevido.

Os 35 testes passaram. A transação terminou com rollback, e uma nova contagem
confirmou que não restaram usuários, campanhas, personagens ou outros dados de
teste.

A mesma suíte foi repetida no Supabase Cloud vinculado e também aprovou os 35
cenários com rollback. O histórico remoto continua alinhado às 26 migrations
locais, inclusive `20260822130000`.

## Serviços após o schema

| Serviço | Verificação | Resultado |
|---|---|---|
| PostgreSQL | aplicação e inspeção do schema | OK |
| Auth | health pelo gateway com chave pública | HTTP 200 |
| REST | consulta administrativa a `profiles` | HTTP 200, zero linhas |
| REST sem login | consulta a dados privados | negada |
| Realtime | conexão WebSocket | aberta |
| Storage | endpoint pelo gateway | HTTP 200 |
| Studio | autenticação e redirecionamento | HTTP 200 final |

Passaram ainda 12 testes Python, 374 testes JavaScript e o smoke test em desktop
e celular. O Realtime Cloud continuou conectado. A Data API Cloud continua
retornando `503/PGRST002`, condição preexistente desde a Fase 0; o teste remoto
direto do banco e os 35 cenários de RLS funcionaram normalmente.

Após uma reinicialização completa do Windows, o ambiente foi iniciado novamente.
As 26 migrations, as oito tabelas e todos os demais objetos permaneceram
presentes; Auth, REST, Storage, Realtime e Studio voltaram a responder, e a suíte
de 35 testes RLS passou novamente sem deixar dados. Isso confirma a persistência
do volume local para o escopo desta fase.

## Nota operacional do Docker no Windows

Esta máquina usa Windows build `26200.9168` e Docker Desktop `4.88.1`. Durante o
fechamento da fase, o Docker encontrou o erro Windows `1920` ao tentar substituir
sockets AF_UNIX próprios (`sailor-ingest.sock` e `engine.sock`). O problema é da
inicialização do Docker Desktop e não alterou o PostgreSQL.

O ambiente foi recuperado sem reset de fábrica:

- foi criada uma cópia da configuração do Docker;
- Docker Model Runner foi desativado, pois não é usado pelo Marufia;
- os processos Docker e a VM WSL foram encerrados;
- somente as pastas temporárias com sockets órfãos foram renomeadas para `.stale`;
- após a reinicialização, a pasta temporária recriada pela tentativa anterior foi
  preservada novamente antes de um único início limpo.

Volumes, imagens, containers e o dump de rollback não foram apagados. O problema
e a técnica de renomear as pastas-pai estão registrados em
[docker/desktop-feedback#531](https://github.com/docker/desktop-feedback/issues/531).
Não use a opção **Reset to factory defaults**, pois ela é desproporcional e pode
remover os dados locais do Docker.

## Rollback

O código desta fase pode ser revertido pelo commit único da Fase 4. Isso não
remove objetos já criados no PostgreSQL.

Se for necessário restaurar o banco local, interrompa o uso do ambiente e siga
`docs/SERVER_SCHEMA_MIGRATION_AND_ROLLBACK.md`. A restauração é destrutiva para o
banco de destino e não deve ser executada sobre um banco com dados sem criar um
novo backup primeiro.

Como nenhuma conta ou dado real foi migrado, o Supabase Cloud permanece sendo o
fallback íntegro. Uma migração de dados de produção só poderá ocorrer depois da
validação específica de Auth, RLS e Realtime nas próximas fases.

## Limites e próxima etapa

A Fase 4 prova que o schema versionado pode ser reconstruído no runtime
self-hosted. Ela não prova ainda a compatibilidade das contas existentes, dos
tokens ou do fluxo de email. Esses itens pertencem à Fase 5 — Autenticação.
