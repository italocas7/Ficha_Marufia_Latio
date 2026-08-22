# Campanhas — Fases 9 a 12

Nesta fase, uma pessoa autenticada pode criar e consultar somente as campanhas que administra.

## Segurança

- O navegador envia apenas nome e descrição.
- O banco define `owner_id` a partir da sessão autenticada.
- O banco gera um código no formato `MRF-XXXX-XX` com 30 bits de aleatoriedade.
- A chave pública não pode escolher `owner_id`, escolher `join_code`, editar ou excluir campanhas.
- O código de convite identifica uma campanha, mas não concede privilégios administrativos.
- A entrada por código é uma operação autenticada do banco; o navegador não recebe acesso direto para inserir participantes.

## Interface

Após o login, o botão **Campanhas** aparece no cabeçalho. A janela permite listar campanhas próprias, criar uma campanha e copiar o código recebido.

A ficha de personagem continua salva localmente e nenhuma regra de Marufia foi alterada.

## Participantes — Fase 10

- Toda nova campanha registra automaticamente seu proprietário em `campaign_members` com o papel `gm`.
- Campanhas existentes recebem o mesmo vínculo por uma migração compatível.
- O proprietário pode consultar os participantes de sua campanha e cada usuário pode consultar o próprio vínculo.
- O navegador não recebe permissão para inserir, editar ou excluir vínculos e não pode trocar papéis.
- `gm` e `player` são os papéis iniciais; `assistant_gm` e `spectator` permanecem reservados para evolução futura.

## Autorização por campanha — Fase 11

- O papel atual é consultado exclusivamente pelo par `(campaign_id, user_id)` em `campaign_members`.
- Uma mesma conta pode ser `gm` em uma campanha e `player` em outra.
- Ser proprietário não é mais a policy de leitura: a campanha é visível quando existe um vínculo do usuário.
- `gm` pode consultar todos os participantes da campanha; os demais papéis veem o próprio vínculo.
- Nenhum campo de papel foi adicionado a `profiles`, metadata ou ao estado da ficha.

## Entrada por código — Fase 12

- A pessoa informa um código no formato `MRF-XXXX-XX`; a busca da campanha acontece somente no servidor.
- Pela regra atual, toda campanha existente aceita seu código de convite. Um código inexistente ou fora do formato é recusado.
- Um novo vínculo recebe exclusivamente o papel `player`.
- Se o vínculo já existir, seu papel é devolvido sem qualquer alteração; um Mæstre continua Mæstre.
- A operação é restrita a usuários autenticados e retorna apenas campanha, nome, papel e indicação de vínculo anterior.
- A chave pública continua sem permissão direta para inserir, editar ou excluir `campaign_members`.

Na janela **Campanhas**, **Entrar com código** abre o campo do convite. Após a confirmação, a campanha aparece na mesma lista e continua disponível depois de recarregar a página.
