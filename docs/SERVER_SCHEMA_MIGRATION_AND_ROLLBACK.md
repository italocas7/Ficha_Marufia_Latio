# Migração e rollback do schema local

Este procedimento trata somente do banco experimental do Marufia Server. Ele
não acessa nem altera o Supabase Cloud.

## Aplicar ou verificar o schema

Com o servidor iniciado, execute na raiz do projeto:

```powershell
.\marufia-server\scripts\migrate-schema.ps1
```

Na primeira execução, o script aceita apenas um banco sem usuários e sem tabelas
públicas. Ele valida as migrations por SHA-256, cria um dump anterior à mudança
e aplica somente versões pendentes. Nas execuções seguintes, apenas confirma o
estado quando tudo já estiver atualizado.

Para verificar a estrutura sem aplicar mudanças:

```powershell
.\marufia-server\scripts\verify-schema.ps1 -RequireEmptyData
```

Para executar os testes transacionais de RLS:

```powershell
.\marufia-server\scripts\test-schema-security.ps1
```

## Conferir o ponto de rollback

O dump e seu arquivo `.sha256` ficam em `marufia-server/backups/`, que é ignorada
pelo Git. Antes de usar um dump, confira:

- se os dois arquivos existem;
- se o SHA-256 calculado é igual ao registrado;
- se `pg_restore --list` consegue ler o dump;
- se há espaço livre para manter também um backup do estado atual.

O migrador realiza essas verificações ao criar o ponto de rollback. Não declare
um arquivo como backup válido somente por ele existir.

## Decisão de rollback

```text
Falha somente no código ou documentação?
        |
        +-- sim --> reverta o commit; preserve o banco
        |
        +-- não
             |
             v
O banco local contém dados reais?
        |
        +-- sim --> pare; crie e valide novo backup antes de restaurar
        |
        +-- não --> restaure primeiro em banco descartável e valide
```

Não apague volumes, não use `down -v` e não restaure por cima do banco sem saber
qual arquivo será usado. Uma restauração muda ou remove objetos do destino.

## Procedimento de restauração

A automação definitiva de restore será criada e testada na Fase 11. Até lá, uma
restauração necessária deve seguir estes passos controlados:

1. parar os clientes e impedir novas escritas;
2. registrar o arquivo exato e seu SHA-256;
3. criar e validar um backup novo do estado atual;
4. restaurar o dump em um banco descartável compatível;
5. validar Auth, extensões, tabelas, funções e consultas nesse banco;
6. somente após a validação, autorizar a restauração do destino local;
7. iniciar os serviços e executar health checks e testes de integridade.

O dump da Fase 4 foi validado estruturalmente com `pg_restore --list`, mas ainda
não foi restaurado sobre o banco principal. O teste completo de restauração é um
critério obrigatório da Fase 11.

## Recuperação sem afetar o Cloud

O Supabase Cloud continua sendo o backend padrão durante todas essas operações.
Não altere DNS nem a configuração pública do aplicativo para apontar ao servidor
local enquanto Auth, RLS, Realtime, backup e restore não estiverem aprovados.
