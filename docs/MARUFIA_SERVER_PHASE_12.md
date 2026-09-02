# Fase 12 — Marufia Server Manager

## Resultado

A administração básica do servidor agora possui um painel em PowerShell,
verificação completa de saúde, logs operacionais protegidos e inicialização
opcional junto do Windows. A configuração final desta máquina permanece manual.

## Health check

O verificador cobre:

- PostgreSQL por consulta SQL real;
- Auth pela rota de saúde com chave pública;
- REST e gateway pelo estado saudável dos containers;
- Realtime e Storage pelos respectivos health checks;
- Tunnel pelo gateway, `cloudflared` e Auth público por HTTPS;
- jogadores únicos com presença nos últimos 90 segundos;
- último backup com hashes e metadados válidos.

O ensaio real retornou `OK` para Database, Auth, REST API, Realtime, Storage e
Tunnel. O backup válido mais recente foi localizado corretamente.

## Gerenciador

`server-manager.ps1` oferece menu e ações diretas para status, início, parada,
reinício, backup, Studio e logs. O Studio abre somente em `127.0.0.1`.

Um reinício completo foi executado durante a validação. Os containers foram
recriados sem remoção de volumes, o Tunnel nomeado foi reconectado e todos os
componentes voltaram saudáveis.

## Logs e inicialização

Mensagens operacionais são sanitizadas antes da gravação. Testes com valores
falsos confirmaram a ocultação de senha, token, chave Resend, chave secreta do
Supabase e JWT. A rotação remove somente `operations-*.log` com mais de 90 dias.

A tarefa `Marufia Server Startup` foi instalada e removida em teste. Ela usa a
conta atual, privilégios limitados, inicia o Docker Desktop oculto quando
necessário e espera até cinco minutos. O estado final permaneceu
`Inicialização manual`.

## Segurança e rollback

- nenhum segredo é escrito pelo health check ou pelo painel;
- somente a chave publicável é usada no teste público de Auth;
- parar ou reiniciar não remove volumes;
- a inicialização automática não é habilitada sem escolha do Mestre;
- o rollback do código é a reversão do commit desta fase;
- o rollback operacional da inicialização é `remove-startup.ps1`.

## Próxima fase

A Fase 13 executará a validação de acesso real, múltiplos clientes, queda e
retorno do servidor e persistência. O teste conclusivo em dois computadores
físicos continuará dependendo de um segundo dispositivo conectado pela
internet.
