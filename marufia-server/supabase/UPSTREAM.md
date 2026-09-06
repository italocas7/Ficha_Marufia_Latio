# Distribuicao oficial incorporada

Os arquivos em `supabase/docker/` foram copiados sem alteracao da distribuicao
Docker oficial do Supabase:

- release: `self-hosted/v0.8.0`;
- commit resolvido: `241bb11c0627f2981746d37033f57dbfa81d29b0`;
- origem: <https://github.com/supabase/supabase/tree/self-hosted/v0.8.0/docker>;
- incorporado em: 30/08/2026.

Somente o `docker-compose.yml` base e seus arquivos de runtime em `volumes/`
foram incorporados. O `.env.example` oficial contém credenciais demonstrativas
inseguras e foi substituído pelo modelo seguro na raiz de `marufia-server/`.

## Imagens fixadas pela release

| Servico | Imagem |
|---|---|
| Studio | `supabase/studio:2026.08.03-sha-022b374` |
| Gateway | `envoyproxy/envoy:v1.39.0` |
| Auth | `supabase/gotrue:v2.189.0` |
| REST | `postgrest/postgrest:v14.12` |
| Realtime | `supabase/realtime:v2.102.3` |
| Storage | `supabase/storage-api:v1.60.4` |
| Image proxy | `darthsim/imgproxy:v3.30.1` |
| Metadata | `supabase/postgres-meta:v0.96.6` |
| Edge Functions | `supabase/edge-runtime:v1.74.0` |
| PostgreSQL | `supabase/postgres:17.6.1.136` |
| Pooler | `supabase/supavisor:2.9.5` |

Não atualize imagens isoladamente sem uma causa documentada, backup, teste e
possibilidade de rollback. A única exceção ativa está descrita abaixo.

## Exceção operacional do Marufia

O Compose oficial permanece fixado em `postgrest/postgrest:v14.12`, mas a camada
`docker-compose.marufia.yml` substitui somente o serviço REST por
`postgrest/postgrest:v16.1`. A versão anterior repetia indefinidamente
transações que retornavam `40001`, código usado pelo controle de revisão das
fichas. PostgREST 16 removeu essa repetição automática. A alteração foi feita
após backup e mantém o rollback disponível pela remoção da substituição.

Referências oficiais: [PostgREST #3673](https://github.com/PostgREST/postgrest/issues/3673)
e [changelog da versão 16](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md#160---2026-08-07).

## Endurecimento do Marufia

O arquivo oficial permanece intacto. `docker-compose.marufia.yml` adiciona chaves
de autenticação assimétricas, desativa Edge Functions por padrão e substitui as
portas publicadas por bindings em `127.0.0.1`. Portanto, nem PostgreSQL nem o
gateway escutam diretamente na rede local ou na internet. O futuro Cloudflare
Tunnel acessará somente o gateway local.
