# Scripts Windows

| Comando | Função |
|---|---|
| `setup-environment.ps1` | cria uma vez o `.env` privado e todas as chaves |
| `start-server.ps1` | valida configuração/Docker e inicia serviços saudáveis |
| `status-server.ps1` | exibe o estado de todos os containers |
| `restart-server.ps1` | recria containers sem remover dados |
| `stop-server.ps1` | para containers sem remover volumes ou arquivos |
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
| `common.ps1` | validações compartilhadas; não deve ser executado diretamente |

Os scripts usam sempre o Compose oficial e a camada de segurança Marufia. Eles
não carregam ou imprimem os segredos do `.env` e retornam código diferente de zero
quando uma validação ou comando falha.

O dump criado antes da migração de schema é um ponto de rollback desta fase; ele
não substitui o sistema de backup, restore e retenção das Fases 11 e 12.

`test-auth.ps1` recusa endereços externos e só funciona com a confirmação
automática do ambiente experimental local. A configuração compartilhada impede
que essa confirmação automática seja usada quando a API estiver na internet.

`test-rls.ps1` também recusa endereços externos e exige que o banco experimental
esteja vazio. Ele usa somente a chave pública, nunca `service_role`, e confirma
que a limpeza devolveu o banco ao estado vazio.

`test-tunnel.ps1` não publica cadastro nem REST no ensaio temporário. O modo
permanente exige domínio HTTPS real, URLs alinhadas, confirmação automática
desativada e SMTP real. O token fica em arquivo ignorado pelo Git.
