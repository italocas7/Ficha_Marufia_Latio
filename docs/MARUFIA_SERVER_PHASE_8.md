# Marufia Server — Fase 8: Cloudflare Tunnel

## Resultado

O acesso externo do Marufia Server foi preparado com Cloudflare Tunnel, sem
abrir portas no roteador e sem expor PostgreSQL. Um ensaio real pela internet
validou HTTPS, saúde do Auth e WebSocket do Supabase Realtime.

O modo permanente está implementado, mas deliberadamente não foi ativado: a
configuração do domínio, SMTP e URLs externas pertence à Fase 9. Nenhum token,
DNS ou recurso permanente foi criado numa conta Cloudflare nesta fase.

## Arquitetura de segurança

O `cloudflared` não se conecta diretamente ao gateway completo do Supabase. Ele
participa apenas de uma rede Docker exclusiva e alcança um Envoy intermediário,
que permite três famílias de rotas:

- Auth em `/auth/v1/*`;
- REST e RPC em `/rest/v1/*`;
- Realtime em `/realtime/v1/*`.

Todas as outras rotas retornam `404`. Studio, Storage, Meta, Analytics e
PostgreSQL permanecem privados. O container do Tunnel e os dois gateways não
publicam portas no Windows; PostgreSQL/Pooler continuam em `127.0.0.1`.

O ensaio Quick usa um segundo filtro ainda mais restrito: somente saúde do Auth
e Realtime. Cadastro e REST ficam bloqueados para que o ambiente local com
confirmação automática nunca seja publicado nem mesmo por alguns segundos.

## Imagens e execução

| Componente | Versão | Proteções principais |
|---|---|---|
| cloudflared | `2026.7.2` | sem auto-update, read-only, capabilities removidas, sem portas |
| Envoy público | `v1.39.0` | usuário não-root, read-only, lista positiva de rotas |

O token do Tunnel permanente fica em arquivo Docker Secret ignorado pelo Git e
é lido com `--token-file`. O comando de gravação oculta a entrada, valida o
formato e nunca mostra o segredo.

## Ensaio externo executado

O Quick Tunnel aleatório passou pelos seguintes controles:

| Verificação | Resultado |
|---|---|
| HTTPS externo | OK |
| `GET /auth/v1/health` | HTTP 200 |
| raiz/Studio | HTTP 404 |
| cadastro no Auth | HTTP 404 |
| REST de perfis | HTTP 404 |
| WebSocket Realtime | `SUBSCRIBED`, depois removido |
| portas dos containers do Tunnel | nenhuma |
| PostgreSQL e Pooler | privados/loopback |
| limpeza | endereço e containers temporários removidos |

O primeiro início revelou que o entrypoint do Envoy tentava ajustar
`stdout/stderr` sem capabilities. A correção foi executá-lo explicitamente como
o usuário interno não-root `101:101`; o ensaio seguinte passou. Nenhuma proteção
foi removida.

## Testes executados

| Verificação | Resultado |
|---|---|
| Compose dos perfis Quick e permanente | válido |
| gateway permanente dentro da rede Docker | saudável, raiz/Storage `404`, Auth encaminhado |
| Quick Tunnel real | HTTPS/Auth/Realtime aprovados; rotas privadas bloqueadas |
| schema self-hosted vazio | 8 tabelas, 13 policies, 15 RPCs, 11 gatilhos e 6 tabelas Realtime |
| ataques SQL locais | 35/35 aprovados com rollback |
| Auth local descartável | aprovado e limpo |
| RLS local pela API | aprovado e limpo |
| Realtime local | seis tabelas aprovadas e limpas após uma repetição transitória |
| testes Python | 12/12 aprovados |
| testes JavaScript | 390/390 aprovados |
| smoke test | desktop e celular aprovados |
| Auth Cloud | HTTP 200 |
| Realtime Cloud | canal conectado e removido |
| ataques SQL remotos | 35/35 aprovados com rollback |
| migrations Cloud | 26 locais e remotas alinhadas |

A Data API Cloud continua retornando `503/PGRST002`, condição preexistente desde
a Fase 0. Auth, Realtime e a conexão transacional remota continuam funcionando;
a falha não foi causada pela Fase 8.

## Arquivos e impacto

- `marufia-server/cloudflare/*`: composição, filtros de rota e instruções;
- `marufia-server/scripts/*tunnel.ps1`: token, início, parada, estado e ensaio;
- `tools/test_marufia_tunnel.cjs`: HTTPS/WebSocket ponta a ponta;
- `tests/js/marufia_server_tunnel.test.cjs`: garantias de segurança estáticas;
- `docs/SERVER_CLOUDFLARE_TUNNEL.md`: operação e diagnóstico;
- `docs/MARUFIA_SERVER_PHASE_8.md`: relatório da fase;
- `marufia-server/README.md`, scripts README, `.env.example`, `package.json` e
  `stop-server.ps1`: integração operacional.

`app.js`, `data.js`, migrations, banco, regras do RPG, Worker existente em
`server/` e site publicado permaneceram intactos. A habilidade Sites foi usada
apenas para preservar esse limite; não houve build nem publicação do site.

## Riscos remanescentes

- disponibilidade externa depende do PC, Docker, internet do Mestre e
  infraestrutura Cloudflare;
- um token vazado permite executar o conector e deve ser revogado/rotacionado;
- regras criadas incorretamente no painel podem contornar a origem documentada;
- WebSocket pode ser afetado por firewall de saída, antivírus ou instabilidade;
- SMTP, redirects, CORS e hostname definitivo ainda precisam da validação da
  Fase 9;
- Quick Tunnel não possui SLA e não representa a estabilidade de produção;
- atualização de cloudflared/Envoy exige novo teste e rollback disponível.

## Rollback

Execute `stop-tunnel.ps1` e reverta o commit único da Fase 8. O procedimento
remove somente containers sem estado e arquivos de configuração; volumes,
banco, Storage, segredos do Supabase e fallback Cloud permanecem preservados.

Não há rollback de dados porque nenhuma migration, conta ou linha foi criada.
O ensaio temporário já foi removido.

## Próxima etapa

A próxima fase é a Fase 9 — configuração de domínio. Ela deverá criar o hostname
controlado pelo Mestre, alinhar URLs/redirects/SMTP, testar o Tunnel permanente e
manter a troca configurável entre Cloud e self-hosted. Ela não foi iniciada.
