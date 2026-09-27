# Próxima versão — preparação local

Estado: **v0.4.0 publicada**. Este arquivo aguarda a próxima versão.

## Artefatos preparados

- Site: `dist/client/` (pacote estático gerado novamente após os testes).
- Windows: `src-tauri/target/release/marufia-online.exe` (compilação de conferência; não é o instalador assinado).
- Banco: `supabase/migrations/20260926010000_dice_tray.sql` (necessária para rolagens online da bandeja).

## Validação local em 27/09/2026

- `pnpm build:site`: aprovado; 462 testes JavaScript e 12 testes Python.
- `pnpm test:site`: aprovado em desktop e celular.
- `pnpm build:desktop`: aprovado; executável de conferência com versão `0.4.0`, sem instalador ou assinatura.
- `pnpm test:version` e `pnpm test:tauri-config`: aprovados.
- Verificação do site publicado e do servidor: **não concluída**, pois a conexão retornou `fetch failed` neste ambiente.
- `pnpm test:release`: aprovado; os artefatos correspondem à versão `0.4.0`.

## Próxima publicação

1. Atualizar o número da próxima versão no contrato do produto.
2. Gerar e validar os novos artefatos Windows.
3. Publicar primeiro a GitHub Release e só depois atualizar os manifestos públicos.

Os artefatos Windows atuais pertencem à release `v0.4.0`.
