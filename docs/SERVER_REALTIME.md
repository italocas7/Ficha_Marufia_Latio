# Realtime do Marufia Server

Este documento descreve como o Marufia recebe mudanças do banco imediatamente,
como testar o serviço local e quais cuidados preservar em alterações futuras.

## Fluxo validado

```text
Jogador ou Mestre
       |
       | operação autenticada pela API/RPC
       v
PostgreSQL + RLS
       |
       | publicação supabase_realtime
       v
Supabase Realtime
       |
       | WebSocket autenticado e filtrado
       v
clientes autorizados da campanha
```

O cliente continua usando `Postgres Changes` do SDK Supabase. Não foi criado um
protocolo paralelo nem um backend exclusivo para encaminhar eventos.

## Tabelas publicadas

| Tabela | Evento usado pelo cliente | Destinatário principal |
|---|---|---|
| `characters` | `UPDATE` | proprietário e Mestre da campanha |
| `rolls` | `INSERT` | participantes autorizados conforme visibilidade |
| `campaign_events` | `INSERT` | Mestre da campanha |
| `campaign_presence` | `INSERT`/`UPDATE` | Mestre da campanha |
| `campaign_sessions` | mudanças da sessão | Mestre da campanha |
| `campaigns` | `UPDATE` | membros da campanha |

Os filtros por `id` e `campaign_id` reduzem eventos desnecessários, mas não são
uma barreira de segurança. Cada entrega continua dependendo dos grants e das
policies RLS validadas na Fase 6.

`campaign_presence` é uma tabela do Marufia transmitida por `Postgres Changes`.
Ela não depende do produto separado Supabase Presence.

## Componentes reaproveitados

- `src/online/character_realtime.js`: canal filtrado de ficha e campanha;
- `src/online/character_sync.js`: mantém somente uma inscrição ativa e ignora
  callbacks antigos por geração;
- `src/online/live_rolls.js`: rolagens filtradas pela campanha;
- `src/online/gm_panel.js`: personagens, presença, histórico, sessões e campanha;
- `revision`, `updated_at` e a fila existente: evitam aceitar estado antigo como
  se fosse uma alteração nova.

Todos esses módulos já removem seus canais ao trocar usuário, ficha, campanha ou
ao destruir a tela. A Fase 7 não precisou modificar o aplicativo.

## Teste local ponta a ponta

Com o servidor experimental iniciado e o banco vazio:

```powershell
.\marufia-server\scripts\test-realtime.ps1
```

O teste cria três contas descartáveis: Mestre, Jogador e usuário externo. Em
seguida ele confirma:

1. os três WebSockets chegam a `SUBSCRIBED`;
2. uma alteração do Jogador aparece para ele e para o Mestre;
3. uma alteração de PV feita pelo Mestre aparece em ambos;
4. rolagem, histórico, presença, sessão e campanha chegam ao Mestre;
5. o usuário externo recebe zero evento da campanha testada;
6. nenhum evento medido chega duplicado;
7. todos os canais são removidos e o banco volta a zero linhas.

O comando recusa endereço externo, confirmação manual de email ou banco com
dados. Ele nunca usa `service_role` e não mostra senhas ou tokens.

### Por que existe uma barreira inicial

O log lógico pode conter uma alteração já confirmada no banco, mas ainda não
processada pelo Realtime no instante em que um canal é aberto. Isso não é uma
duplicação: é um evento anterior ainda pendente.

O teste produz uma revisão conhecida depois de `SUBSCRIBED`, espera essa revisão
chegar e só então zera as contagens descartáveis. Como o log mantém ordem, as
medições seguintes começam depois de todo evento anterior. O aplicativo mantém
o controle por `revision` e recarrega a versão atual, portanto não deve aplicar
estado antigo cegamente.

## Regras para mudanças futuras

- publique somente tabelas com RLS e grants já testados;
- filtre canais pelo menor escopo possível (`id` ou `campaign_id`);
- mantenha uma referência explícita para cada canal ativo;
- remova o canal antes de criar seu substituto;
- descarte callbacks de uma geração anterior após troca de sessão ou ficha;
- trate reconexão como possibilidade de recarregar o estado atual;
- deduplique efeitos visuais por ID/revisão quando repetir uma notificação puder
  causar ação ao usuário;
- nunca inclua token, chave administrativa ou senha em logs de WebSocket;
- repita este teste após atualizar Realtime, PostgreSQL, JWT/JWKS ou policies.

## Diagnóstico

Se o canal não alcançar `SUBSCRIBED`, verifique Auth/JWT, gateway e o estado do
container Realtime. Se conectar mas não receber mudanças, confira publicação,
slot de replicação, policies de leitura e o filtro informado.

O serviço pode estar saudável e ainda haver um evento em trânsito. Compare a
revisão recebida antes de classificar o caso como duplicação.

Na Fase 8, o Cloudflare Tunnel deverá encaminhar WebSocket somente ao gateway em
`127.0.0.1:8000`. PostgreSQL e seu slot de replicação permanecerão privados.

## Referências

- [Supabase — Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase — Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase — Self-hosted Realtime](https://supabase.com/docs/reference/self-hosting-realtime)
