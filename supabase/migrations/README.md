# Migrations do Marufia Online

As migrations SQL são adicionadas em ordem cronológica e aplicadas com a ferramenta oficial, preservando o histórico remoto.

- `20260820030000_create_marufia_online_foundation.sql`: estrutura mínima da Fase 6 com `profiles`, `campaigns`, `campaign_members`, `characters`, `rolls` e `campaign_events`.
- `20260820040000_create_profile_lifecycle.sql`: cria automaticamente o perfil de cada usuário e libera somente leitura/edição do próprio perfil.
- `20260820050000_create_campaign_lifecycle.sql`: cria campanhas próprias com proprietário e convite definidos no banco.
- `20260820060000_create_campaign_membership_lifecycle.sql`: registra o proprietário como `gm` e protege a leitura de participantes.
- `20260820070000_create_campaign_role_authorization.sql`: resolve autorização por papel dentro de cada campanha.
- `20260820080000_create_campaign_join_by_code.sql`: permite entrada autenticada por convite como `player` sem alterar papéis existentes.
- `20260820081000_fix_campaign_join_conflict_target.sql`: explicita a chave de conflito da entrada concorrente para o PostgreSQL.
- `20260820090000_align_character_state_contract.sql`: corrige a validação de versão do JSONB para o caminho `meta.schemaVersion`.
- `20260820100000_create_character_lifecycle.sql`: permite personagens independentes e associação somente às campanhas do proprietário.
- `20260820110000_enable_character_remote_saves.sql`: permite ao proprietário autenticado atualizar somente o estado integral da própria ficha.
- `20260820120000_enable_character_realtime.sql`: publica somente personagens e libera ao Mæstre apenas a leitura das fichas vinculadas à sua campanha.
- `20260820130000_enable_character_conflict_control.sql`: adiciona revisão/origem controladas pelo servidor e impede sobrescritas concorrentes por comparação atômica.
- `20260820140000_enable_roll_registration.sql`: registra rolagens validadas com identidade e campanha derivadas no servidor.
- `20260820150000_enable_roll_realtime.sql`: publica novas rolagens e abre a primeira leitura pública apenas ao Mæstre da campanha.
- `20260820160000_enable_roll_visibility.sql`: aplica as regras `public`, `secret` e privada do Mæstre, preservando o nome do personagem sem expor sua ficha.
- `20260820170000_create_campaign_presence.sql`: registra presença recente por participante e permite sua leitura somente ao Mæstre da campanha.
- `20260820180000_enable_gm_hp_updates.sql`: permite somente a alteração de PV atual pelo Mæstre da campanha, com revisão esperada.
- `20260820190000_expand_campaign_presence_status.sql`: separa conexão e atividade sem aumentar o heartbeat.
- `20260820200000_enable_campaign_history.sql`: registra PV, PM, condições, itens e rolagens importantes com leitura protegida do Mæstre.
- `20260820201000_fix_gm_hp_null_role.sql`: recusa explicitamente papel ausente na operação granular de PV.
- `20260820210000_create_campaign_sessions.sql`: permite ao Mæstre iniciar e encerrar uma única sessão ativa e associa eventos a ela no servidor.
- `20260820220000_expand_gm_character_actions.sql`: libera ao Mæstre somente PM, condições e itens adicionais aprovados, sempre com revisão concorrente.
- `20260820230000_harden_row_level_security.sql`: audita a matriz de RLS existente e remove somente privilégios diretos perigosos, preservando os acessos legítimos por coluna.
- `20260820231000_allow_authorized_gm_character_writes.sql`: corrige o gatilho do proprietário para aceitar somente RPCs do `gm` já autenticado na campanha exata, sem abrir grants diretos.
- `20260822120000_fix_campaign_creation_and_management.sql`: corrige a leitura da campanha durante a criação e permite ao proprietário editar ou excluir sua campanha por operações autenticadas, preservando as fichas dos personagens.
- `20260822130000_clear_campaign_roll_history.sql`: permite somente ao Mæstre limpar permanentemente as rolagens e seus resumos da campanha, avisando os participantes pelo Realtime sem liberar exclusão direta.

Alterações remotas devem passar por `supabase db push`; não editar o schema diretamente pelo painel.

Não adicionar senhas, chaves secretas, tokens ou dados reais de jogadores nesta pasta.
