# Marufia Server — Fase 9: configuração de domínio

## Resultado

A configuração de domínio passou a ser segura, reversível e independente de um
endereço específico. A automação alinha Supabase, Auth, redirects, CORS,
Cloudflare Tunnel e o perfil público usado pelos builds web/Tauri.

A fase foi concluída com o hostname `api.marufiarpg.org`, um Tunnel nomeado da
Cloudflare e SMTP da Resend. Os segredos permanecem somente em arquivos locais
ignorados pelo Git. O Supabase Cloud continua disponível no perfil versionado
de fallback e o site usado pelos jogadores ainda não foi republicado; a troca
definitiva será feita somente após a validação da Fase 13.

## Ativação real

- domínio: `marufiarpg.org`, ativo e administrado pela Cloudflare;
- API pública: `https://api.marufiarpg.org`;
- rota do Tunnel: `http://marufia-public-gateway:8080`;
- e-mail: domínio verificado na Resend com DKIM, SPF e DMARC publicados;
- remetente do Auth: `noreply@marufiarpg.org`;
- cliente local: perfil `selfhosted/production` selecionado em `.env.local`;
- fallback: perfil Cloud preservado em `config/public-backends/cloud.env`.

O token do Tunnel, a credencial SMTP e a chave pública selecionada para o build
ficam em arquivos locais ignorados. Nenhum segredo foi adicionado ao código, à
documentação ou ao histórico do Git.

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
- o retorno do Auth usa uma página isolada no hostname da API e não reutiliza a
  ficha hospedada;
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
| Tunnel nomeado | HTTPS, Auth, rotas privadas bloqueadas e WebSocket Realtime aprovados |
| DNS do e-mail | DKIM, SPF e DMARC publicados e domínio aprovado pela Resend |
| SMTP direto | mensagem entregue no endereço de teste oficial da Resend |
| cadastro pelo Auth público | HTTP 200 e mensagem de confirmação entregue |
| retorno da confirmação | HTTP 200 em `/auth-confirmed`; link antigo também deixa de abrir a ficha hospedada |
| build web self-hosted | pacote `selfhosted/production` gerado e validado |
| build desktop self-hosted | executável Tauri de release gerado |
| integridade Windows | executável e instalador com hashes válidos; Alpha sem assinatura |
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

O teste agregado de prontidão Tauri chegou ao passo "Site publicado" e parou.
Esse teste compara o backend selecionado localmente com a versão pública, mas o
site dos jogadores continua intencionalmente no Cloud. As etapas locais de
build e smoke test passaram separadamente. A publicação self-hosted fica para o
ensaio controlado com dois computadores, evitando um corte antecipado.

## Riscos e pendências

- o computador, Docker, internet residencial e o Tunnel passam a fazer parte da
  disponibilidade do jogo;
- um token do Tunnel exposto deve ser revogado e rotacionado;
- indisponibilidade futura da Resend impede novas confirmações enquanto durar;
- alteração de domínio exige novo build/distribuição do cliente;
- a confirmação por clique real foi validada; cada link continua sendo de uso
  único e o usuário deve abrir somente o email mais recente;
- o site e o instalador self-hosted ainda não foram distribuídos aos jogadores;
- contas e sessões do Cloud não são transferidas por esta fase;
- nenhum corte definitivo deve ocorrer antes do teste com dois computadores.

## Rollback

`restore-local-domain.ps1` para o Tunnel, restaura as URLs locais e devolve os
próximos builds ao perfil Cloud sem apagar dados. A reversão do commit da fase
remove apenas scripts, configuração e documentação.

## Próxima etapa

A Fase 9 está concluída. A próxima etapa é a Fase 10, que ampliará o modo offline
existente sem substituir a fila, `revision` e `updated_at` já utilizados. Ela
não foi iniciada por este commit. A distribuição pública e o corte do Cloud
continuam condicionados ao ensaio da Fase 13.
