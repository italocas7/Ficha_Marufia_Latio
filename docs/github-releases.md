# GitHub Releases

A entrega preparada atualmente é um **pré-lançamento** com estes dados:

- tag: `v0.2.3`;
- título: **Marufia Online Alpha 0.2.3**;
- notas: `docs/releases/v0.2.3.md`;
- portátil: `src-tauri/target/release/Marufia.exe`;
- instalador: `src-tauri/target/release/bundle/Marufia-Setup.exe`.

Antes de publicar, execute na mesma árvore limpa:

1. `pnpm test:version`;
2. `pnpm build:windows`;
3. `pnpm test:windows-security`;
4. `pnpm test:release`.

O comando de conferência da release compara versão, arquitetura, nomes, tamanhos e SHA-256 com as notas. A pasta `src-tauri/target` continua fora do Git; os dois executáveis são anexados diretamente à GitHub Release.

A tag e os arquivos só devem ser enviados ao repositório remoto depois de autorização explícita e autenticação do GitHub. A release com os executáveis deve existir antes de `app-update.json` ser publicado no site. Nunca inclua token, senha, chave privada ou certificado nas notas, no Git ou nos artefatos.
