# Cloudflare Tunnel do Marufia Server

Este documento explica como o acesso externo foi preparado, quais serviços são
públicos e como operar o Tunnel sem expor o banco de dados.

## O que ficou pronto na Fase 8

O Marufia Server possui uma camada pública separada, endurecida e sem portas de
entrada no Windows. O `cloudflared` abre conexões de saída para a Cloudflare e
encaminha somente tráfego HTTPS/WebSocket até um filtro Envoy.

```text
Aplicativo do Jogador
        |
        | HTTPS / WebSocket
        v
Cloudflare
        |
        | Tunnel iniciado pelo PC do Mestre
        v
cloudflared -- sem portas publicadas
        |
        | rede Docker exclusiva
        v
gateway público Marufia
        |
        +-- Auth       /auth/v1/*
        +-- REST/RPC   /rest/v1/*
        `-- Realtime   /realtime/v1/*
                |
                v
         gateway Supabase

PostgreSQL / pooler -- somente 127.0.0.1
Studio, Storage e Meta -- não publicados
```

Cloudflare não alcança o banco, o Studio ou os demais containers diretamente.
Mesmo no computador, as portas `5432` e `6543` permanecem vinculadas a
`127.0.0.1`. Não crie regra de roteador, encaminhamento ou hostname para essas
portas.

## Rotas públicas

| Caminho | Permanente | Ensaio temporário | Motivo |
|---|---:|---:|---|
| `/auth/v1/*` | sim | somente `GET /health` | contas e sessões |
| `/rest/v1/*` | sim | não | tabelas e RPCs protegidas por RLS |
| `/realtime/v1/*` | sim | sim | WebSocket de ficha e rolagens |
| `/storage/v1/*` | não | não | Storage não é usado atualmente |
| `/` / Studio | não | não | administração deve ficar local |
| PostgreSQL/Pooler | não | não | nunca devem ser publicados |

O filtro de caminhos reduz a superfície pública, mas não substitui Auth, grants
ou RLS. As regras validadas nas Fases 5–7 continuam sendo a proteção dos dados.

## Teste pela internet sem domínio

Com o Marufia Server local iniciado e o banco experimental vazio:

```powershell
.\marufia-server\scripts\test-tunnel.ps1 -Mode Quick
```

O comando:

1. confirma que PostgreSQL/Pooler permanecem em loopback;
2. cria um endereço `trycloudflare.com` temporário;
3. testa HTTPS e a saúde do Auth;
4. comprova que raiz, cadastro e REST estão bloqueados;
5. abre e fecha um canal WebSocket do Realtime;
6. confirma que os containers do ensaio não publicam portas;
7. remove automaticamente endereço e containers temporários.

O ensaio não cria conta, não consulta tabelas e não altera dados. Quick Tunnel é
apenas um recurso de desenvolvimento da Cloudflare, sem SLA e com endereço
aleatório; nunca deve ser entregue aos jogadores.

## Ativação permanente — somente após a Fase 9

Antes de executar `start-tunnel.ps1`, será necessário:

- uma conta Cloudflare e um domínio controlado pelo Mestre;
- um hostname, por exemplo `api.seudominio.com`;
- Tunnel gerenciado remotamente apontando para
  `http://marufia-public-gateway:8080`;
- token salvo em `cloudflare/tunnel-token.token` pelo comando seguro;
- URLs públicas alinhadas no `.env`;
- confirmação automática de email desativada e SMTP real configurado.

O início permanente recusa domínio reservado, Quick Tunnel, HTTP, URLs
divergentes, token ausente, confirmação automática externa ou SMTP de teste.

```powershell
.\marufia-server\scripts\set-tunnel-token.ps1
.\marufia-server\scripts\start-tunnel.ps1
.\marufia-server\scripts\status-tunnel.ps1
.\marufia-server\scripts\stop-tunnel.ps1
```

Não cole o token em argumentos, `.env`, documentação ou conversa. Se preferir
ler de um arquivo temporário privado, use `-TokenFile`; depois elimine esse
arquivo de forma segura.

## Diagnóstico

| Sintoma | Verificação segura |
|---|---|
| Tunnel não inicia | Docker ativo, token salvo, hostname e URLs no `.env` |
| erro de Auth externo | `API_EXTERNAL_URL`, confirmação de email e SMTP |
| REST responde `401/403` | sessão do cliente e RLS; não use chave administrativa |
| Realtime não conecta | hostname, WebSocket e saúde de `realtime`/gateway |
| `404` no Studio/Storage | comportamento esperado desta configuração |
| Tunnel parado após `stop-server.ps1` | comportamento esperado; o servidor encerra o conector |

`status-tunnel.ps1` mostra somente nome e saúde dos containers. Ele não imprime
token, chave pública, sessão ou credenciais.

## Atualização e rollback

O cloudflared está fixado em `2026.7.2`. Antes de atualizar:

1. consulte as notas oficiais;
2. fixe a nova versão, sem usar `latest`;
3. execute o ensaio Quick;
4. valide o Tunnel permanente;
5. mantenha o commit anterior disponível para rollback.

Para rollback operacional da Fase 8, execute `stop-tunnel.ps1` e reverta o commit
da fase. Isso não remove banco, Storage, volumes ou `.env`. Nenhum recurso
permanente foi criado na conta Cloudflare durante esta fase.

## Referências oficiais

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [Configuração e regra final de ingress](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/)
- [Quick Tunnels e limitações](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)
- [Parâmetros e token por arquivo](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/run-parameters/)
- [Requisitos de firewall de saída](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/tunnel-with-firewall/)
