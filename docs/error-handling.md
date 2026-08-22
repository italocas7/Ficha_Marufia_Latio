# Erros e registros seguros — Fase 49

As falhas online não interrompem o salvamento local da ficha. Quando uma gravação remota falha, a interface informa:

> Não foi possível sincronizar sua ficha. Os dados continuam salvos neste computador.

O aviso usa `role="alert"`, permanece visível por tempo limitado e não substitui o indicador persistente de sincronização. Uma nova tentativa bem-sucedida continua usando a fila e as regras de conflito existentes.

## Registro mínimo

O registro online permanece somente em memória, limitado às 50 ocorrências mais recentes. Cada entrada contém apenas:

- horário;
- código seguro ou código genérico;
- área e operação controladas;
- categoria da falha;
- mensagem fixa destinada ao usuário.

Mensagens técnicas, stack traces, requisições, respostas, payloads da ficha e contexto arbitrário não são armazenados. O registro desaparece ao recarregar o aplicativo.

## Dados proibidos

Nunca registrar ou incluir nos eventos de erro:

- senha;
- token de acesso ou atualização;
- cabeçalho de autorização;
- chave pública ou secreta do projeto;
- `service role key`;
- estado completo da ficha.

Erros técnicos são usados transitoriamente apenas para classificar rede, conta, permissão, conflito ou validação. O texto original não entra no registro nem no aviso exibido.
