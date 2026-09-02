# Scripts Windows

| Comando | Função |
|---|---|
| `setup-environment.ps1` | cria uma vez o `.env` privado e todas as chaves |
| `start-server.ps1` | valida configuração/Docker e inicia serviços saudáveis |
| `status-server.ps1` | exibe o estado de todos os containers |
| `health-check.ps1` | verifica banco, Auth, REST, Realtime, Storage, Tunnel, jogadores e backup |
| `server-manager.ps1` | oferece um painel simples para administrar o servidor |
| `restart-server.ps1` | recria containers sem remover dados |
| `stop-server.ps1` | para containers sem remover volumes ou arquivos |
| `backup.ps1` | cria dump lógico, checksum e chave criptográfica protegida; aplica retenção segura |
| `restore.ps1` | testa restore em banco descartável por padrão; produção exige confirmação explícita e rollback |
| `test-backup-restore.ps1` | cria um backup real, rejeita uma cópia adulterada e restaura em banco isolado |
| `configure-backup-schedule.ps1` | instala o backup diário opcional no Agendador do Windows |
| `remove-backup-schedule.ps1` | remove somente o agendamento, preservando todos os backups |
| `run-scheduled-backup.ps1` | executor não interativo do backup diário com log mensal sem segredos |
| `configure-startup.ps1` | habilita opcionalmente o início no logon do Windows |
| `remove-startup.ps1` | retorna à inicialização manual sem remover dados |
| `run-startup.ps1` | executor seguro da inicialização automática |
| `migrate-schema.ps1` | valida hashes, cria rollback e aplica somente migrations pendentes |
| `verify-schema.ps1` | confere tabelas, RLS, RPCs, gatilhos, Realtime e histórico |
| `test-schema-security.ps1` | executa 35 ataques RLS transacionais e confirma rollback |
| `test-auth.ps1` | cria duas contas locais descartáveis, valida sessões e papéis e remove tudo |
| `test-rls.ps1` | ataca a API local com três identidades, valida as oito tabelas e remove tudo |
| `test-realtime.ps1` | cria três contas, valida seis canais Realtime e remove tudo |
| `set-tunnel-token.ps1` | grava o token privado sem mostrá-lo |
| `start-tunnel.ps1` | inicia o Tunnel permanente somente com configuração externa segura |
| `status-tunnel.ps1` | mostra estado/saúde sem exibir credenciais |
| `stop-tunnel.ps1` | remove somente containers sem estado do Tunnel |
| `test-tunnel.ps1` | ensaia HTTPS e Realtime num Quick Tunnel restrito e temporário |
| `test-public-clients.ps1` | valida o domínio real com Mestre, vários jogadores, queda e reconexão |
| `set-smtp.ps1` | grava SMTP real no `.env` sem exibir a senha |
| `configure-public-domain.ps1` | alinha domínio, Auth, redirects e CORS com rollback automático |
| `render-public-gateway.ps1` | gera localmente o gateway com origens CORS exatas |
| `select-client-backend.ps1` | alterna os próximos builds entre Cloud e self-hosted |
| `restore-local-domain.ps1` | para o Tunnel e volta ao loopback/Cloud sem remover dados |
| `test-domain-config.ps1` | valida domínio, SMTP, Auth e CORS sem publicar o servidor |
| `common.ps1` | validações compartilhadas; não deve ser executado diretamente |

Os scripts usam sempre o Compose oficial e a camada de segurança Marufia. Eles
não carregam ou imprimem os segredos do `.env` e retornam código diferente de zero
quando uma validação ou comando falha.

O dump criado antes da migração de schema é um ponto de rollback desta fase; ele
permanece preservado. O sistema regular da Fase 11 usa conjuntos próprios com
SHA-256, metadados e uma cópia criptografada da chave persistente do PostgreSQL.

`test-auth.ps1` recusa endereços externos e só funciona com a confirmação
automática do ambiente experimental local. A configuração compartilhada impede
que essa confirmação automática seja usada quando a API estiver na internet.

`test-rls.ps1` também recusa endereços externos e exige que o banco experimental
esteja vazio. Ele usa somente a chave pública, nunca `service_role`, e confirma
que a limpeza devolveu o banco ao estado vazio.

`test-tunnel.ps1` não publica cadastro nem REST no ensaio temporário. O modo
permanente exige domínio HTTPS real, URLs alinhadas, confirmação automática
desativada e SMTP real. O token fica em arquivo ignorado pelo Git.

Consulte `docs/SERVER_PUBLIC_DOMAIN.md` antes de configurar o modo permanente.
Não informe senha SMTP ou token em argumentos visíveis, conversa, logs ou Git.
Consulte `docs/SERVER_BACKUP_AND_RESTORE.md` antes de uma restauração real.

Os eventos operacionais são gravados em arquivos mensais dentro de
`marufia-server/logs/`. Dados que se pareçam com senhas, tokens ou chaves são
ocultados, e somente esses logs operacionais com mais de 90 dias são removidos.
A inicialização permanece manual até que `configure-startup.ps1` seja executado.

`test-public-clients.ps1` cria somente contas descartáveis pelo endpoint
administrativo local, entrega aos clientes apenas a chave publicável e remove os
dados por cascade ao final. A opção `-IncludeOutage` para de verdade o servidor
e exige a confirmação explícita `TESTAR-QUEDA-MARUFIA`.
