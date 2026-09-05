# Marufia Online Alpha — Fase 50

O primeiro Alpha permanece registrado historicamente como **Marufia Online Alpha 0.1.0**. O ciclo atual é **0.2.3** e fixa o Marufia Server como backend oficial do site e do aplicativo Windows, preservando a compatibilidade do schema v5 e os recursos online existentes.

## Escopo obrigatório

1. **Conta:** cadastro com perfil próprio.
2. **Login:** sessão persistente e saída segura.
3. **Campanhas:** criação e listagem conforme participação.
4. **Código de entrada:** convite gerado pelo servidor e entrada como jogador.
5. **Personagens:** criação, importação e associação à campanha.
6. **Ficha:** schema v5 e salvamento local prioritário preservados.
7. **Salvamento remoto:** escrita protegida por proprietário e revisão.
8. **Sincronização:** fila, debounce, modo offline, Realtime e conflitos.
9. **Rolagens online:** resultado e visibilidade definidos pelo servidor.
10. **Painel do Mæstre:** visão da campanha e operações granulares autorizadas.
11. **Permissões:** RLS, papéis por campanha e funções protegidas.
12. **Executável Windows:** portátil e instalador x64 com hashes verificados.

## Portão de aceitação

`pnpm test:alpha` confere a versão, executa os contratos dos doze recursos e valida os artefatos Windows existentes. Em uma máquina limpa, gere primeiro os arquivos com `pnpm build:windows`.

Os testes que consultam o projeto Supabase real permanecem deliberadamente opcionais. Para incluí-los em um ambiente já autorizado e configurado, execute o portão com `MARUFIA_ALPHA_REMOTE=1`.

O build oficial e a navegação real continuam sendo validados separadamente por `pnpm build:site` e `pnpm test:site`.

## Limite desta fase

O fluxo do MVP da Fase 51 é validado separadamente por `pnpm test:mvp`. A aprovação desse fluxo não inclui sistemas amplos de chat, mercado, mapa, áudio, vídeo, automação narrativa ou módulos adicionais de regras; qualquer expansão aguarda uma fase própria. A prioridade continua sendo estabilidade, segurança e preservação integral da ficha existente.

O aplicativo Windows permanece sem assinatura digital nesta etapa. O aviso do SmartScreen e a conferência do SHA-256 continuam obrigatórios conforme a documentação de segurança.
