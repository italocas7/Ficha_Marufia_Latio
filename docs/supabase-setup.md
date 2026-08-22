# Supabase — Fases 4 a 34

Esta fase prepara o projeto sem criar ou conectar um projeto remoto. A ficha continua totalmente local quando não existe configuração pública.

## Componentes

- `@supabase/supabase-js` fornece o cliente oficial do navegador;
- `vendor/supabase.js` mantém uma cópia local para preservar o funcionamento sem CDN;
- `src/online/config.js` valida somente configuração pública;
- `src/online/supabase.js` cria um único cliente quando a configuração existir;
- `supabase/config.toml` registra o ambiente local da ferramenta oficial;
- `supabase/migrations/` receberá o schema versionado a partir da Fase 6.

## Valores permitidos no aplicativo

O arquivo `.env.example` registra apenas:

- `SUPABASE_URL`;
- `SUPABASE_PUBLISHABLE_KEY`.

A chave `publishable` foi criada para uso em aplicações públicas e depende das políticas de Row Level Security. Chaves `secret`, `service_role`, senhas e tokens administrativos nunca podem ser incluídos no aplicativo, no repositório ou em arquivos exportados.

## Fluxo futuro

O projeto gratuito `Marufia Online` foi criado na Fase 5 na região de São Paulo. `src/online/project.js` fornece ao aplicativo somente a URL e a chave `publishable`. A chave secreta e a senha do banco não fazem parte do código.

O teste de conexão verifica os serviços Auth e Data API sem criar usuários ou dados. A Fase 6 adiciona a primeira migration versionada com as seis tabelas da fundação online, índices, constraints e RLS bloqueado por padrão.

O contrato do banco está documentado em `docs/database-schema.md`. A migration deve ser publicada com `supabase db push` para manter o histórico local e remoto sincronizado.

A Fase 8 adiciona autenticação opcional em `src/online/auth.js`. A ficha permanece local sem sessão, e o documento `docs/authentication.md` registra os fluxos e limites de segurança.

A Fase 9 adiciona a criação e a listagem de campanhas próprias em `src/online/campaigns.js`. O banco, e não o navegador, define o proprietário e gera o código de convite. A entrada de participantes ainda não está habilitada.

A Fase 10 registra automaticamente o proprietário como `gm` em `campaign_members` e permite somente leitura autorizada dos vínculos. O navegador não pode criar participantes nem alterar papéis diretamente.

A Fase 11 move a decisão de autorização para o vínculo usuário-campanha. Uma função privada consulta o papel para as policies sem criar um papel global ou confiar em metadata do usuário.

A Fase 12 adiciona a entrada autenticada por código. A busca do convite ocorre em função privada no banco, novos vínculos recebem apenas `player` e vínculos existentes nunca têm o papel alterado.

A Fase 13 confirma a tabela JSONB de personagens e alinha sua validação ao contrato real da ficha (`meta.appId` e `meta.schemaVersion`). O acesso remoto a personagens permanece fechado até as fases de associação, migração e salvamento.

A Fase 14 permite criar personagens inicialmente fora de campanhas e associá-los somente quando o proprietário participa da campanha escolhida. O banco controla proprietário, nome e versão; a atualização automática do estado ainda não foi liberada.

A Fase 15 detecta uma ficha local depois do login e oferece uma cópia inicial para a conta. O JSON original é colocado no sistema de backups antes do envio, a ficha local permanece inalterada e a mesma origem não é importada repetidamente.

A Fase 16 conecta os salvamentos locais das fichas já importadas ao registro remoto correspondente. A gravação local termina primeiro, o cliente envia somente `state` e o banco continua responsável por proprietário, nome e versão. A ficha não conectada e qualquer falha de rede permanecem locais sem bloquear o uso.

A Fase 17 adiciona um debounce remoto de 1 segundo após o salvamento local. Rajadas de digitação enviam apenas a versão estabilizada, enquanto ocultar ou abandonar a página libera imediatamente o estado pendente. Nenhuma permissão nova de banco é necessária.

A Fase 18 mostra no cabeçalho se a conta está online, enviando alterações, offline ou com erro de sincronização. O indicador acompanha autenticação, conectividade e o resultado da fila remota sem alterar o schema do Supabase.

A Fase 19 publica somente alterações de `characters`. O jogador assina o UUID exato da ficha vinculada e o futuro painel do Mæstre poderá assinar o UUID da campanha. A policy adicional permite ao Mæstre apenas ler personagens vinculados às campanhas em que possui esse papel; nenhuma escrita de Mæstre foi aberta. Eventos remotos são validados e entregues ao aplicativo, mas a ficha local aguarda a estratégia de conflitos da Fase 20 antes de aplicar outra versão.

A Fase 20 acrescenta revisão monotônica, horário do servidor e origem da alteração fora do JSON da ficha. O salvamento usa uma função PostgreSQL atômica chamada por `rpc`: ela só grava quando a revisão esperada ainda coincide com a linha. Divergências preservam as duas versões e exigem decisão explícita no navegador; a atualização direta de `characters.state` deixa de ser permitida.

A Fase 21 mantém no navegador a versão remota pendente mais recente enquanto não existe conexão. A sessão persistida identifica a conta, mas todas as permissões continuam sendo confirmadas pelo Supabase no momento da retomada. A fila só é removida depois de `save_character_state` funcionar; uma revisão divergente segue para o tratamento explícito de conflitos.

A Fase 22 centraliza somente a criação local dos resultados e não altera o Supabase. A Fase 23 usa a tabela `rolls` já existente através de `record_roll`: o banco deriva conta e campanha do personagem associado, valida somente as fórmulas atuais e fixa a visibilidade como pública. A tabela não recebe permissões diretas de navegador e ainda não participa do Realtime.

A Fase 24 adiciona `rolls` à publicação Realtime e libera somente a leitura das rolagens `public` ao vínculo `gm` da campanha correspondente. O painel carrega as 50 entradas mais recentes e recebe novos registros pelo filtro exato de campanha, sem conceder escrita na tabela nem decidir ainda o acesso às opções `gm` e `secret`.

A Fase 25 abre o painel de rolagens para todos os participantes, mantendo o filtro no banco: `public` é da campanha, `secret` é do autor e do Mæstre, e `gm` é somente do Mæstre autor. Jogadores pedem `public` por padrão ou `secret`; o servidor transforma toda rolagem feita pelo Mæstre em `gm` e corrige também o histórico público anterior. O nome do personagem passa a acompanhar a rolagem para evitar abrir a ficha integral aos demais jogadores.

A Fase 26 não altera o Supabase. A geração local passa por um motor com pedidos versionados e provedor substituível, enquanto `record_roll` continua validando o resultado antes de gravá-lo. O mesmo motor aceita futuramente um provedor assíncrono remoto sem alterar o formato consumido pela ficha.

A Fase 27 adiciona presença autenticada por campanha. Participantes atualizam apenas o próprio batimento por `touch_campaign_presence`, e somente o `gm` consulta registros recentes. O painel combina essa contagem com a leitura já autorizada dos personagens vinculados, mostrando apenas o resumo de PV e PM; nenhuma permissão de edição é aberta.

A Fase 28 reutiliza a ficha atual em um visualizador completo e somente leitura. A Fase 29 expõe operações separadas somente para PV, PM, condições temporárias e armas/equipamentos, todas protegidas por papel de campanha e revisão. A Fase 30 consome a atualização de `characters` já publicada e a aplica automaticamente no jogador somente quando não existe divergência local.

A Fase 31 acrescenta `active_at` à presença e mantém o heartbeat de 30 segundos para distinguir online, ausente e offline. A Fase 32 ativa `campaign_events`: gatilhos privados registram somente PV, PM, condições, itens relevantes e rolagens, e o painel do Mæstre recebe esses eventos pelo Realtime.

A Fase 33 cria `campaign_sessions`, controlada somente por funções autenticadas do Mæstre. O servidor garante uma única sessão ativa, define início e fim e associa automaticamente novos `campaign_events` por `session_id`; o cliente recebe o ciclo pelo Realtime sem escrita direta nas tabelas.

A Fase 34 não altera o banco. O JSON clássico continua disponível e um envelope versionado de backup online carrega somente o estado schema v5 e metadados informativos. Importar esse arquivo nunca restaura proprietário, campanha, papel ou revisão como autoridade.

A Fase 35 consolida a segurança por linha já construída. A nova migração confirma as policies definitivas de proprietário, participante e `gm`, remove acessos anônimos e revoga somente escritas diretas perigosas. Os grants legítimos por coluna não são recriados nem ampliados. Operações privilegiadas continuam acessíveis apenas a usuários autenticados por funções específicas; esconder botões não participa da autorização.

A Fase 36 executa 35 ataques transacionais no banco vinculado com três identidades descartáveis. O teste cobre campanhas, personagens, papéis, UUIDs conhecidos, RPCs, sessões, presença, histórico e rolagens; todos os fixtures são revertidos. A suíte também exige caminhos legítimos do proprietário e do `gm`, o que revelou e corrigiu o bloqueio indevido do gatilho de personagem sem ampliar grants ou policies.

Referências oficiais:

- https://supabase.com/docs/reference/javascript/initializing
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- https://supabase.com/docs/guides/local-development/cli-workflows
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/realtime/postgres-changes
- https://supabase.com/docs/reference/javascript/removechannel
- https://supabase.com/docs/reference/javascript/rpc
- https://supabase.com/docs/reference/javascript/auth-getsession
