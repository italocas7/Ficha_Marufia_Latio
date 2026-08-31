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

Como nenhum container iniciou nesta máquina, o rollback do código é a reversão do
commit da Fase 3. Em uma máquina que já tenha iniciado o ambiente, reverter o Git
não apaga os dados; remoção desses dados exigirá uma ação futura, explícita e
precedida de backup.

## Validação e bloqueio local

Foram validados estaticamente o Compose, hashes, imagens fixadas, bindings de
loopback, placeholders, scripts e geração de chaves. Um `.env` local foi gerado e
suas assinaturas HS256/ES256 foram verificadas sem expor valores. O segundo preparo
foi recusado, confirmando a proteção contra sobrescrita.

Também passaram 12 testes Python, 372 testes JavaScript e o smoke test
desktop/mobile. Uma consulta somente leitura ao Supabase Cloud confirmou o
Realtime conectado; a Data API continua retornando `503/PGRST002`, o mesmo estado
pré-existente observado na Fase 0. Nenhuma configuração do Cloud foi alterada.

Esta máquina tem espaço em disco suficiente, porém não possui Docker Desktop nem
WSL. Por isso não foi possível:

- baixar e inspecionar as imagens;
- executar `docker compose config`;
- iniciar PostgreSQL/Auth/REST/Realtime/Storage/Studio;
- executar health checks reais.

A instalação do Docker Desktop é uma alteração administrativa do Windows e pode
exigir reinicialização. A Fase 3 permanece parcial até esses testes reais passarem.
Não se deve iniciar a migração de schema da Fase 4 antes disso.

## Referências oficiais

- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Merge do Docker Compose e `!override`](https://docs.docker.com/reference/compose-file/merge/)
