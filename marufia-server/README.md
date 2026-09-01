# Marufia Server

Esta pasta hospeda o ambiente experimental que permitirá ao computador do Mestre
executar o backend do Marufia. Ela é independente de `server/`, que continua
sendo o Worker do site publicado.

## Estado da Fase 9

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

A ativação permanente ainda aguarda um domínio sob controle do usuário, SMTP e
token do Tunnel. Não foi criado recurso permanente numa conta Cloudflare, o
servidor continua local e a Fase 9 permanece parcial.

O Supabase Cloud continua sendo o backend padrão do aplicativo. Nenhum dado ou
conta foi migrado, e nenhuma funcionalidade da ficha foi alterada.

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

Após possuir domínio e SMTP reais, siga `docs/SERVER_PUBLIC_DOMAIN.md`. A
operação permanente usa:

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

O runtime continua operacional em `127.0.0.1` e contém o schema vazio do
Marufia. Domínio, SMTP, DNS e token definitivos são recursos externos ausentes;
por isso o Tunnel nomeado e os builds self-hosted definitivos não foram
executados. Backups automáticos e migração de dados continuam reservados às
fases próprias.

Consulte `docs/MARUFIA_SERVER_PHASE_9.md`,
`docs/SERVER_PUBLIC_DOMAIN.md` e `docs/SERVER_CLOUDFLARE_TUNNEL.md` para
resultados, operação e segurança.
