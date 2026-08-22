# Preparação do Tauri — Fase 42

Tauri só pode começar depois de quatro confirmações sequenciais:

```text
Ficha funciona
↓
Site e backend funcionam
↓
Realtime funciona
↓
Tauri pode começar
```

`pnpm test:tauri-readiness` executa esse portão completo. Ele constrói a versão web a partir dos arquivos oficiais, testa o pacote em desktop e celular, confirma o endereço público, verifica Auth e Data API do Supabase e abre um canal Realtime de rolagens usando somente a chave pública. A assinatura Realtime não grava dados.

O pacote hospedado mantém os arquivos navegáveis em `dist/client/` e o Worker em `dist/server/`. Essa separação faz parte do contrato de publicação e é validada antes de qualquer nova versão ser salva.

O portão remove ao final apenas `dist/` e `dist.next/`, inclusive quando uma etapa falha. Assim, o build offline continua detectando qualquer artefato duplicado inesperado.

## Limite desta fase

A Fase 42 não cria `src-tauri`, não instala pacotes `@tauri-apps`, não define permissões de desktop e não gera executável. Esses trabalhos pertencem às Fases 43 e 44. Se qualquer verificação web, de backend ou de Realtime falhar, Tauri continua bloqueado até a causa ser corrigida na camada web.
