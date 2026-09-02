# Marufia Server — Fase 11: backups e restauração

## Resultado

A Fase 11 criou um sistema de backup lógico para o PostgreSQL self-hosted e
comprovou uma restauração integral em banco descartável. O banco ativo, o
Supabase Cloud e os dados públicos não foram substituídos durante o ensaio.

## Proteções implementadas

- dump customizado e comprimido executado dentro do container PostgreSQL fixado;
- falha imediata quando `pg_dump`, cópia ou verificação retorna erro;
- catálogo conferido pelo `pg_restore` antes de declarar sucesso;
- SHA-256 para dump e chave criptográfica;
- metadados com versão, horário, imagem, tamanho e quantidade de objetos;
- chave persistente `pgsodium` protegida por AES-256-GCM e PBKDF2-SHA256;
- arquivo temporário e conjunto incompleto removidos sem tocar em backups antigos;
- lock que impede dois backups/restores simultâneos;
- retenção de sete dias distintos e quatro semanas ISO;
- conjuntos inválidos, históricos e pré-restore excluídos da exclusão automática;
- restauração real protegida por texto de confirmação, teste prévio e rollback.

## Restauração validada

O teste criou um novo banco com `template0`, restaurou o dump em transação única
e validou:

- oito tabelas públicas;
- RLS habilitado em todas;
- histórico de migrations;
- Auth e contagem de usuários;
- seis tabelas na publicação Realtime;
- RPCs críticas de ficha e rolagem;
- dados e constraints aceitos pelo `pg_restore`.

O banco temporário foi removido ao final. A contagem de bancos temporários antes e
depois permaneceu igual, e `verify-schema.ps1` confirmou que o banco em uso não
mudou.

## Testes executados

- sintaxe dos 30 scripts PowerShell;
- seleção simulada de sete pontos diários e quatro semanais;
- backup real do PostgreSQL 17.6.1.136;
- leitura estrutural do dump depois da cópia para o Windows;
- criptografia, descriptografia e comparação constante da chave persistente;
- adulteração de um byte numa cópia temporária, recusada pelo SHA-256;
- restore real em banco descartável;
- validação de schema, Auth, RLS, RPCs e Realtime após o restore;
- remoção do banco descartável;
- verificação do banco ativo após o ensaio;
- instalação da tarefa diária no Agendador do Windows.
- execução real da tarefa agendada com resultado `0` e log de sucesso;
- restauração isolada do backup criado pela própria tarefa;
- 12 testes Python e 412 testes JavaScript;
- smoke test completo em desktop e celular.

## Automação ativa

A tarefa `Marufia Server Daily Backup` está ativa às 18h, horário local, com
`StartWhenAvailable`. Ela chama um executor sem interação e grava somente
resultado e erro sanitizado em log mensal ignorado pelo Git.

## Arquivos e impacto

- `backup.ps1`: criação, validação e retenção;
- `restore.ps1`: modo de teste padrão e modo de produção protegido;
- `backup-common.ps1`: integridade, criptografia, restore e seleção de retenção;
- `test-backup-restore.ps1`: ensaio destrutivo restrito a cópia e banco temporários;
- scripts do Agendador do Windows;
- `docs/SERVER_BACKUP_AND_RESTORE.md`: manual operacional.

`app.js`, `data.js`, migrations, regras do RPG e o banco ativo não foram
modificados. Os dumps e logs permanecem ignorados pelo Git.

## Limites e riscos

- uma cópia no mesmo disco não protege contra falha física; ainda é necessária
  cópia periódica para outro dispositivo;
- objetos físicos do Storage não entram no dump, embora seus metadados entrem;
- o servidor está vazio de objetos Storage e segredos Vault nesta fase;
- o `.env` deve ser preservado separadamente para abrir a chave protegida;
- restore entre imagens PostgreSQL diferentes é recusado e exige migração própria;
- o caminho de produção foi implementado com rollback, mas não foi executado de
  forma destrutiva sobre o banco ativo; o requisito desta fase foi validado no
  banco de teste;
- transferência completa para outra máquina será ensaiada na fase final.

## Rollback

O commit da fase pode ser revertido sem apagar dumps. O agendamento pode ser
removido com `remove-backup-schedule.ps1`. A restauração real sempre cria um ponto
preventivo antes de alterar `postgres` e tenta recuperá-lo automaticamente se os
checks falharem.

## Próxima etapa

A próxima etapa é a Fase 12: administração simples, health check consolidado,
logs e inicialização opcional. Ela deve reutilizar os scripts validados aqui.
