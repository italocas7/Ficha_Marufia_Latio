# Marufia Server

Esta pasta hospeda o ambiente experimental que permitirá ao computador do Mestre
executar o backend do Marufia. Ela é independente de `server/`, que continua
sendo o Worker do site publicado.

## Estado da Fase 13

O runtime oficial do Supabase Self-Hosted está validado na release fixada
`self-hosted/v0.8.0`. PostgreSQL, Auth, REST, Realtime, Storage, Studio, gateway e
pooler iniciaram com imagens imutáveis e passaram pelos health checks locais.
Edge Functions permanecem desativadas porque o cliente não as utiliza.

As 26 migrations versionadas do Marufia foram aplicadas ao banco experimental.
O schema local passou por validação de tabelas, RLS, policies, RPCs, gatilhos e
Realtime, além de 35 testes transacionais de segurança com rollback integral.

O Auth local passou por cadastro, perfil automático, login, logout, refresh de
sessão e validação dos papéis Mestre/Jogador. O teste usa somente contas
descartáveis no loopback e remove os dados ao terminar. Nenhuma conta real foi
migrada.

As 13 policies RLS também foram validadas pela API com Mestre, Jogador A e um
usuário de outra campanha. As oito tabelas recusaram acesso anônimo; usuários e
Mestres não atravessaram campanhas; as operações legítimas continuaram
funcionando. Nenhuma policy ou migration precisou ser modificada.

O Realtime local foi validado com três clientes autenticados e as seis tabelas
publicadas. Ficha, rolagem, histórico, presença, sessão e campanha chegaram sem
duplicação aos clientes autorizados, enquanto o usuário externo recebeu zero
evento. Todos os canais e dados descartáveis foram removidos ao final.

O Cloudflare Tunnel foi preparado com uma rede Docker exclusiva e um gateway
público que permite somente Auth, REST/RPC e Realtime. Um Quick Tunnel restrito
validou HTTPS e WebSocket pela internet; cadastro, REST, Studio e PostgreSQL
ficaram bloqueados durante o ensaio. O endereço temporário foi removido ao fim.

A automação da Fase 9 agora configura domínio, Auth, redirects, CORS e o perfil
público dos builds com rollback automático. Ela exige SMTP real, bloqueia
domínios temporários e mantém o Tunnel parado até a revisão final. O gateway
remove o CORS amplo do upstream e libera somente origens exatas.

O domínio `marufiarpg.org`, o hostname `api.marufiarpg.org`, o SMTP e o Tunnel
nomeado foram configurados e validados. O gateway público continua sendo a única
entrada externa; PostgreSQL e Studio permanecem locais.

O Supabase Cloud continua sendo o backend padrão do aplicativo. Nenhum dado ou
conta foi migrado, e nenhuma funcionalidade da ficha foi alterada.

O PostgreSQL agora possui backup lógico verificado, retenção de sete pontos
diários e quatro semanais, proteção criptografada da chave persistente e restore
testado em banco descartável. Uma tarefa do Windows executa o backup às 18h e
registra sucesso ou falha sem gravar segredos. O caminho de produção cria um
rollback preventivo, valida o dump isoladamente e só então entra em manutenção.

O Mestre agora pode usar um painel simples para verificar os serviços, iniciar,
parar, reiniciar, fazer backup e abrir o Studio local. O health check cobre
Database, Auth, REST, Realtime, Storage e Tunnel, além de mostrar jogadores
recentes e o último backup válido. Logs operacionais ocultam credenciais e têm
retenção de 90 dias. A inicialização junto do Windows é opcional e permanece
desativada até ser escolhida pelo Mestre.

O domínio público também passou por um ensaio com um Mestre, cinco jogadores e
uma conta externa. A queda real dos containers e do Tunnel preservou os dados e
as filas locais; após a recuperação, Realtime, conflitos e novas gravações
voltaram a funcionar. O corte do Cloud ainda depende do roteiro em um segundo
computador físico e de uma reinicialização completa do Windows com dados ativos.

## Pré-requisitos no Windows

- Windows 10/11 compatível com Docker Desktop;
- Docker Desktop com Docker Compose `2.24.4` ou mais novo;
- PowerShell 7.4 ou mais novo para gerar os segredos;
- ao menos 4 GB de RAM, 2 núcleos e 40 GB SSD disponíveis para o ambiente;
- recomendado: 8 GB de RAM, 4 núcleos e 80 GB SSD.

Nesta máquina foram validados WSL `2.7.12`, Docker Desktop `4.88.1`, Docker Engine
`29.7.2` e Docker Compose `5.4.0`.

## Primeiro preparo

Execute uma única vez, a partir da raiz do projeto:

```powershell
.\marufia-server\scripts\setup-environment.ps1
```

O comando cria `marufia-server/.env` com senhas e chaves criptograficamente
aleatórias, sem mostrá-las na tela. Se o arquivo já existir, o comando para sem
sobrescrevê-lo. O `.env` é ignorado pelo Git.

O preparo inicial aceita apenas o servidor local. Use
`configure-public-domain.ps1` depois de configurar SMTP para aplicar um domínio
externo com rollback seguro.

## Operação

Para a operação diária, abra o painel:

```powershell
.\marufia-server\scripts\server-manager.ps1
```

Para somente verificar a saúde sem abrir o menu:

```powershell
.\marufia-server\scripts\health-check.ps1
```

O ensaio público controlado, que provoca alguns minutos de indisponibilidade, é:

```powershell
.\marufia-server\scripts\test-public-clients.ps1 `
  -PlayerCount 5 `
  -IncludeOutage `
  -Confirmation "TESTAR-QUEDA-MARUFIA"
```

Os comandos individuais continuam disponíveis:

```powershell
.\marufia-server\scripts\start-server.ps1
.\marufia-server\scripts\status-server.ps1
.\marufia-server\scripts\restart-server.ps1
.\marufia-server\scripts\stop-server.ps1
```

Parar ou reiniciar nunca usa `down -v`: banco, Storage e chaves permanecem
preservados. O primeiro início baixa imagens e pode demorar.

Para aplicar migrations pendentes ou confirmar o schema atual:

```powershell
.\marufia-server\scripts\migrate-schema.ps1
.\marufia-server\scripts\verify-schema.ps1 -RequireEmptyData
.\marufia-server\scripts\test-schema-security.ps1
.\marufia-server\scripts\test-auth.ps1
.\marufia-server\scripts\test-rls.ps1
.\marufia-server\scripts\test-realtime.ps1
.\marufia-server\scripts\test-tunnel.ps1 -Mode Quick
```

Para backup e restauração segura:

```powershell
.\marufia-server\scripts\backup.ps1
.\marufia-server\scripts\restore.ps1
.\marufia-server\scripts\test-backup-restore.ps1
.\marufia-server\scripts\configure-backup-schedule.ps1 -At "18:00"
```

`restore.ps1` usa um banco descartável por padrão e não substitui o banco em
uso. Leia `docs/SERVER_BACKUP_AND_RESTORE.md` antes do modo de produção. O
agendamento pode ser removido com `remove-backup-schedule.ps1`; isso não apaga
os dumps existentes.

Para habilitar opcionalmente o servidor no logon do Windows e depois voltar ao
modo manual:

```powershell
.\marufia-server\scripts\configure-startup.ps1
.\marufia-server\scripts\remove-startup.ps1
```

A tarefa inicia o Docker Desktop oculto, aguarda o mecanismo ficar disponível e
então inicia os serviços e o Tunnel. Ela não recebe privilégios administrativos.

Para revisar ou transferir a configuração pública, siga
`docs/SERVER_PUBLIC_DOMAIN.md`. A operação permanente usa:

```powershell
.\marufia-server\scripts\set-smtp.ps1 `
  -AdminEmail "marufia@seudominio.com" `
  -HostName "smtp.seuprovedor.com" `
  -Port 587 `
  -User "seu-usuario-smtp"
.\marufia-server\scripts\configure-public-domain.ps1 `
  -Hostname "api.seudominio.com" `
  -SiteUrl "https://app.seudominio.com"
.\marufia-server\scripts\set-tunnel-token.ps1
.\marufia-server\scripts\start-tunnel.ps1
.\marufia-server\scripts\test-tunnel.ps1 -Mode Named
.\marufia-server\scripts\select-client-backend.ps1 -Mode SelfHosted
.\marufia-server\scripts\status-tunnel.ps1
.\marufia-server\scripts\stop-tunnel.ps1
```

O migrador valida o conjunto por SHA-256 e cria um dump de rollback antes da
primeira alteração. Ele nunca executa `seed.sql` nem copia dados do Cloud.

Quando o servidor não for necessário, execute `stop-server.ps1`. Isso encerra os
containers e reduz o uso de memória e processador; WSL e Plataforma de Máquina
Virtual permanecerem habilitados não equivale a manter o servidor em execução.

Se o Docker Desktop mostrar erro Windows `1920` envolvendo `sailor-ingest.sock`
ou `engine.sock`, não use **Reset to factory defaults**. Esse é um problema de
socket temporário do Docker no Windows; consulte a nota operacional e o
procedimento preservando dados em `docs/MARUFIA_SERVER_PHASE_4.md`.

## Segurança desta configuração

- gateway HTTP, pooler e PostgreSQL são publicados somente em `127.0.0.1`;
- PostgreSQL não fica acessível pela rede local nem pela internet;
- o hostname do Tunnel deverá apontar somente para
  `http://marufia-public-gateway:8080` dentro da rede Docker;
- o gateway público libera somente `/auth/v1/`, `/rest/v1/` e `/realtime/v1/`;
- Studio é protegido pelo usuário e senha aleatórios do `.env`;
- `service_role`, JWT, banco e chaves administrativas não são enviados ao cliente;
- confirmação automática de email é permitida somente no loopback experimental;
- uma URL externa exige HTTPS, confirmação automática desativada e SMTP real;
- sessões usam chaves ES256 próprias; tokens antigos do Cloud não serão aceitos;
- as Edge Functions não iniciam por padrão.

## Limite desta fase

O backup lógico cobre o PostgreSQL, inclusive Auth, RLS, RPCs, gatilhos e
metadados do Storage. Arquivos físicos do Storage, `.env`, token do Tunnel e
logs não fazem parte do dump. O Storage ainda está vazio e não é usado pelo
cliente, mas uma futura adoção exigirá backup próprio dos objetos. A cópia
externa dos conjuntos de backup continua sendo responsabilidade do Mestre.

Consulte `docs/MARUFIA_SERVER.md`,
`docs/MARUFIA_SERVER_PHASE_12.md`,
`docs/MARUFIA_SERVER_PHASE_13.md`,
`docs/SERVER_MANAGER.md`,
`docs/SERVER_ACCEPTANCE_TEST.md`,
`docs/SERVER_BACKUP_AND_RESTORE.md`,
`docs/SERVER_PUBLIC_DOMAIN.md` e `docs/SERVER_CLOUDFLARE_TUNNEL.md` para
resultados, operação e segurança.
