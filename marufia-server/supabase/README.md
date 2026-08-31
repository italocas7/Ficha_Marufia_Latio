# Supabase Self-Hosted

`docker/` contém os arquivos necessários do snapshot oficial
`self-hosted/v0.8.0`. Eles não devem ser modificados diretamente.

- `UPSTREAM.md` registra release, commit e imagens;
- `SHA256SUMS` permite detectar alteração nos arquivos incorporados;
- `../docker-compose.marufia.yml` contém apenas o endurecimento próprio;
- migrations atuais do Marufia permanecem em `../../supabase/migrations/` e ainda
  não foram aplicadas a este runtime.

Essa separação permite comparar/atualizar a distribuição oficial sem misturar
configuração local nem migrar dados acidentalmente.
