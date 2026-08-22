# Aplicativo Windows — Fase 43

O Marufia Online usa Tauri 2 para empacotar exatamente a mesma ficha web validada nas fases anteriores. O frontend continua sendo produzido por `pnpm build:site` em `dist/client/`; nenhuma regra, tela ou formato de ficha é duplicado na camada Rust.

## Identidade e janela

- produto: Marufia Online;
- identificador: `com.marufia.online`;
- versão desktop inicial: `0.1.0`;
- janela única, centralizada, redimensionável e com mínimo de 900 × 600;
- ícones derivados do brasão oficial da ficha.

## Segurança

A janela não recebe nenhum comando IPC nativo. Não há plugins de arquivos, shell, diálogo, abertura externa ou logs. A política de conteúdo permite apenas arquivos locais e as conexões HTTPS/WebSocket do projeto público Supabase. O build desktop reutiliza o backup local, o schema v5 e toda a lógica web existente.

## Comandos do projeto

- `pnpm test:tauri-config`: valida identidade, janela, ícones, política de conteúdo e ausência de permissões nativas;
- `pnpm dev:desktop`: abre a ficha em uma janela Tauri para desenvolvimento;
- `pnpm build:desktop`: gera o executável Windows sem criar instalador;
- `pnpm build:windows`: gera a distribuição release e o instalador NSIS validados na Fase 44.

Os detalhes da distribuição e da verificação ficam em `docs/windows-build.md`.
