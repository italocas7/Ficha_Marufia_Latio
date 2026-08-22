# Reservas futuras — Fases 53 a 56

Estas fases estão concluídas como decisões de produto, não como implementação. Nenhum dos sistemas abaixo entra no Alpha atual.

## Fase 53 — Futuro: Android

Android só pode ser considerado depois que a versão Windows estiver estável e mediante uma fase explicitamente autorizada.

A arquitetura atual evita bloquear esse futuro porque a ficha permanece web, o estado versionado e as regras continuam independentes do invólucro Tauri. O alvo de distribuição atual permanece exclusivamente Windows/NSIS. Não existe projeto, alvo de build, plugin ou permissão Android no produto.

## Fase 54 — Futuro: combate

Permanecem fora do MVP:

- iniciativa compartilhada;
- ordem de turno;
- controle de NPCs;
- dano remoto;
- condições como sistema completo de combate;
- combate sincronizado.

As ações granulares já autorizadas para o Mæstre — como ajustar PV e adicionar ou remover uma condição na ficha — não criam iniciativa, turnos, NPCs nem automação de dano. Elas permanecem com o comportamento e as permissões atuais.

## Fase 55 — Futuro: compêndio

Podem ser considerados posteriormente:

- itens;
- magias;
- talentos;
- criaturas;
- regras;
- bestiário;
- biblioteca de Marufia.

Isso significa um compêndio online futuro. Os dados que já fazem parte da ficha continuam em `data.js` e não são reinterpretados, duplicados em banco nem transformados em um novo sistema nesta fase.

## Fase 56 — Futuro: registro de sessão

O histórico poderá futuramente gerar:

- resumo da sessão;
- estatísticas;
- rolagens importantes;
- alterações de personagens.

O histórico e as sessões simples já existentes continuam como estão. Não foi adicionado gerador de resumo, análise estatística, classificação automática de rolagens ou relatório complexo.
