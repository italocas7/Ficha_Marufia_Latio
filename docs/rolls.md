# Rolagens — Fases 22 a 26

As rolagens executadas pela ficha usam a camada reutilizável `src/core/rolls.js`. Ela cria um resultado com os dados individuais, o valor escolhido ou somado e o rótulo que a interface já apresentava. Modo, fórmula e modificador também acompanham o resultado para que a próxima fase possa registrá-lo sem reconstruir as regras.

## Regras preservadas

- O d100 normal sorteia uma vez entre 1 e 100.
- Vantagem sorteia dois d100 e usa o menor resultado.
- Desvantagem sorteia dois d100 e usa o maior resultado.
- A duração do Mundo continua sendo `1d4` nos níveis 1–4 e `1d4+2` a partir do nível 5.
- A redução de dano do Núcleo Antebraço continua sendo `1d6`.

Perícias, atributos e testes de combate continuam usando o mesmo cálculo de alvo e a mesma classificação de sucesso.

Sorteios de personalidade e o identificador alternativo de itens não representam resultados de dados. Por isso, continuam em seus fluxos atuais e não entram nesta camada.

## Registro remoto — Fase 23

Cada resultado real publica internamente `rollType`, nome do teste quando aplicável, modo, fórmula, dados brutos, modificador, alvo, total e desfecho. A integração `src/online/rolls.js` registra o evento somente para uma conta autenticada e uma ficha online já vinculada. A coluna `skill_name` guarda o nome real da perícia ou do atributo testado; duração do Mundo e Núcleo não preenchem esse campo.

O navegador nunca envia `user_id`, `campaign_id` nem `visibility`. A função protegida `public.record_roll` deriva usuário e campanha a partir do personagem pertencente à conta, exige que o personagem esteja associado a uma campanha da qual o usuário participa e fixa a visibilidade como `public`. As opções `gm` e `secret` permanecem reservadas à Fase 25.

A função aceita somente as fórmulas já existentes na ficha, confere quantidade e faixa dos dados, aplica o menor resultado na vantagem, o maior na desvantagem e verifica o total do d4/d6. O identificador criado no navegador torna uma repetição da mesma operação idempotente.

Rolagens aguardam numa fila local separada por conta e personagem até a confirmação do banco. Na reconexão, todos os eventos daquele vínculo são enviados em ordem; filas de outras contas não são reproduzidas. Uma rolagem feita por personagem sem campanha é descartada da fila remota e continua válida apenas na interface local. A fila não integra o JSON schema v5 nem a exportação da ficha.

## Rolagens ao vivo — Fase 24

O Mæstre pode abrir **Rolagens ao vivo** no card de uma campanha em que seu vínculo seja exatamente `gm`. O painel carrega as 50 rolagens públicas mais recentes daquela campanha e assina apenas novos `INSERT` de `rolls` filtrados pelo UUID exato da campanha.

Cada item mostra personagem, tipo de teste, dado e valores brutos, resultado, alvo e sucesso ou falha quando esses dados existem, além do horário registrado pelo servidor. Atualizações recebidas pelo Realtime passam pela mesma validação dos registros carregados antes de aparecerem na interface.

A policy inicial da Fase 24 autorizava somente a leitura de linhas `public` para o Mæstre da campanha correspondente. A Fase 25 substitui essa policy pelas regras definitivas abaixo.

## Visibilidade — Fase 25

- `public`: todos os participantes da campanha podem ver.
- `secret`: somente o autor da rolagem e o Mæstre da campanha podem ver.
- `gm`: somente o próprio Mæstre que realizou a rolagem pode ver.

Jogadores continuam publicando como `public` por padrão e a integração aceita um pedido explícito `secret`. O navegador não pode pedir `gm`: o servidor consulta o papel dentro da campanha e transforma automaticamente toda rolagem feita pelo Mæstre em `gm`, mesmo que um cliente modificado tente enviá-la como pública.

O painel **Rolagens da campanha** fica disponível a todos os participantes, mas o Row Level Security filtra o histórico e os eventos Realtime individualmente. O nome do personagem é registrado como um pequeno retrato textual junto da rolagem, permitindo identificar resultados públicos sem abrir o documento integral da ficha para outros jogadores.

Rolagens públicas anteriores feitas por um Mæstre são convertidas para `gm` quando a migration é aplicada. A resposta protegida de `record_roll` informa a visibilidade efetivamente decidida pelo banco, e a fila offline preserva o pedido `public` ou `secret` até a confirmação remota.

## Fronteira de geração — Fase 26

A geração continua local nesta primeira versão, sem atrasar o MVP e sem alterar probabilidades. O módulo `src/core/rolls.js` agora separa três responsabilidades:

1. um pedido versionado descreve apenas o tipo de dado, modo e modificador;
2. um provedor produz somente os valores brutos dos dados;
3. o motor valida quantidade e faixa e então deriva fórmula, total e rótulo.

O provedor atual usa a mesma fonte local e mantém exatamente `1d100`, vantagem, desvantagem, `1d4`, `1d4+2` e `1d6`. Valores fora de `[0, 1)` na fonte local, dados fora da faixa ou quantidade incorreta são recusados antes de alcançar a ficha.

`createRollEngine` oferece execução síncrona para o provedor local atual e execução assíncrona para um futuro provedor remoto. Portanto, mover a geração ao backend exigirá substituir a fonte e adaptar somente a fronteira assíncrona, sem reimplementar o cálculo dos resultados ou o formato publicado para registro.

Esta fase não afirma que a geração local é inviolável: o servidor continua validando os dados recebidos, e a geração autoritativa remota pode ser adicionada depois. Nenhuma tabela, policy ou migration nova foi necessária.
