# Distribuição Windows — Fase 44

O Marufia Online é distribuído em dois formatos equivalentes, ambos produzidos a partir da mesma ficha web validada:

- `Marufia.exe`: executável portátil, aberto sem instalação;
- `Marufia-Setup.exe`: instalador NSIS em português do Brasil, limitado ao usuário atual e sem exigir privilégios de administrador.

O instalador cria um atalho no menu Iniciar e inclui desinstalação normal do Windows. Se o WebView2 não estiver disponível, o instalador baixa silenciosamente o componente oficial da Microsoft. Nenhum comando nativo, acesso a arquivos ou permissão adicional é concedido à ficha.

## Geração

`pnpm build:windows` executa o build oficial do site, compila o aplicativo em modo release, cria o instalador NSIS e copia os resultados para nomes estáveis dentro de `src-tauri/target/release/`.

O arquivo `src-tauri/target/release/bundle/windows-artifacts.json` registra versão, tamanho e SHA-256 dos dois artefatos. A pasta `target` é local e não é versionada no Git.

## Verificação manual

1. Abra `Marufia.exe` e confirme a tela inicial.
2. Entre em uma ficha e teste as abas, campos, salvamento e botões principais.
3. Feche o executável, execute `Marufia-Setup.exe` e conclua a instalação.
4. Abra **Marufia Online** pelo menu Iniciar e repita o teste da ficha.
5. Remova o aplicativo em **Configurações > Aplicativos instalados** quando desejar.

O estado da assinatura digital e a orientação segura para o SmartScreen ficam em `docs/windows-security.md`.
