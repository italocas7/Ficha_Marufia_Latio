# Próxima versão — preparação local

Estado: **v0.4.1 em preparação**.

## Artefatos preparados

- Site: `dist/client/` (pacote estático gerado novamente após os testes).
- Windows: `src-tauri/target/release/marufia-online.exe` (compilação de conferência; não é o instalador assinado).
- Banco: migrações de espaços de ficha, limite de perícias por campanha e resumo seguro do grupo.

## Validação local em 01/10/2026

- Testes de lógica iniciais: aprovados; 477 testes JavaScript e 12 testes Python.
- Build do site, navegador, servidor, aplicativo Windows e release: pendentes da etapa final de publicação.

## Próxima publicação

1. Atualizar o número da próxima versão no contrato do produto.
2. Gerar e validar os novos artefatos Windows.
3. Publicar primeiro a GitHub Release e só depois atualizar os manifestos públicos.

Até o novo build assinado terminar, os artefatos Windows públicos continuam pertencendo à release `v0.4.0`.
