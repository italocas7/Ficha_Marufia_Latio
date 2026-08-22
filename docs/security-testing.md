# Testes de segurança — Fase 36

`pnpm test:security:remote` executa 35 verificações contra o projeto Supabase vinculado. O arquivo abre uma transação, cria três identidades isoladas (`gm`, Jogador A e Jogador B), testa as policies e termina obrigatoriamente em `ROLLBACK`.

Os casos cobrem:

- leitura de campanhas e personagens externos;
- salvamento de personagem alheio com UUID/revisão conhecidos;
- promoção do próprio `role` e inserção direta de vínculo `gm`;
- transferência de proprietário e associação a campanha externa;
- chamada direta das RPCs de Mæstre e de sessão por jogador;
- isolamento de presença, histórico, sessões e visibilidade de rolagens;
- operação legítima do proprietário e do `gm`, para evitar falso sucesso causado por aplicação inteiramente bloqueada.

O executor exige exatamente 35 resultados `ok` e falha quando encontra `not ok`, resumo incompleto ou relatório vazio. Uma consulta final confirma que usuários, campanhas e personagens temporários não permaneceram no banco.

O primeiro ciclo detectou que o gatilho de personagem ainda bloqueava a RPC legítima do Mæstre. A migration `20260820231000_allow_authorized_gm_character_writes.sql` corrigiu somente essa passagem: origem interna `gm`, papel exato na campanha atual e `campaign_id` imutável são obrigatórios.
