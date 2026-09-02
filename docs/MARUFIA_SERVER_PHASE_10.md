# Marufia Server — Fase 10: modo offline e conflitos

## Resultado

A Fase 10 ampliou o comportamento local já existente sem criar uma segunda
fonte de verdade. A ficha continua sendo gravada primeiro no computador; a fila
online apenas transporta a versão local validada quando o servidor pode ser
alcançado.

O aplicativo agora diferencia três situações:

- **Offline:** o próprio computador está sem conexão;
- **Servidor indisponível:** existe internet, mas o Marufia Server não responde;
- **Erro de sincronização:** ocorreu uma falha não classificada como queda de
  conexão e que precisa de atenção.

Quando o servidor fica indisponível, o aplicativo informa que os dados locais
continuam acessíveis e tenta sincronizar novamente sem exigir outra edição do
usuário.

## Fluxo preservado

```text
alteração na ficha
        |
        v
salvamento local imediato
        |
        v
fila persistente da ficha
        |
        +-- servidor disponível --> revisão validada --> sincronizado
        |
        `-- servidor indisponível --> aguarda --> tenta novamente
```

Rolagens usam uma fila persistente separada. Cada rolagem mantém seu UUID, ordem
e visibilidade solicitada, de modo que uma repetição de envio não crie outro
resultado lógico.

## Reconexão automática

As tentativas usam esperas progressivas de 2, 5, 15, 30 e no máximo 60 segundos.
Somente uma tentativa pode ficar agendada ou ativa por vez. A rotina:

- pausa quando o navegador detecta ausência de rede;
- acorda imediatamente quando a conexão ou sessão retorna;
- continua em intervalos limitados enquanto o servidor está indisponível;
- encerra a repetição quando a fila é concluída, exige decisão de conflito ou
  encontra um erro não transitório;
- é desmontada junto com a tela, evitando timers ou listeners duplicados.

## Separação entre Cloud e self-hosted

Vínculos, revisões, snapshots pendentes e rolagens agora recebem uma identidade
derivada somente do modo e da origem pública do backend, por exemplo:

```text
cloud@https://projeto.supabase.co
selfhosted@https://api.marufiarpg.org
```

A chave pública não participa dessa identidade e nenhum segredo é persistido.
Uma fila criada para um backend não é lida nem enviada pelo outro, mesmo que a
migração preserve os mesmos UUIDs de usuário e personagem.

Marcadores antigos sem escopo não são reaproveitados cegamente. Ao abrir um
backend, o cliente confirma o personagem naquele serviço pelo conteúdo da ficha
antes de criar o novo vínculo separado. Isso mantém o fallback Cloud sem risco
de cruzar alterações pendentes. Filas antigas criadas antes desta fase são
reconhecidas somente pelo perfil Cloud histórico; o perfil self-hosted nunca as
envia automaticamente.

## Conflitos

O mecanismo anterior foi preservado:

- cada gravação usa a revisão esperada;
- `revision`, `updated_at` e a origem da mudança continuam fora do documento da
  ficha;
- uma revisão divergente preserva as versões local e remota;
- a versão local somente substitui a remota após escolha explícita;
- a versão online pode ser baixada antes da decisão;
- o aplicativo nunca faz mesclagem silenciosa de campos críticos.

## Dados locais reutilizados

| Chave | Finalidade |
|---|---|
| `marufia-latio-state-v1` | ficha local aberta anteriormente |
| `marufia-online-character-imports-v1` | vínculo por backend, conta e ficha |
| `marufia-online-character-sync-v1` | revisão conhecida por backend e personagem |
| `marufia-online-pending-saves-v1` | último snapshot pendente por backend e personagem |
| `marufia-online-pending-rolls-v1` | rolagens pendentes individualmente |

Os nomes das chaves foram mantidos para compatibilidade. O escopo adicional fica
dentro dos registros e índices armazenados.

## Validações

- 12 testes Python aprovados;
- 405 testes JavaScript aprovados;
- teste de fila recriada após reinício lógico aprovado para ficha e rolagens;
- isolamento Cloud/self-hosted aprovado para vínculo, revisão, ficha e rolagem;
- backoff, pausa, reconexão e ausência de timers duplicados aprovados;
- smoke test desktop e celular aprovado;
- no navegador, uma gravação falhou com a internet ainda ativa, permaneceu
  local, exibiu “Servidor indisponível” e foi enviada automaticamente após a
  recuperação simulada do servidor;
- conflitos por revisão e sincronização após reconexão continuaram aprovados.

## Limites e riscos restantes

- a prioridade offline é a ficha previamente carregada; listas completas de
  campanhas ainda dependem do servidor;
- login novo não funciona sem acesso ao Auth, embora uma ficha local já salva
  continue disponível;
- armazenamento do navegador pode ser removido pelo próprio usuário ou pelo
  sistema, portanto exportação e backups continuam importantes;
- o teste físico com dois computadores, queda real do PC do Mestre e internet
  residencial pertence à Fase 13;
- esta fase não migra contas nem dados do Supabase Cloud.

## Arquivos e impacto

O novo coordenador fica em `src/online/offline.js`. A integração foi limitada a
importação/vínculo de personagem, sincronização, rolagens, mensagens, estado de
configurações e indicadores visuais. `app.js`, `data.js`, schema, migrations e
regras do RPG não foram modificados.

O site publicado não foi alterado. A configuração Sites foi respeitada apenas
para preservar o pacote atual; publicação e corte continuam adiados até a
validação com dois computadores.

## Rollback

A reversão do commit da fase remove o coordenador e os novos escopos. Nenhum
dado remoto ou migration foi alterado. As chaves locais anteriores continuam
existindo, portanto o rollback não apaga a ficha, filas antigas ou backups.

## Próxima etapa

A próxima etapa é a Fase 11: backup e restauração do PostgreSQL. Ela não foi
iniciada por esta fase.
