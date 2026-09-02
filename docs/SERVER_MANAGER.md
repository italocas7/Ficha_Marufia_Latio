# Gerenciador do Marufia Server

O gerenciador reúne as operações comuns do servidor em um menu simples para o
Mestre. Ele não altera fichas, regras do RPG ou dados ao apenas ser aberto.

## Abrir o painel

Na pasta do projeto, execute:

```powershell
.\marufia-server\scripts\server-manager.ps1
```

O painel apresenta um resumo semelhante a este:

```text
MARUFIA SERVER
────────────────────────────────
Servidor:              ONLINE
Banco:                 ONLINE
Realtime:              ONLINE
Tunnel:                ONLINE
Jogadores conectados:  3
Último backup:          02/09/2026 18:00
Inicialização Windows:  MANUAL
```

As opções permitem verificar a saúde, iniciar, parar ou reiniciar o servidor,
fazer um backup, abrir o Supabase Studio local e abrir a pasta de logs.

Também é possível executar uma ação diretamente:

```powershell
.\marufia-server\scripts\server-manager.ps1 -Action Status
.\marufia-server\scripts\server-manager.ps1 -Action Start
.\marufia-server\scripts\server-manager.ps1 -Action Stop
.\marufia-server\scripts\server-manager.ps1 -Action Restart
.\marufia-server\scripts\server-manager.ps1 -Action Backup
```

Parar ou reiniciar não remove volumes. O banco, o Storage e as chaves permanecem
preservados.

## Verificação de saúde

O comando abaixo verifica Database, Auth, REST API, Realtime, Storage e Tunnel:

```powershell
.\marufia-server\scripts\health-check.ps1
```

O teste usa o endereço local para os serviços internos e HTTPS para o Tunnel. A
checagem de Auth usa somente a chave pública, nunca a chave administrativa.

“Jogadores conectados” conta usuários únicos que atualizaram a presença nos
últimos 90 segundos. Portanto, o número pode ficar em zero mesmo quando o
servidor está saudável e ninguém está com uma campanha aberta.

O “último backup” só considera um conjunto cujo dump, metadados e hashes ainda
são válidos.

## Logs

Os eventos de operação ficam em arquivos mensais na pasta
`marufia-server/logs/`. Mensagens que se pareçam com senhas, tokens, JWTs ou
chaves são ocultadas antes da gravação. Logs operacionais com mais de 90 dias
são removidos; outros arquivos da pasta não entram nessa rotação.

## Inicialização com o Windows

O padrão é manual. Para iniciar o Marufia Server no logon do Mestre:

```powershell
.\marufia-server\scripts\configure-startup.ps1
```

A tarefa usa a conta atual e privilégios limitados. Se necessário, inicia o
Docker Desktop de modo oculto, aguarda até cinco minutos e então inicia servidor
e Tunnel. Para voltar ao modo manual:

```powershell
.\marufia-server\scripts\remove-startup.ps1
```

Remover a tarefa não para o servidor em uso e não apaga banco, backups ou
configuração.
