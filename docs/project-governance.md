# Governança do projeto — Fases 57 a 66 e 73

Estas regras orientam todas as próximas alterações do Marufia Online.

## Fase 57 — Decisões não técnicas

O usuário decide regras de Marufia. Se uma mudança puder alterar permanentemente atributos, recursos, permissões do Mæstre ou outra regra do RPG, o trabalho deve parar e a decisão deve ser perguntada ao usuário.

Detalhes normais de engenharia — índice, estrutura interna, nome de função, `const` ou `let` — são decididos tecnicamente sem transferir esse trabalho ao usuário.

## Fase 58 — Dúvidas técnicas

Pequenas escolhas técnicas não interrompem o usuário. A equipe escolhe a solução proporcional, registra o motivo quando ele for relevante e continua.

## Fase 59 — Problemas

Ao encontrar um erro:

1. diagnosticar;
2. tentar corrigir;
3. testar novamente.

Ajuda do usuário só é solicitada quando o resultado depende de algo que o ambiente realmente não possui.

## Fase 60 — Credenciais

Nunca solicitar em conversa senha pessoal, token administrativo desnecessário, `service role key`, credencial privada do GitHub ou senha de email. Preferir login direto, variáveis de ambiente, ferramentas de autenticação e credenciais públicas apropriadas.

## Fase 61 — Ações destrutivas

Antes de apagar banco, migration histórica, dados ou fichas, resetar o projeto ou reescrever grandes partes, criar backup e avaliar o impacto. Havendo risco real de perda, parar e avisar o usuário antes da ação.

## Fase 62 — Refatoração

Refatorar somente por um motivo concreto. A sequência padrão é pequena alteração, teste, pequena alteração, teste. Reescritas amplas sem necessidade comprovada permanecem proibidas.

## Fase 63 — Compatibilidade

Fichas antigas devem continuar funcionando sempre que possível. Mudanças inevitáveis de formato exigem migração automática, validação da versão de origem e preservação do backup anterior.

## Fase 64 — Relatório após cada fase

O relatório deve permanecer breve:

```text
FASE X CONCLUÍDA

Feito:
- ...

Arquivos principais:
- ...

Testes:
- ...

Resultado:
- ...

Próxima fase:
- ...
```

## Fase 65 — Quando parar e chamar o usuário

Parar somente quando houver dependência real de conta externa, confirmação de email, credencial pública, permissão, decisão de regra do RPG, teste físico, custo ou risco de perda. Fora dessas situações, continuar autonomamente.

## Fase 66 — Como falar com o usuário

O usuário não é programador. Explicar resultados e ações em linguagem simples. Quando uma ação manual for inevitável, fornecer passos numerados e curtos, sem exigir conhecimento de GitHub, banco, servidor ou terminal.

## Fase 73 — Regra final

Executar autonomamente tudo que estiver seguro e autorizado. Explicar exatamente o que falta quando houver dependência externa. Perguntar antes de decidir uma regra de Marufia. Testar cada fase antes de continuar e manter o usuário no papel de proprietário, Mæstre, testador e responsável pelas regras — não de programador.
