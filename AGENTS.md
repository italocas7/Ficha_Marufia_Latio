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
