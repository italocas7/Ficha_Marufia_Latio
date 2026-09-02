# Marufia Server — backup e restauração

Este procedimento protege o banco PostgreSQL do Marufia Server. O comando de
backup só informa sucesso depois de criar o dump, validar seu catálogo, copiar o
arquivo para o Windows, calcular SHA-256 e conferir a chave criptográfica
protegida.

## Fazer um backup agora

Na pasta principal do projeto, execute:

```powershell
.\marufia-server\scripts\backup.ps1
```

O resultado fica em `marufia-server/backups/`. Cada ponto possui quatro arquivos
que devem permanecer juntos:

```text
marufia-postgres-AAAAMMDD-HHMMSS.dump
marufia-postgres-AAAAMMDD-HHMMSS.metadata.json
marufia-postgres-AAAAMMDD-HHMMSS.pgsodium-key.enc
marufia-postgres-AAAAMMDD-HHMMSS.sha256
```

O `.dump` usa o formato customizado e comprimido do PostgreSQL. O manifesto
SHA-256 detecta corrupção. A chave persistente necessária a dados criptografados
fica em um arquivo AES-256-GCM; ela só pode ser aberta com o `.env` correspondente
ao servidor e nunca é gravada em texto puro na pasta de backups.

## Backup automático

Nesta máquina, o backup diário está configurado para 18h no horário local:

```powershell
.\marufia-server\scripts\configure-backup-schedule.ps1 -At "18:00"
```

Se o computador estiver desligado no horário, o Agendador do Windows tentará
executar a tarefa quando ela ficar disponível. O PostgreSQL e o Docker precisam
estar em funcionamento. Sucesso e falha ficam em
`marufia-server/logs/backup-AAAA-MM.log`, sem senhas ou tokens.

Para remover apenas o agendamento:

```powershell
.\marufia-server\scripts\remove-backup-schedule.ps1
```

Esse comando não remove nenhum backup.

## Retenção

Os valores padrão estão no `.env` privado:

```text
MARUFIA_BACKUP_RETENTION_DAYS=7
MARUFIA_BACKUP_RETENTION_WEEKS=4
```

A retenção mantém o ponto mais recente de cada um dos sete dias distintos mais
recentes e o ponto mais recente de cada uma das quatro semanas ISO mais recentes.
O backup recém-validado sempre é preservado.

Somente conjuntos regulares completos e com SHA-256 válido entram na limpeza.
Arquivos incompletos ou adulterados são preservados para revisão, e o script se
recusa a remover o último backup válido. Pontos `marufia-pre-restore-*` e o dump
histórico da migração de schema ficam fora da limpeza automática.

## Testar uma restauração

O modo padrão é seguro: cria um banco temporário separado, restaura tudo, verifica
as oito tabelas, RLS, migrations, RPCs, Auth e publicação Realtime e depois remove
esse banco. O banco em uso não é substituído.

Para testar o backup regular mais recente:

```powershell
.\marufia-server\scripts\restore.ps1
```

Para escolher um arquivo:

```powershell
.\marufia-server\scripts\restore.ps1 `
  -BackupPath ".\marufia-server\backups\marufia-postgres-AAAAMMDD-HHMMSS.dump"
```

O teste agregado usado pela manutenção é:

```powershell
.\marufia-server\scripts\test-backup-restore.ps1
```

Ele também altera somente uma cópia temporária para comprovar que um arquivo
corrompido é rejeitado antes do restore.

## Restauração real

Use somente durante uma janela de manutenção, sem jogadores conectados. Primeiro
execute o modo de teste acima. Depois:

```powershell
.\marufia-server\scripts\restore.ps1 `
  -BackupPath ".\marufia-server\backups\marufia-postgres-AAAAMMDD-HHMMSS.dump" `
  -Mode Production `
  -Confirmation "RESTAURAR-MARUFIA"
```

Antes de substituir o banco, o script:

1. cria e verifica um ponto `marufia-pre-restore-*` fora da retenção;
2. restaura o arquivo escolhido em um banco descartável;
3. confirma a mesma imagem fixada do PostgreSQL e a chave criptográfica;
4. para somente os serviços que estavam ativos;
5. substitui o banco e executa as verificações estruturais;
6. reinicia os mesmos serviços;
7. usa o ponto preventivo automaticamente se algum check falhar.

Uma falha simultânea do restore e do rollback mantém os serviços parados, evitando
servir um banco incerto. Nesse caso, preserve todos os arquivos e não tente apagar
volumes.

## O que está incluído

- schemas, tabelas e dados do banco;
- `auth.users` e sessões persistidas no PostgreSQL;
- policies RLS, grants, funções, gatilhos, views, enums e índices;
- migrations e publicação Realtime;
- metadados do Storage;
- cópia criptografada da chave persistente do PostgreSQL.

## O que não está incluído

- arquivos físicos enviados ao Storage;
- `.env` e suas senhas;
- token e configuração privada da Cloudflare;
- logs e executáveis;
- dados que ainda estejam somente no Supabase Cloud.

O Marufia atualmente possui zero objetos no Storage e não usa Vault. Se Storage
for adotado, os arquivos deverão receber backup próprio; restaurar apenas o banco
recupera metadados, não o conteúdo dos objetos. A documentação oficial do Supabase
faz a mesma distinção entre backup do banco e objetos do Storage:
<https://supabase.com/docs/guides/platform/backups>.

## Cópia para outro disco

Um backup guardado apenas no mesmo SSD não protege contra defeito físico ou furto.
Periodicamente copie os quatro arquivos do ponto mais recente para um disco
externo confiável. Guarde uma cópia segura do `.env` separadamente; não envie esse
arquivo por conversa, e-mail ou repositório Git.

Para outra máquina, instale primeiro a mesma versão fixada do Marufia Server. O
restore recusa imagens PostgreSQL diferentes e chaves incompatíveis. Migração
entre versões deve seguir o procedimento oficial com roles, schema e dados
separados, pois dumps brutos incluem componentes internos do Supabase:
<https://supabase.com/docs/guides/self-hosting/restore-from-platform>.

O formato customizado foi escolhido porque o `pg_restore` consegue listar e
validar seu catálogo e oferece `--exit-on-error` e transação única:
<https://www.postgresql.org/docs/17/app-pgrestore.html>.

## Erros comuns

- **Docker não está aberto:** inicie o Docker Desktop e repita.
- **Backup incompleto:** não renomeie nem separe os quatro arquivos.
- **SHA-256 inválido:** preserve o conjunto para investigação e escolha outro.
- **Imagem PostgreSQL diferente:** não force; use a estratégia de migração entre
  versões.
- **Chave diferente:** use o `.env` e a configuração persistente que pertencem ao
  backup; não substitua a chave de um servidor que contenha dados.
- **Agendamento falhou:** consulte o log mensal e confirme que o servidor estava
  ligado.
