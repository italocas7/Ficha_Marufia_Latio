# Marufia Server — Fase 3: Supabase Self-Hosted

## Resultado

A infraestrutura experimental foi baseada na distribuição Docker oficial do
Supabase `self-hosted/v0.8.0`, resolvida no commit
`241bb11c0627f2981746d37033f57dbfa81d29b0`. As imagens estão fixadas e foram
selecionadas como conjunto compatível; nenhuma usa `latest`.

O Supabase Cloud, o site, o Worker e o aplicativo não foram alterados. Nenhum
schema, dado ou usuário foi migrado.

## Arquitetura preparada

```text
Aplicativo (futuro ambiente self-hosted)
                 |
                 v
        127.0.0.1:8000
          Envoy gateway
       /      |       \
    Auth     REST    Realtime/Storage
       \      |       /
           PostgreSQL
              |
       arquivos persistentes
```

O gateway é o único ponto destinado ao futuro Cloudflare Tunnel. Supavisor expõe
as portas `5432` e `6543` apenas no loopback para administração local. Nenhuma
porta do banco é publicada em todas as interfaces.

## Componentes e versões

| Componente | Imagem fixada |
|---|---|
| PostgreSQL | `supabase/postgres:17.6.1.136` |
| Auth | `supabase/gotrue:v2.189.0` |
| REST | `postgrest/postgrest:v14.12` |
| Realtime | `supabase/realtime:v2.102.3` |
| Storage | `supabase/storage-api:v1.60.4` |
| Studio | `supabase/studio:2026.08.03-sha-022b374` |
| Gateway | `envoyproxy/envoy:v1.39.0` |
| Supavisor | `supabase/supavisor:2.9.5` |
| Postgres Meta | `supabase/postgres-meta:v0.96.6` |
| Imgproxy | `darthsim/imgproxy:v3.30.1` |
| Edge Runtime | `supabase/edge-runtime:v1.74.0` (desativado por padrão) |

## Origem e integridade

O Compose oficial e 21 arquivos auxiliares foram incorporados sem edição.
`marufia-server/supabase/SHA256SUMS` registra o SHA-256 de cada um. Alterações
específicas ficam em `docker-compose.marufia.yml`, usando o operador `!override`
do Compose para substituir completamente as portas originais.

Essa decisão exige Docker Compose `2.24.4` ou superior. Os scripts recusam versões
mais antigas antes de iniciar qualquer container.

## Configuração e chaves

O modelo versionado contém somente placeholders para segredos. O preparo local:

- gera senha do PostgreSQL e do Studio;
- gera JWT simétrico HS256 para compatibilidade;
- gera par EC P-256 e JWTs ES256 conforme o fluxo atual do Supabase;
- gera chaves públicas/opacas e administrativas separadas;
- gera chaves de criptografia do Realtime, Supavisor, Studio e Storage;
- grava tudo atomicamente em `.env`, ignorado pelo Git;
- não mostra chaves na saída e não sobrescreve uma configuração existente.

Auth usa confirmação automática somente neste ambiente experimental, pois SMTP e
migração de contas serão validados na Fase 5. Usuários anônimos e login por
telefone ficam desativados. Edge Functions também ficam desativadas porque a
auditoria comprovou que o aplicativo não as utiliza.

## Persistência e rollback

PostgreSQL usa `supabase/docker/volumes/db/data/`, Storage usa
`supabase/docker/volumes/storage/` e a configuração criptográfica do banco usa um
volume nomeado. Esses dados são ignorados pelo Git. Os scripts de parada e
reinício não removem volumes.

O rollback do código é a reversão do commit da Fase 3 e do commit complementar de
validação. Reverter o Git não apaga dados já criados pelo runtime. A parada normal
usa `docker compose down` sem `-v`; remoção dos diretórios persistentes ou do
volume nomeado exigirá uma ação futura, explícita e precedida de backup.

## Validação local concluída

Foram validados estaticamente o Compose, hashes, imagens fixadas, bindings de
loopback, placeholders, scripts e geração de chaves. Um `.env` local foi gerado e
suas assinaturas HS256/ES256 foram verificadas sem expor valores. O segundo preparo
foi recusado, confirmando a proteção contra sobrescrita.

O ambiente Windows foi preparado e reiniciado. A validação usou:

| Componente local | Versão |
|---|---|
| WSL | `2.7.12` |
| Kernel WSL | `6.18.33.2-2` |
| Docker Desktop | `4.88.1` |
| Docker Engine | `29.7.2` |
| Docker Compose | `5.4.0` |

`docker compose config --quiet` aprovou a combinação do Compose oficial com o
override do Marufia. As dez imagens foram baixadas e todos os containers ficaram
`healthy`. Os testes funcionais locais produziram:

| Verificação | Resultado |
|---|---|
| PostgreSQL `pg_isready` | aceitando conexões |
| Auth health e settings pelo gateway | HTTP 200 |
| REST OpenAPI com credencial administrativa local | HTTP 200 |
| REST com chave pública e tabela inexistente | HTTP 404 esperado do PostgREST |
| Storage health | HTTP 200 |
| Realtime WebSocket com chave pública | conexão aberta |
| Studio com autenticação básica e redirecionamento | HTTP 200 final |

O gateway foi publicado somente em `127.0.0.1:8000`. Supavisor ficou somente em
`127.0.0.1:5432` e `127.0.0.1:6543`; o container PostgreSQL não publicou porta no
host. O ciclo `stop-server.ps1` seguido de `start-server.ps1` foi aprovado e o
volume persistente permaneceu presente. O script também foi adaptado para achar
instalações oficiais por usuário mesmo quando `docker.exe` não está no `PATH`.

Uma amostra após a estabilização registrou aproximadamente 1,0 GB de RAM e 5,5%
de CPU somados entre os containers. É uma medição momentânea, não um limite de
pico. Os 7,7 GB exibidos pelo Docker são o máximo disponível à máquina virtual,
não memória permanentemente consumida. Para liberar os recursos quando o servidor
não for necessário, use o script de parada.

Passaram 12 testes Python, 373 testes JavaScript e o smoke test em desktop e
celular. A verificação remota somente leitura confirmou o Realtime Cloud
conectado. A Data API Cloud continua retornando `503/PGRST002`, o mesmo estado
pré-existente registrado desde a Fase 0; nenhum teste desta fase o provocou.

O Supabase Cloud, o site e o Worker não foram alterados. O banco self-hosted
ainda não contém schema, dados ou contas do Marufia; essa separação é intencional
e a Fase 4 só poderá iniciar após este fechamento documental.

## Referências oficiais

- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Merge do Docker Compose e `!override`](https://docs.docker.com/reference/compose-file/merge/)
