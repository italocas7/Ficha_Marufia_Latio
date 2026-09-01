# Marufia Server — Fase 7: Realtime

## Resultado

O Supabase Realtime self-hosted foi validado ponta a ponta com três usuários
autenticados e as seis tabelas publicadas pelo Marufia. Alterações de ficha,
rolagens, histórico, presença, sessões e campanha chegaram somente aos clientes
autorizados.

Não foi necessário alterar configuração, migrations, policies ou código do
aplicativo. A investigação inicial identificou um evento anterior ainda pendente
no log lógico; as revisões `2`, `3` e `4` chegaram em ordem, provando que não se
tratava de perda ou duplicação. O teste final usa uma revisão-barreira criada
após `SUBSCRIBED` para separar eventos anteriores das medições.

## Cenário validado

```text
Jogador salva a ficha
        |
        +--> Jogador recebe a nova revisão
        |
        `--> Mestre da campanha recebe a nova revisão

Mestre altera PV por RPC
        |
        +--> Jogador recebe a nova revisão
        `--> Mestre recebe a nova revisão

Jogador rola / fica presente
        |
        `--> Mestre recebe rolagem, histórico e presença

Usuário de outra campanha
        `--> zero eventos da campanha testada
```

Também foram recebidas a abertura de sessão e a atualização dos dados da
campanha. As inscrições foram encerradas e o banco experimental voltou ao estado
vazio no final.

## Cobertura das seis tabelas

| Tabela | Mudança produzida | Resultado |
|---|---|---|
| `characters` | salvamento do Jogador e PV alterado pelo Mestre | duas revisões em ordem, sem duplicação |
| `rolls` | rolagem secreta do Jogador | uma entrega ao Mestre autorizado |
| `campaign_events` | dois eventos de PV e um de rolagem | três IDs únicos |
| `campaign_presence` | batimento do Jogador | uma entrega ao Mestre |
| `campaign_sessions` | sessão iniciada pelo Mestre | uma entrega |
| `campaigns` | nome/descrição atualizados pelo Mestre | uma entrega |

O usuário externo manteve canais com os mesmos filtros da Campanha A e recebeu
zero evento. Isso confirma a combinação de filtros Realtime com as policies RLS;
o filtro, isoladamente, não é considerado segurança.

## Ciclo de vida do cliente

A auditoria do código confirmou que:

- a sincronização de personagem mantém somente um canal ativo;
- uma geração invalida callbacks antigos durante trocas de sessão/ficha;
- canais anteriores são removidos antes da substituição;
- painel do Mestre e rolagens ao vivo removem canais em `unsubscribe`/`destroy`;
- o teste ponta a ponta encerra três clientes e confirma contagens `1 -> 0`.

As suítes JavaScript existentes continuam cobrindo construção de filtros,
payloads inválidos, desmontagem de telas, reconexão e simulação multiusuário.

## Testes executados

| Verificação | Resultado |
|---|---|
| schema self-hosted | 8 tabelas, 13 policies, 15 RPCs, 11 gatilhos e 6 tabelas Realtime |
| Auth local descartável | cadastro, login, logout, refresh, ES256 e papéis aprovados |
| RLS local pela API | isolamento Mestre/Jogador/externo aprovado |
| Realtime local ponta a ponta | 6 tabelas, 3 clientes, sem duplicação ou vazamento |
| ataques SQL locais | 35/35 aprovados com rollback |
| testes Python | 12/12 aprovados |
| testes JavaScript | 383/383 aprovados |
| smoke test | desktop e celular aprovados |
| Auth Cloud | HTTP 200 com chave pública |
| Realtime Cloud | canal conectado e removido |
| ataques SQL remotos | 35/35 aprovados com rollback |
| migrations Cloud | 26 locais e remotas alinhadas |

A Data API Cloud continua retornando `503/PGRST002`, condição preexistente desde
a Fase 0. Auth, conexão direta transacional e Realtime Cloud continuam
funcionando, portanto a falha não foi causada pela Fase 7.

## Segurança e limpeza

O novo teste:

- aceita somente `localhost`, `127.0.0.1` ou loopback IPv6;
- exige confirmação automática apenas no ambiente experimental;
- exige o banco completamente vazio;
- usa três emails aleatórios no domínio reservado `.invalid`;
- usa apenas a chave pública adequada ao cliente;
- não imprime senha, access token, refresh token ou chaves;
- remove usuários por email exato e confirma zero linhas restantes.

Nenhuma conta ou dado do Supabase Cloud foi alterado.

## Arquivos e impacto

- `marufia-server/scripts/test-realtime.ps1`: proteção, execução e limpeza do
  ensaio local;
- `tools/test_marufia_server_realtime.cjs`: cenário WebSocket ponta a ponta;
- `tests/js/marufia_server_realtime.test.cjs`: garantias estáticas do teste;
- `docs/SERVER_REALTIME.md`: procedimento operacional e cuidados futuros;
- `docs/MARUFIA_SERVER_PHASE_7.md`: relatório técnico da fase;
- `marufia-server/README.md` e `package.json`: comandos e estado atualizados.

`app.js`, `data.js`, migrations, regras do RPG, interface, Worker `server/` e site
publicado permaneceram intactos. A habilidade Sites confirmou esse limite; não
houve build nem publicação porque esta fase é exclusivamente do servidor local.

## Riscos remanescentes

- o teste externo de WebSocket pelo Cloudflare Tunnel pertence à Fase 8;
- desconexões prolongadas exigem recarga e a estratégia offline da Fase 10;
- um evento anterior pode ainda estar no log ao abrir uma inscrição; revisão e
  recarga do estado atual devem continuar sendo a fonte de verdade;
- alterações em RLS, publication, replica identity ou JWT podem impedir entrega;
- muitas subscriptions de `Postgres Changes` aumentam o custo de autorização no
  banco; o teste de vários clientes permanece para a Fase 13;
- atualizar a imagem Realtime sem repetir esta suíte pode introduzir regressão.

## Rollback

O rollback é a reversão do commit único da Fase 7. Isso remove somente teste,
documentação e atalhos de execução. Nenhum dado, volume, schema ou segredo
precisa ser restaurado.

O Supabase Cloud permanece como backend padrão e fallback intacto.

## Referências

- [Supabase — Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase — Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase — Self-hosted Realtime](https://supabase.com/docs/reference/self-hosting-realtime)

## Próxima etapa

A próxima fase é a Fase 8 — Cloudflare Tunnel. Ela deverá publicar somente o
gateway necessário por HTTPS/WebSocket, manter PostgreSQL privado e testar o
acesso pela internet sem iniciar ainda a migração definitiva do Cloud.
