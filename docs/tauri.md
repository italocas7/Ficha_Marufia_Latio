# Aplicativo Windows — Fase 43

O Marufia Online usa Tauri 2 para empacotar exatamente a mesma ficha web validada nas fases anteriores. O frontend continua sendo produzido por `pnpm build:site` em `dist/client/`; nenhuma regra, tela ou formato de ficha é duplicado na camada Rust.

## Identidade e janela

- produto: Marufia Online;
- identificador: `com.marufia.online`;
- versão desktop atual: `0.2.1`, apresentada como **Marufia Online Alpha**;
- janela única, centralizada, redimensionável e com mínimo de 900 × 600;
- zoom nativo com `Ctrl` + `+`, `Ctrl` + `-` e `Ctrl` + `0`, preservando a adaptação dos cartões ao tamanho disponível;
- ícones derivados do brasão oficial da ficha.

## Segurança

A janela recebe uma única capacidade nativa pelo plugin oficial Opener: abrir no navegador padrão URLs sob `https://github.com/italocas7/Ficha_Marufia_Latio/releases/*`. Arquivos, shell, diálogos, caminhos locais e outras URLs permanecem bloqueados. A política de conteúdo permite somente arquivos locais, incluindo a ficha de leitura do Mæstre no mesmo aplicativo, o projeto público Supabase e a leitura do manifesto em `https://ficha-marufia-latio.italocas7.chatgpt.site/app-update.json`. Frames remotos continuam bloqueados. O build desktop reutiliza o backup local, o schema v5 e toda a lógica web existente.

## Aviso de atualização

Somente o aplicativo Tauri consulta o manifesto público. Quando a versão Alpha publicada é mais nova, ele espera qualquer outro modal terminar e mostra **Atualização disponível**. **Atualizar aplicativo** abre a GitHub Release oficial; **Agora não** dispensa o aviso até o aplicativo ser fechado. Não há download automático, chave privada, execução de instalador ou alteração dos dados da ficha.

## Comandos do projeto

- `pnpm test:tauri-config`: valida identidade, janela, ícones, política de conteúdo e a permissão limitada do Opener;
- `pnpm dev:desktop`: abre a ficha em uma janela Tauri para desenvolvimento;
- `pnpm build:desktop`: gera o executável Windows sem criar instalador;
- `pnpm build:windows`: gera a distribuição release e o instalador NSIS validados na Fase 44.

Os detalhes da distribuição e da verificação ficam em `docs/windows-build.md`.
