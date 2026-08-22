# Teste multiusuário simulado — Fase 40

`pnpm test:multiuser` executa uma campanha completa com três sessões autenticadas e isoladas:

- um Mæstre;
- o Jogador A;
- o Jogador B.

As três identidades usam os serviços reais de campanhas, personagens, painel do Mæstre, sincronização em tempo real e rolagens. Um servidor Supabase falso, compartilhado somente dentro do teste e mantido em memória, reproduz autenticação, revisões, papéis, RPCs e entrega seletiva de eventos. Nenhuma conta, campanha, personagem ou rolagem é criada no projeto Supabase remoto.

## Fluxo verificado

1. O Mæstre cria a campanha.
2. A entra pelo código.
3. B entra pelo mesmo código.
4. A cria e associa seu personagem.
5. B cria e associa seu personagem.
6. A altera o próprio PV.
7. O Mæstre recebe a nova revisão em tempo real.
8. O Mæstre altera o PV de B pela ação protegida do painel.
9. B recebe a alteração e a origem `gm` em tempo real.
10. A faz uma rolagem pública.
11. O Mæstre recebe a rolagem.
12. B faz uma rolagem pública.
13. O Mæstre recebe a rolagem.

As rolagens públicas de A e B também são entregues ao outro jogador, preservando o fluxo público da campanha além da recepção do Mæstre. O teste confirma, ao final, uma campanha, três vínculos com os papéis corretos, dois personagens e duas rolagens. O arquivo entra automaticamente na descoberta da suíte geral e na matriz da Fase 39.
