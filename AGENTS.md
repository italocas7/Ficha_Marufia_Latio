# Instruções do Projeto — Ficha de Marufia Latio

Este projeto é uma ficha automática de RPG feita em HTML, CSS e JavaScript.

A prioridade máxima é preservar a mecânica existente da ficha.

Não alterar:

* Cálculos de atributos.
* Cálculos de PV, PM, CA ou Bloqueio.
* Regras de perícias.
* Regras de magias.
* Regras de Mundo.
* Inventário, armas ou dados internos.
* Estruturas de `data.js`.
* Funções de `app.js`, exceto se for absolutamente necessário para corrigir apenas ligação visual sem mudar comportamento.

Alterações permitidas:

* Melhorar layout.
* Melhorar responsividade.
* Melhorar aparência de cards, botões, abas, tabelas e campos.
* Integrar o arquivo `marufia_latio_design.css`.
* Ajustar o `index.html` para carregar o novo CSS.
* Manter as abas na área superior no desktop.
* Manter boa navegação no celular.

Regra de segurança:
Não refatorar o projeto inteiro.
Não recriar a ficha do zero.
Não trocar IDs, nomes de campos ou estruturas usadas pelo JavaScript sem extrema necessidade.

Ao finalizar, explique:

1. Quais arquivos foram alterados.
2. Se `app.js` ou `data.js` foram modificados.
3. Se a mudança foi apenas visual ou também funcional.
4. Como testar se as abas, campos e botões continuam funcionando.

## Governança do plano mestre

O usuário decide regras de Marufia. Pare e pergunte antes de alterar permanentemente atributos, recursos, permissões do Mæstre ou outra regra do RPG. Decisões normais de engenharia devem ser resolvidas tecnicamente sem interromper o usuário por detalhes pequenos.

Quando encontrar um problema: diagnostique, tente corrigir e teste novamente. Peça ajuda somente quando faltar uma conta, confirmação, permissão, credencial pública apropriada, teste físico ou decisão que realmente pertence ao usuário.

Nunca solicitar em conversa senha pessoal, `service role key`, token administrativo desnecessário, credencial privada do GitHub ou senha de email. Preferir login direto, variáveis de ambiente e ferramentas de autenticação.

Antes de uma ação destrutiva, criar backup e avaliar o impacto. Se houver risco real de perda, parar e avisar o usuário. Refatorar somente por motivo concreto, em alterações pequenas seguidas de testes.

Preservar compatibilidade com fichas antigas. Mudanças inevitáveis de formato exigem migração automática e backup anterior.

O usuário não é programador. Relatórios devem ser breves, explicar resultado, arquivos e testes e oferecer passos manuais numerados apenas quando inevitáveis. Trabalhar autonomamente dentro do escopo autorizado e testar cada fase antes de continuar.
