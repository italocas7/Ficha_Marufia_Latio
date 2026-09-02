# Marufia Server — domínio público

Este procedimento troca o endereço local do Marufia Server por um domínio HTTPS
controlado pelo Mestre. Ele não migra contas ou dados e não desativa o Supabase
Cloud. O PostgreSQL continua privado.

## O que é necessário

- um domínio ativo em uma conta Cloudflare;
- um hostname para a API, por exemplo `api.seudominio.com`;
- um serviço SMTP real para confirmação de email;
- o endereço HTTPS do site Marufia;
- Docker Desktop e o Marufia Server local saudáveis.

Não envie senha SMTP nem token do Tunnel por conversa. Os dois são inseridos
diretamente no computador e ficam em arquivos ignorados pelo Git.

## 1. Configurar o envio de email

Execute no PowerShell e informe a senha quando o comando pedir. A entrada fica
oculta:

```powershell
.\marufia-server\scripts\set-smtp.ps1 `
  -AdminEmail "marufia@seudominio.com" `
  -HostName "smtp.seuprovedor.com" `
  -Port 587 `
  -User "seu-usuario-smtp"
```

Também é possível usar `-PasswordFile` para automação, mas o arquivo deve ficar
fora do repositório e ser apagado com segurança logo depois.

## 2. Preparar o hostname na Cloudflare

No painel Cloudflare Zero Trust, crie um Tunnel gerenciado e associe o hostname
público ao serviço interno exatamente assim:

```text
http://marufia-public-gateway:8080
```

Não use `localhost`, `api-gw`, Studio, porta `5432` ou o endereço do PostgreSQL.
O conector inicia uma conexão de saída, portanto não é necessário abrir portas
no roteador.

## 3. Alinhar Auth, redirects e CORS

Use o hostname criado e o endereço público do aplicativo:

```powershell
.\marufia-server\scripts\configure-public-domain.ps1 `
  -Hostname "api.seudominio.com" `
  -SiteUrl "https://app.seudominio.com"
```

O comando:

- exige SMTP real antes de alterar qualquer URL;
- configura Auth e Realtime para o domínio HTTPS;
- desativa confirmação automática de email;
- permite no CORS somente o site, origens adicionais explícitas e o aplicativo
  Windows em `http://tauri.localhost`;
- recria serviços sem remover volumes;
- restaura automaticamente o `.env` anterior se a aplicação falhar;
- mantém o Tunnel parado para permitir revisão.

Use `-AdditionalRedirectUrls` somente para retornos HTTPS realmente utilizados.
Origens externas HTTP e curingas não são aceitos.

## 4. Guardar o token e validar o Tunnel

Copie o token do conector no painel e execute:

```powershell
.\marufia-server\scripts\set-tunnel-token.ps1
.\marufia-server\scripts\start-tunnel.ps1
.\marufia-server\scripts\status-tunnel.ps1
.\marufia-server\scripts\test-tunnel.ps1 -Mode Named
```

O ensaio permanente verifica HTTPS, saúde do Auth, bloqueio de rotas privadas e
WebSocket Realtime. O gateway público aceita apenas Auth, REST/RPC e Realtime.
Storage, Studio, Meta e banco continuam bloqueados.

## 5. Trocar o aplicativo para o servidor próprio

Somente depois do Tunnel permanente passar:

```powershell
.\marufia-server\scripts\select-client-backend.ps1 -Mode SelfHosted
pnpm build:site
pnpm tauri:build
```

O seletor grava somente URL HTTPS, modo, endereço do site e a chave pública. Ele
recusa chaves administrativas e não sobrescreve um `.env.local` criado pelo
usuário. O build gera automaticamente a CSP do aplicativo Windows para HTTPS e
WebSocket do domínio selecionado.

Publicar um novo site ou distribuir um novo instalador deve ocorrer somente
depois desses builds passarem e dos testes com dois computadores.

## Voltar ao Cloud ou ao modo local

Para devolver apenas os próximos builds ao Supabase Cloud:

```powershell
.\marufia-server\scripts\select-client-backend.ps1 -Mode Cloud
```

Para parar o Tunnel, restaurar URLs locais do servidor e devolver o cliente ao
Cloud, sem apagar banco ou Storage:

```powershell
.\marufia-server\scripts\restore-local-domain.ps1
```

O rollback não remove volumes, contas, migrations ou arquivos de backup.

## Diagnóstico rápido

| Sintoma | Verificação |
|---|---|
| domínio recusado | use um hostname real da zona Cloudflare; `.example` e Quick Tunnel não são produção |
| SMTP recusado | confirme remetente, host, porta, usuário e senha reais |
| confirmação volta ao endereço errado | confira `SiteUrl` e redirects antes de reiniciar o Tunnel |
| navegador mostra erro CORS | inclua a origem HTTPS exata; não use `*` |
| aplicativo Windows não conecta | gere novamente o pacote após selecionar `SelfHosted` |
| Tunnel não inicia | confira token, hostname e serviço interno no painel |

## Estado atual

A ativação real foi concluída com:

- `https://api.marufiarpg.org` como endpoint público;
- Tunnel nomeado `marufia-server` apontando exclusivamente para o gateway
  público;
- Resend em `smtp.resend.com:587`, remetente
  `noreply@marufiarpg.org` e domínio validado por DKIM, SPF e DMARC;
- HTTPS, Auth, REST/RPC e WebSocket Realtime aprovados pela internet;
- PostgreSQL e os serviços administrativos restritos ao computador do Mestre;
- perfil self-hosted selecionado localmente para novos builds;
- perfil Cloud preservado como fallback versionado.

As credenciais continuam em arquivos ignorados pelo Git. O site público dos
jogadores ainda aponta para o Cloud e não deve ser republicado antes do teste
controlado com dois computadores. Essa separação permite manter os dois
ambientes funcionando durante a validação.
