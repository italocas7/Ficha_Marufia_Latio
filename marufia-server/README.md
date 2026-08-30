# Marufia Server

Esta pasta é a área exclusiva da infraestrutura que futuramente permitirá ao computador do Mestre hospedar o backend do Marufia.

## Estado atual

A Fase 2 cria somente a estrutura segura e o contrato de versionamento. O servidor ainda não pode ser iniciado: Docker Compose, imagens do Supabase e scripts operacionais serão adicionados e testados na Fase 3.

Não use a pasta `server/` para essa infraestrutura. Ela contém o Worker do site já publicado e continua fazendo parte do build web existente.

## Estrutura

```text
marufia-server/
├── .env.example       configuração pública de exemplo
├── .gitignore         proteção de segredos e dados locais
├── README.md           visão geral e limites da infraestrutura
├── supabase/           distribuição self-hosted e configuração futura
├── cloudflare/         configuração futura do Tunnel
├── scripts/            comandos futuros de operação no Windows
├── backups/            backups locais não versionados
├── logs/               logs locais não versionados
└── storage/            arquivos enviados ao Storage, não versionados
```

## Regras de segurança

- O Supabase Cloud atual continua funcionando e não é alterado por esta pasta.
- Arquivos `.env`, credenciais do Tunnel, backups, logs e dados de Storage nunca devem entrar no Git.
- A chave `service_role`, o segredo JWT e senhas pertencem somente ao servidor.
- O PostgreSQL permanecerá privado e não será publicado na internet.
- Somente arquivos de exemplo, migrations, configuração sem segredos e scripts revisados serão versionados.

## Próxima etapa

A Fase 3 selecionará uma versão estável da distribuição Docker oficial do Supabase, adicionará o Compose e criará os comandos Windows de iniciar, parar e verificar serviços. Nenhum placeholder executável é mantido nesta fase para evitar uma falsa indicação de que o servidor já está pronto.
