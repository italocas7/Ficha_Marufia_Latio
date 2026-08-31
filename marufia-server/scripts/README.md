# Scripts Windows

| Comando | Função |
|---|---|
| `setup-environment.ps1` | cria uma vez o `.env` privado e todas as chaves |
| `start-server.ps1` | valida configuração/Docker e inicia serviços saudáveis |
| `status-server.ps1` | exibe o estado de todos os containers |
| `restart-server.ps1` | recria containers sem remover dados |
| `stop-server.ps1` | para containers sem remover volumes ou arquivos |
| `common.ps1` | validações compartilhadas; não deve ser executado diretamente |

Os scripts usam sempre o Compose oficial e a camada de segurança Marufia. Eles
não carregam ou imprimem os segredos do `.env` e retornam código diferente de zero
quando uma validação ou comando falha.

Backup, restore e health check completo pertencem às Fases 11 e 12.
