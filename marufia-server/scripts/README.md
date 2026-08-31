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
| `common.ps1` | validações compartilhadas; não deve ser executado diretamente |

Os scripts usam sempre o Compose oficial e a camada de segurança Marufia. Eles
não carregam ou imprimem os segredos do `.env` e retornam código diferente de zero
quando uma validação ou comando falha.

O dump criado antes da migração de schema é um ponto de rollback desta fase; ele
não substitui o sistema de backup, restore e retenção das Fases 11 e 12.
