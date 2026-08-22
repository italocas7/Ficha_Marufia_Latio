# Painel do Mæstre — Fases 27 a 33

O card de cada campanha administrada pelo usuário oferece **Painel do Mæstre**. A autorização é confirmada novamente pelo banco usando o vínculo exato `gm` da campanha.

## Visualização completa — Fase 28

Cada personagem vinculado possui **Abrir ficha**. A visualização carrega o mesmo `app.js`, as mesmas sete abas, os mesmos dados e as mesmas regras da ficha atual em uma página isolada. Ela aparece claramente como **VISUALIZAÇÃO DO MÆSTRE**.

O visualizador aceita somente um estado schema v5 enviado pela janela pai com token efêmero. Campos e ações de alteração ficam bloqueados, nenhum salvamento local ou remoto é emitido e as abas e detalhes de leitura continuam navegáveis.

## Permissão granular — Fases 29 e 30

As seis ações aprovadas pelo usuário são **Alterar PV**, **Alterar PM**, **Adicionar condição**, **Remover condição**, **Adicionar item** e **Remover item**. Cada operação possui uma função de servidor separada e confirma:

- sessão autenticada;
- papel exato `gm` na campanha do personagem;
- valor inteiro dentro do contrato atual do schema;
- revisão esperada ainda vigente.

Condição usa exatamente a estrutura `effects` já existente, com nome, ajuste de CA e bloqueio uniforme. Item escolhe explicitamente entre arma e equipamento e mantém os mesmos campos do inventário schema v5. Nenhuma outra parte da ficha pode ser modificada por essas operações.

Toda ação feita pelo Mæstre recebe origem `gm` definida no banco e avança a revisão. O jogador inscrito na própria ficha recebe o novo estado pelo Realtime sem recarregar quando sua cópia local ainda corresponde à última revisão conhecida. Se houver edição local pendente, o diálogo de conflito continua preservando as duas versões.

## Presença — Fase 31

Cada sessão autenticada mantém um heartbeat de conexão a cada 30 segundos. O servidor deriva usuário e horários; o navegador informa apenas se houve atividade recente.

- **Online:** heartbeat recente e atividade nos últimos 120 segundos;
- **Ausente:** heartbeat recente, mas sem atividade recente ou com aba oculta;
- **Offline:** nenhum heartbeat nos últimos 90 segundos.

`campaign_presence` referencia a chave de `campaign_members`. Somente o `gm` da campanha pode consultar presença, e o navegador não recebe inserção ou atualização direta.

## Histórico — Fase 32

O painel mostra até 80 eventos recentes gerados exclusivamente pelo servidor:

- alteração de PV;
- alteração de PM;
- alteração de condições;
- alteração de armas/equipamentos relevantes;
- rolagem registrada.

Edições de nome, notas e outros campos textuais não geram histórico. A leitura é exclusiva do `gm` da campanha. Uma rolagem `gm` continua visível somente para o próprio Mæstre autor; `secret` permanece disponível ao autor e ao Mæstre conforme a regra já existente.

## Sessões — Fase 33

O Mæstre pode nomear e **Iniciar sessão** no próprio painel. Existe no máximo uma sessão ativa por campanha. O banco define o horário inicial e associa automaticamente cada novo evento relevante à sessão que estava ativa naquele instante.

Ao usar **Encerrar sessão**, o horário final também vem do servidor. O histórico exibe o nome da sessão ao lado dos eventos vinculados, e as sessões anteriores permanecem disponíveis no painel. Eventos fora de uma sessão continuam válidos e aparecem sem vínculo.

Somente o papel exato `gm` pode consultar, iniciar ou encerrar sessões. O navegador não recebe escrita direta em `campaign_sessions` nem escolhe o `session_id` de um evento.
