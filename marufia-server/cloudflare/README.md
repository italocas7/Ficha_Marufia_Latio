# Cloudflare Tunnel

Esta pasta contém a camada pública restrita do Marufia Server. Ela não substitui
o gateway do Supabase: filtra quais caminhos podem chegar até ele.

## Caminho de produção

```text
Internet HTTPS/WSS
        |
        v
Cloudflare Tunnel (somente conexão de saída)
        |
        v
marufia-public-gateway:8080
        |
        +-- /auth/v1/*
        +-- /rest/v1/*
        `-- /realtime/v1/*
                |
                v
        gateway interno Supabase
```

O gateway público devolve `404` para raiz, Studio, Storage, metadados e qualquer
outro caminho. Storage não é usado pelo aplicativo atual e deverá passar por
revisão antes de uma publicação futura.

O container `cloudflared` participa somente da rede `marufia-server-tunnel`.
PostgreSQL não participa dessa rede. Nenhum serviço desta camada possui `ports`,
e a conexão com a Cloudflare é iniciada de dentro para fora.

## Arquivos

- `docker-compose.tunnel.yml`: Envoy e cloudflared isolados;
- `public-gateway-envoy.yaml`: lista de rotas permitidas em produção;
- `smoke-gateway-envoy.yaml`: filtro ainda menor para o ensaio temporário;
- `tunnel-token.token`: segredo local ignorado pelo Git, criado apenas pelo
  comando seguro.

As imagens estão fixadas em `envoyproxy/envoy:v1.39.0` e
`cloudflare/cloudflared:2026.7.2`. Não use `latest`.

## Configuração futura no painel Cloudflare

Na Fase 9, crie um Tunnel gerenciado remotamente e um hostname público HTTPS. O
serviço/origem do hostname deve ser exatamente:

```text
http://marufia-public-gateway:8080
```

Não aponte para `localhost`, `api-gw`, porta `5432`, Studio ou PostgreSQL. Salve
o token sem mostrá-lo na tela com:

```powershell
.\marufia-server\scripts\set-tunnel-token.ps1
```

Para rotacionar um token comprometido, gere outro no painel e execute:

```powershell
.\marufia-server\scripts\set-tunnel-token.ps1 -Replace
.\marufia-server\scripts\stop-tunnel.ps1
.\marufia-server\scripts\start-tunnel.ps1
```

Nunca envie o token por conversa, log ou commit. O token dá autoridade para
executar o conector e deve ser revogado no painel se houver suspeita de exposição.

## Ensaio temporário

`test-tunnel.ps1` usa um Quick Tunnel aleatório apenas para validar HTTPS e
WebSocket. Nesse ensaio, somente `GET /auth/v1/health` e Realtime são liberados;
cadastro e REST são bloqueados. O endereço e os containers são removidos ao fim.

Quick Tunnel não é ambiente de produção: não possui SLA, usa endereço aleatório
e tem limites próprios. Não o use para jogadores.

Consulte `docs/SERVER_CLOUDFLARE_TUNNEL.md` antes de ativar o modo permanente.
