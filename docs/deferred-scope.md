# Escopo adiado — Fase 52

O MVP da Fase 51 foi aprovado, mas isso não transforma expansões grandes em prioridade imediata. A Fase 52 protege o foco do Marufia Online: estabilidade no Windows, persistência local e remota, contas, campanhas, personagens, rolagens, painel do Mæstre, segurança e recuperação de falhas.

## Não priorizar agora

Os 17 recursos abaixo permanecem adiados:

1. mapas;
2. tokens;
3. grid;
4. iluminação;
5. voz;
6. vídeo;
7. marketplace;
8. mods;
9. Steam;
10. Android;
11. iOS;
12. IA;
13. Discord;
14. música;
15. chat complexo;
16. criação de mapas;
17. animações pesadas.

Um item adiado só pode entrar no produto por uma fase futura explicitamente autorizada, com objetivo, riscos, interfaces e critérios de aceitação próprios. Até lá, ele não recebe tela, rota, tabela, permissão, segredo, dependência, alvo de build ou integração externa.

## Portão de escopo

`pnpm test:scope` confirma que a lista continua completa e procura no código de produção dependências e estruturas inequívocas desses sistemas, como motores de mapa, mídia em tempo real, SDKs de IA, Steam ou Discord e projetos móveis.

A checagem é intencionalmente específica. Palavras legítimas já usadas pelo produto — como token de sessão e CSS Grid — não são bloqueadas. O portão complementa a revisão de código e não substitui a autorização explícita de uma nova fase.
