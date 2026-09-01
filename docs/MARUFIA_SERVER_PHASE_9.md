# Marufia Server — Fase 9: configuração de domínio

## Resultado

A configuração de domínio passou a ser segura, reversível e independente de um
endereço específico. A automação alinha Supabase, Auth, redirects, CORS,
Cloudflare Tunnel e o perfil público usado pelos builds web/Tauri.

A fase está parcial porque o repositório não contém — e não deve conter — um
domínio do usuário, credenciais SMTP ou token permanente. Sem esses recursos
externos não é possível validar o Tunnel nomeado nem distribuir um cliente
self-hosted definitivo. O Supabase Cloud continua como fallback padrão.

## Proteções implementadas

- somente hostname HTTPS real e controlado é aceito; nomes reservados e
  `trycloudflare.com` são recusados;
- Auth externo exige SMTP completo e confirmação automática desativada;
- URLs do gateway e do Auth precisam corresponder exatamente;
- CORS usa no máximo 12 origens exatas, sem curinga e sem HTTP externo;
- o aplicativo Windows recebe permissão para sua origem Tauri
  `http://tauri.localhost`;
- cabeçalhos CORS amplos do gateway interno são removidos antes da resposta
  pública;
- o arquivo final do Envoy é gerado localmente e ignorado pelo Git;
- qualquer falha ao aplicar o domínio restaura o `.env` anterior;
- o seletor do cliente usa apenas URL, site e chave pública;
- o rollback para Cloud/loopback não remove volumes nem dados.

## Fluxo preparado

```text
site e aplicativo Windows
          |
          | HTTPS / WSS
          v
hostname configurável na Cloudflare
          |
          v
Tunnel (conexão de saída)
          |
          v
gateway público com rotas e CORS restritos
          |
          +-- Auth
          +-- REST / RPC
          `-- Realtime

PostgreSQL, Studio, Storage e Meta permanecem privados
```

## Validações executadas

O teste isolado de configuração confirmou hostname, alinhamento de URLs,
exigência de SMTP, bloqueio de confirmação automática externa, CORS exato e
renderização do gateway sem alterar o `.env` real.

Um gateway real em Docker confirmou:

| Requisição | Resultado |
|---|---|
| origem do site permitida | cabeçalho CORS com a origem exata |
| origem não autorizada | nenhum cabeçalho de liberação |
| preflight do Tauri Windows | HTTP 200 e origem exata |
| PostgreSQL | continua restrito ao loopback |

O caminho de erro também foi exercitado: tentar configurar
`api.marufia.dev` sem SMTP real falhou antes de qualquer mutação e preservou a
configuração local.

### Regressão final

| Verificação | Resultado |
|---|---|
| scripts PowerShell | sintaxe aprovada |
| configuração de domínio | hostname, SMTP, Auth, rollback e CORS aprovados |
| CORS em gateway Docker real | site e Tauri permitidos; origem externa negada |
| schema self-hosted | 8 tabelas, 13 policies, 15 RPCs, 11 gatilhos e 6 tabelas Realtime |
| ataques SQL locais | 35/35 com rollback integral |
| Auth local | cadastro, login, logout, refresh, perfis e papéis aprovados |
| RLS local pela API | anônimo negado e três identidades isoladas |
| Realtime local | seis tabelas aprovadas após uma repetição transitória |
| Quick Tunnel real | HTTPS, Auth, bloqueios e WebSocket aprovados; removido ao final |
| testes Python | 12/12 |
| testes JavaScript | 397/397 |
| smoke test | desktop, tablet e celular aprovados |
| Auth Cloud | HTTP 200 |
| Realtime Cloud | canal conectado e removido |
| ataques SQL remotos | 35/35 com rollback integral |
| migrations Cloud | 26 locais e remotas alinhadas, inclusive `20260822130000` |

A Data API Cloud continua retornando `503/PGRST002`, condição preexistente desde
a Fase 0. Auth, Realtime e a conexão transacional remota continuam funcionando;
a falha não foi causada pela Fase 9.

Após a reinicialização do Windows, o Docker Desktop voltou a encontrar sockets
AF_UNIX órfãos em `sailor-ingest.sock` e `engine.sock`. As duas pastas
temporárias foram preservadas com sufixo `.stale`, a VM WSL foi reiniciada e o
Docker Engine `29.7.2` voltou sem reset de fábrica. Os dez containers, volumes e
schema persistiram; todos os serviços ficaram saudáveis antes dos testes.

## Arquivos e impacto

- `marufia-server/scripts/configure-public-domain.ps1`: aplica domínio com
  rollback automático;
- `set-smtp.ps1`: grava SMTP sem exibir senha;
- `render-public-gateway.ps1`: gera a lista CORS exata;
- `select-client-backend.ps1`: alterna os próximos builds entre Cloud e
  self-hosted;
- `restore-local-domain.ps1`: retorno seguro ao loopback/Cloud;
- `test-domain-config.ps1`: valida configuração sem publicar serviços;
- `common.ps1`, setup, Tunnel, Compose e Envoy: validações compartilhadas;
- documentação e testes automatizados da Fase 9.

`app.js`, `data.js`, migrations, banco, regras do RPG, Worker em `server/` e site
publicado não foram alterados. A habilidade Sites foi usada apenas para manter
esse limite; não houve build ou publicação.

## Riscos e pendências

- o computador, Docker, internet residencial e o Tunnel passam a fazer parte da
  disponibilidade do jogo;
- um token do Tunnel exposto deve ser revogado e rotacionado;
- SMTP incorreto impede confirmações de cadastro e recuperação futura de senha;
- alteração de domínio exige novo build/distribuição do cliente;
- DNS e a regra de origem no painel Cloudflare ainda precisam de validação real;
- o Tunnel permanente, cadastro por email, redirects e WebSocket no domínio
  definitivo ainda não foram testados;
- contas e sessões do Cloud não são transferidas por esta fase;
- nenhum corte definitivo deve ocorrer antes do teste com dois computadores.

## Rollback

`restore-local-domain.ps1` para o Tunnel, restaura as URLs locais e devolve os
próximos builds ao perfil Cloud sem apagar dados. A reversão do commit da fase
remove apenas scripts, configuração e documentação.

## Próxima etapa

A Fase 9 somente será concluída quando o usuário fornecer o nome de um domínio
sob seu controle e configurar localmente SMTP/token. Depois serão executados o
teste do Tunnel nomeado e os builds web/Tauri. A Fase 10 não foi iniciada.
