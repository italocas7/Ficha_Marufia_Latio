# Schema do Marufia

As migrations continuam tendo uma única fonte de verdade em
`../../supabase/migrations/`. `MIGRATIONS.sha256` fixa o conjunto revisado antes
de qualquer aplicação no banco self-hosted.

O executor recusa migrations ausentes, extras ou alteradas sem uma atualização
explícita do manifesto. Schema e dados são operações separadas: nesta fase o
arquivo `supabase/seed.sql` não é executado e nenhum conteúdo do Cloud é copiado.

Antes de aplicar qualquer migration pendente, o executor cria um dump integral
verificado em `../backups/`. Essa pasta é privada e ignorada pelo Git.
