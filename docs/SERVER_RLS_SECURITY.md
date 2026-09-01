# Segurança RLS do Marufia Server

Este documento é o procedimento obrigatório para revisar ou ampliar o acesso a
dados do Marufia. Verificações de interface nunca substituem estas regras no
banco.

## Garantias atuais

- todas as oito tabelas públicas usam RLS;
- `anon` não possui acesso direto a dados privados;
- uma conta lê somente o próprio perfil;
- campanhas e personagens são isolados por associação e papel na campanha;
- o Mestre não recebe um papel administrativo global;
- o papel de Mestre vale somente na campanha correspondente;
- alterações privilegiadas usam RPCs específicas, nunca `UPDATE` amplo;
- proprietário, papel, campanha, revisão e origem são calculados ou conferidos
  pelo servidor;
- `service_role` não é usada pelo cliente nem pelos testes HTTP.

## Matriz resumida

| Recurso | Sem login | Jogador | Mestre da campanha | Outro Mestre/usuário |
|---|---|---|---|---|
| próprio perfil | negado | permitido | permitido para o próprio | permitido para o próprio |
| perfil alheio | negado | negado | negado | negado |
| campanha vinculada | negado | leitura | leitura/administração definida | negado |
| personagem próprio | negado | leitura e operações do proprietário | conforme vínculo | negado |
| personagem de jogador da campanha | negado | negado | leitura e RPCs granulares | negado |
| membros da campanha | negado | somente a própria associação | leitura da própria campanha | negado |
| rolagens | negado | conforme visibilidade | conforme visibilidade da própria campanha | negado |
| histórico, presença e sessões | negado | negado | leitura da própria campanha | negado |

## Ao criar uma tabela pública

Toda nova tabela exposta precisa de uma migration que, na mesma transação:

1. crie a tabela, constraints e índices;
2. habilite RLS imediatamente;
3. revogue todos os grants de `PUBLIC`, `anon` e `authenticated`;
4. devolva somente as operações e colunas necessárias;
5. crie policies específicas por operação e papel;
6. adicione testes permitidos e negados;
7. verifique o comportamento pela API, não apenas como proprietário do banco;
8. inclua a tabela no inventário e nos testes de ausência de acesso anônimo.

Uma tabela nova não deve ser publicada no Realtime antes de sua policy de
leitura estar validada.

## Ao criar ou alterar uma RPC

Uma função privilegiada deve:

- exigir `auth.uid()` não nulo;
- obter proprietário e campanha no banco, sem confiar nesses campos enviados
  pelo cliente;
- conferir o papel na campanha exata;
- aceitar somente os campos estritamente necessários;
- validar limites e revisão concorrente;
- usar `security definer` somente quando necessário;
- fixar `search_path` seguro e qualificar os objetos usados;
- revogar execução de `PUBLIC` e `anon`;
- conceder execução apenas ao papel necessário;
- ter teste legítimo e pelo menos um ataque com UUID conhecido.

Metadata de usuário, nome exibido e valores enviados pelo frontend não podem ser
usados como prova de autorização.

## Comandos de validação

Com o servidor local experimental iniciado e vazio:

```powershell
.\marufia-server\scripts\verify-schema.ps1 -RequireEmptyData
.\marufia-server\scripts\test-rls.ps1
.\marufia-server\scripts\test-schema-security.ps1
```

O primeiro comando confere o inventário; o segundo ataca a API com contas reais
descartáveis; o terceiro executa os 35 testes SQL em transação. Todos devem
terminar sem dados remanescentes.

O teste de API recusa endereços externos e bancos não vazios. Não o adapte para
produção. A suíte remota SQL usa rollback integral e deve continuar sendo
executada somente pelo fluxo controlado já existente.

## Critérios para aceitar uma mudança

Uma alteração de segurança só pode ser aceita quando:

- o caminho legítimo continua funcionando;
- outro jogador recebe zero linhas ou erro de permissão;
- outro Mestre não atravessa a campanha;
- chamadas anônimas são negadas;
- alteração direta de papel, proprietário e metadados protegidos é impossível;
- o teste deixa o banco no mesmo estado anterior;
- nenhuma chave administrativa aparece em cliente, log, diff ou relatório;
- o Supabase Cloud permanece disponível como fallback durante o desenvolvimento.

## Se um teste falhar

1. interrompa a fase e preserve a saída sem tokens ou dados pessoais;
2. confirme se a falha veio de grant, policy ou validação da RPC;
3. não contorne a falha com verificações no frontend;
4. corrija em uma migration pequena e transacional;
5. repita o ataque que revelou a falha;
6. execute novamente todas as suítes local e remota;
7. documente impacto e rollback antes do commit.

Se uma falha for encontrada depois da publicação, desative o caminho afetado,
preserve evidências e troque qualquer chave que possa ter sido exposta. Não
apague dados para ocultar divergências.

## Revisão periódica

Repetir a inspeção de RLS quando houver:

- tabela, view, RPC, trigger ou papel novo;
- alteração de campanhas, papéis ou permissões do Mestre;
- mudança no Auth ou nas chaves JWT;
- atualização relevante do PostgreSQL, PostgREST ou Supabase;
- restauração de backup ou migração de máquina;
- incidente de segurança ou comportamento de acesso inesperado.

Referências: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
e [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
