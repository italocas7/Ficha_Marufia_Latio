# Personagens — Fases 13 a 21

A fundação do banco já criou `public.characters` com UUID, proprietário, campanha opcional, nome, estado integral em JSONB, versão do schema e timestamps.

## Contrato do estado

- `state` preserva o mesmo objeto serializado usado pela ficha local; os campos de Marufia não foram separados em centenas de colunas.
- `state.meta.appId` deve ser `marufia-latio`.
- `state.meta.schemaVersion` deve coincidir com `schema_version`.
- Versões antigas continuam representáveis para serem migradas pelo validador existente antes do uso.
- `campaign_id` continua opcional. A associação de personagens fora e dentro de campanhas pertence à Fase 14.

## Ciclo independente — Fase 14

- Um personagem novo é criado primeiro sem campanha (`campaign_id = null`).
- O banco define o proprietário pela sessão autenticada; o navegador envia somente o estado validado.
- Nome e versão são derivados do próprio estado no servidor, evitando metadados divergentes.
- A pessoa pode listar apenas os próprios personagens.
- A associação ou remoção de campanha altera somente `campaign_id`.
- Uma associação é aceita apenas quando o proprietário também consta em `campaign_members` daquela campanha.
- Mæstres ainda não recebem leitura de personagens alheios; isso pertence às fases do painel e permissões.

O módulo `src/online/characters.js` expõe o serviço necessário para listar, criar de forma independente e associar. Ele ainda não é ligado automaticamente à ficha local.

## Limite atual

A tabela permanece bloqueada para `anon`. Usuários autenticados recebem somente leitura das próprias linhas, criação pelo estado e atualização da coluna de campanha. Não existe permissão de exclusão nem de atualização do estado nesta fase.

A ficha local não é importada automaticamente e ainda não existe salvamento remoto contínuo. Esses fluxos serão habilitados nas Fases 15 e 16, depois da criação de backup local.

## Migração da ficha local — Fase 15

Depois do login, o aplicativo verifica se existe uma ficha iniciada neste computador:

- uma ficha já registrada para a mesma conta e mesma origem não é oferecida novamente;
- quando a ficha ainda não foi importada, a pessoa pode **Importar para minha conta** ou escolher **Agora não**;
- antes do envio, o backup guarda o JSON local original, inclusive se ele ainda estiver em um schema antigo;
- a importação cria um personagem independente, sem campanha;
- o estado local e seus arquivos de backup não são removidos nem substituídos;
- a marca de importação é local e separada por conta e pela data de criação da ficha;
- se a marca local desaparecer, a comparação com os personagens da conta evita criar outra cópia da mesma origem.

A importação cria a cópia inicial usada pela sincronização da fase seguinte.

## Salvamento remoto — Fase 16

Depois que a ficha local foi importada e vinculada à conta, cada salvamento válido segue esta ordem:

1. o estado completo em schema v5 é gravado no `localStorage`;
2. a integração opcional recebe uma cópia desse mesmo estado;
3. com sessão conectada e vínculo local válido, somente a coluna `characters.state` do personagem correspondente é atualizada no Supabase;
4. o gatilho protegido do banco deriva novamente `name` e `schema_version` a partir do documento recebido.

A fila remota executa uma gravação por vez. Se novas versões surgirem enquanto uma requisição está ativa, somente a mais recente permanece aguardando, evitando que uma resposta antiga seja enviada depois de uma nova.

Sem sessão, sem vínculo ou quando o serviço remoto falha, a gravação local continua concluída e utilizável. Esta fase não carrega automaticamente o estado remoto, não mantém uma fila offline persistente e não mostra status de sincronização; estados visuais, conflitos e recuperação offline pertencem às Fases 18, 20 e 21.

## Debounce remoto — Fase 17

O salvamento local mantém o intervalo existente de 250 ms. Depois dele, o envio ao Supabase aguarda 1 segundo sem novas alterações. Cada nova edição reinicia somente o relógio remoto, portanto digitar um nome progressivamente produz uma única atualização estabilizada em vez de várias requisições.

Quando a página fica oculta ou é abandonada, a versão remota pendente é liberada imediatamente. A fila continua serializando requisições e preservando somente a versão mais recente durante um envio ativo. O debounce não altera o JSON, os cálculos ou o comportamento offline da ficha.

## Status de sincronização — Fase 18

Um indicador discreto no cabeçalho apresenta quatro estados:

- **Online**: a conta está conectada e não existe gravação remota ativa ou com falha;
- **Sincronizando**: uma ficha vinculada está sendo efetivamente enviada ao Supabase;
- **Offline**: não existe sessão conectada, o cliente online está indisponível ou o navegador informou perda de rede;
- **Erro de sincronização**: a gravação remota falhou, mas a versão local terminou de ser salva.

O erro permanece visível até uma gravação remota posterior funcionar. Se a rede cair, `Offline` tem prioridade; quando ela volta, o erro anterior reaparece até a recuperação. Trocar a sessão limpa o estado transitório da conta anterior. O indicador usa texto, cor, título e `role=status`, portanto não depende somente da cor.

## Atualizações em tempo real — Fase 19

Somente `public.characters` participa da publicação `supabase_realtime`. Depois de autenticar e vincular a ficha local, o jogador abre um canal filtrado pelo UUID exato do próprio personagem. A infraestrutura do futuro painel do Mæstre também aceita um canal filtrado por `campaign_id`, mas ele ainda não é ligado a uma nova tela.

Cada evento precisa ser uma atualização de `public.characters`, conter um documento válido e pertencer ao personagem ou à campanha assinada. Eventos aceitos são entregues ao aplicativo como `marufia:remote-character-updated`; nenhum dado remoto é aplicado silenciosamente à ficha local nesta fase. A decisão entre versões locais e remotas pertence à estratégia de conflitos da Fase 20.

O banco permite que o proprietário continue vendo a própria ficha e adiciona somente leitura para quem possui papel `gm` na campanha vinculada. O Mæstre ainda não recebe permissão de alterar o personagem; essa autorização será tratada na fase própria. Logout, troca de ficha ou encerramento da integração removem o canal ativo.

## Conflitos de edição — Fase 20

Cada personagem possui agora três metadados externos ao documento da ficha:

- `revision`: número monotônico incrementado pelo banco em cada alteração;
- `updated_at`: horário definido pelo servidor;
- `last_change_origin`: origem autorizada `player`, `gm` ou `system`.

Esses valores não entram no JSON schema v5. A revisão conhecida fica em armazenamento técnico separado por conta e personagem.

O salvamento contínuo deixou de atualizar `state` diretamente. O cliente chama `save_character_state` com a revisão que conhecia; o banco atualiza somente se ela ainda for atual. Se outra sessão gravou antes, a operação falha como conflito e nenhuma das versões é alterada.

Uma alteração Realtime divergente também abre o mesmo aviso. O diálogo mostra versão local e online, revisão, origem e horários. A pessoa pode:

- **Manter minha versão**: confirmação explícita que repete a gravação sobre a revisão online carregada;
- **Baixar versão online**: preserva o documento remoto como JSON para inspeção ou importação;
- **Decidir depois**: mantém a ficha local utilizável e suspende novas gravações remotas daquele conflito.

Novas edições locais continuam atualizando a versão preservada, mas não são enviadas enquanto o conflito estiver pendente. A futura aplicação automática de alterações autorizadas pelo Mæstre continua reservada à fase bidirecional.

## Operação offline — Fase 21

Quando o navegador informa perda de conectividade, a ficha continua usando exatamente o salvamento local existente. O envio remoto não é iniciado; somente a versão válida mais recente fica registrada em `marufia-online-pending-saves-v1`, separada por conta e personagem.

A fila contém o mesmo documento schema v5, o personagem de destino, a revisão conhecida e o horário em que ficou pendente. Ela não entra na exportação da ficha e não altera cálculos ou dados de Marufia. Rajadas offline substituem a entrada anterior do mesmo personagem, evitando reproduzir cada tecla como uma operação remota.

Ao receber o evento de reconexão, restaurar uma sessão ou reabrir a aplicação conectada, o cliente:

1. identifica a conta e a ficha local vinculada;
2. recupera a versão local mais recente;
3. volta a validar a revisão remota;
4. envia uma única atualização;
5. remove a entrada persistente somente depois do sucesso.

Falhas transitórias de rede também preservam a operação na fila. Se a revisão mudou enquanto o dispositivo estava offline, a retomada usa o diálogo de conflito da Fase 20 em vez de sobrescrever o servidor. Filas de outras contas ou personagens não são executadas na sessão atual.
