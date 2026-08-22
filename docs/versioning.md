# Versionamento — Fase 47

O produto adota [Semantic Versioning](https://semver.org/lang/pt-BR/) e está na versão **0.2.1**, com a identidade visível **Marufia Online Alpha**. O número canônico fica em `package.json` e precisa coincidir com Tauri, Cargo, o manifesto de atualização e a informação exibida no aplicativo.

Durante o desenvolvimento inicial:

- `0.1.0`: primeiro Alpha integrado;
- `0.2.0`: aviso seguro de novas versões no aplicativo Windows;
- `0.2.1`: correção da visualização completa de personagens no aplicativo Windows;
- `0.3.0` e demais versões `0.x`: novos ciclos compatíveis do Alpha;
- correções que não acrescentam capacidade usam o incremento de patch;
- `1.0.0`: primeira versão declarada estável, somente após os critérios de lançamento próprios.

O rótulo **Alpha** descreve o canal atual e não é acrescentado ao número `0.2.1`. Assim, o instalador conserva um número aceito pelo empacotamento Windows enquanto a interface comunica claramente que o produto ainda está em desenvolvimento.

## Contratos independentes

A versão do produto não substitui outros contratos técnicos:

- o schema da ficha permanece **v5**;
- o backup online permanece **v1**;
- as migrations do Supabase continuam ordenadas por **timestamp**;
- a versão da interface de rolagens permanece independente.

Incrementar o produto não altera automaticamente o JSON da ficha, o banco, probabilidades, permissões ou formatos de backup. Cada contrato só avança quando sua própria compatibilidade exigir.

## Processo de versão

1. Escolher o próximo número conforme a mudança realizada.
2. Atualizar o número canônico e sincronizar Tauri, Cargo, a informação de execução e `app-update.json`.
3. Executar `pnpm test:version`, o build oficial e a suíte de navegador.
4. Gerar novamente executável, instalador e hashes.
5. Publicar primeiro os executáveis e a GitHub Release; somente depois publicar o manifesto no site.

A tag, a release e o manifesto público só são enviados após autorização explícita. O aplicativo `0.1.0` não possui o verificador e precisa ser atualizado manualmente uma vez; a partir do `0.2.0`, versões futuras podem exibir o aviso.

A tag histórica `marufia-offline-baseline-v2.0.0` continua identificando a ficha offline anterior e não concorre com a linha `0.x` do Marufia Online.
