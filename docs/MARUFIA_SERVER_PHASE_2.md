# Marufia Server — Fase 2: área de infraestrutura

## Decisão

A infraestrutura ficará em `marufia-server/`. A pasta existente `server/` permanece reservada ao Worker do site e não será reutilizada para Docker ou Supabase.

Esta fase cria estrutura, proteção de arquivos e responsabilidades. Ela não instala dependências, não cria containers e não altera o Supabase Cloud.

## Responsabilidades

| Local | Responsabilidade | Versionado |
|---|---|---|
| `marufia-server/supabase/` | configuração self-hosted e migrations futuras | somente arquivos sem segredos |
| `marufia-server/cloudflare/` | modelos futuros do Tunnel | nunca credenciais ou tokens |
| `marufia-server/scripts/` | operação segura no Windows | scripts revisados e testados |
| `marufia-server/backups/` | dumps locais do PostgreSQL | não |
| `marufia-server/logs/` | diagnóstico operacional | não |
| `marufia-server/storage/` | objetos enviados pelos usuários | não |

O `.gitignore` local também protege `.env`, volumes, dados temporários e credenciais comuns do Cloudflare Tunnel. O `.env.example` contém somente valores públicos e retenção de backup; as variáveis oficiais e secretas serão introduzidas na Fase 3 após a escolha da versão self-hosted.

## Limite da fase

`docker-compose.yml`, imagens do Supabase, scripts PowerShell executáveis e health checks ainda não existem. Criar placeholders que aparentassem iniciar ou proteger um servidor seria inseguro. Esses itens serão adicionados juntos na Fase 3 e precisarão falhar claramente quando Docker ou configuração estiverem ausentes.

O site existente não sofreu alteração, e nenhuma publicação externa foi realizada.

## Rollback

O rollback é a reversão do único commit documental e estrutural desta fase. Não existe rollback de banco ou dados porque nenhum serviço ou dado foi criado.
