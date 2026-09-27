# Próxima versão — preparação local

Estado: **não publicar ainda**. A versão `v0.4.0` está em preparação; os manifestos públicos continuam em `v0.3.1`.

## Artefatos preparados

- Site: `dist/client/` (pacote estático gerado novamente após os testes).
- Windows: `src-tauri/target/release/marufia-online.exe` (compilação de conferência; não é o instalador assinado).
- Banco: `supabase/migrations/20260926010000_dice_tray.sql` (necessária para rolagens online da bandeja).

## Validação local em 26/09/2026

- `pnpm build:site`: aprovado; 462 testes JavaScript e 12 testes Python.
- `pnpm test:site`: aprovado em desktop e celular.
- `pnpm build:desktop`: aprovado; executável de conferência com versão `0.4.0`, sem instalador ou assinatura.
- `pnpm test:version` e `pnpm test:tauri-config`: aprovados.
- Verificação do site publicado e do servidor: **não concluída**, pois a conexão retornou `fetch failed` neste ambiente.
- `pnpm test:release`: **reprovado como esperado**; os artefatos de instalador existentes ainda pertencem à versão anterior.

## Antes de publicar

1. Aplicar a migração ao banco de produção e validar as permissões das rolagens públicas e privadas.
2. Conferir a versão `0.4.0` no site, Tauri e Cargo, e finalizar `docs/releases/v0.4.0.md`.
3. Configurar localmente a chave de assinatura do atualizador fora do repositório e executar `pnpm build:windows`.
4. Validar o instalador, sua assinatura, os hashes e o pacote do site; testar o site publicado e o backend acessíveis pela rede.
5. Publicar primeiro a GitHub Release com os artefatos assinados; só depois atualizar os manifestos públicos e publicar o site.

**Não usar** `src-tauri/target/release/Marufia.exe` nem `src-tauri/target/release/bundle/Marufia-Setup.exe` nesta próxima release: ambos ainda são artefatos da compilação anterior, de 18/09/2026.
