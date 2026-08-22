# Backups — Fase 34

A exportação e a importação JSON clássicas permanecem inalteradas. Backups locais automáticos continuam sendo criados antes de importações, restaurações e da primeira cópia enviada à conta.

## Formato online

**Baixar backup online** cria o envelope versionado `marufia-online-character-backup` v1. Ele contém:

- o estado integral da ficha no schema atual;
- nome e versão para identificação;
- horário da exportação;
- metadados online informativos quando disponíveis.

Identidade do proprietário, papel e permissões não fazem parte do estado restaurado. Identificador, campanha, revisão, origem e horário online são ignorados como autoridade durante a importação. A associação efetiva continua sendo decidida pela conta autenticada e pelas políticas do servidor.

O importador aceita três origens sem alterar o schema v5 resultante:

- JSON clássico da ficha;
- envelope de backup online v1;
- registro de personagem exportado da camada online que contenha `state` válido.

Versões futuras desconhecidas, divergência entre `schema_version` e o documento ou estruturas inválidas são recusadas antes de qualquer substituição. O fluxo de revisão, mesclagem, cancelamento e backup anterior continua sendo o mesmo.
