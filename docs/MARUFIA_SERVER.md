# Marufia Server

## O que é

O Marufia Server permite que o computador do Mestre hospede o banco, contas,
sincronização em tempo real e APIs usados pelo Marufia. Os jogadores acessam o
serviço pela internet por uma conexão HTTPS protegida pelo Cloudflare Tunnel.
O PostgreSQL não é exposto à internet.

O Supabase Cloud continua disponível como ambiente de segurança durante a
validação. A troca definitiva só deverá ocorrer após o teste completo com Mestre
e jogadores em computadores diferentes.

## Antes de começar

O computador precisa ter Windows 10 ou 11, WSL 2, Docker Desktop e PowerShell
7.4 ou mais novo. Reserve pelo menos 4 GB de memória, dois núcleos e 40 GB de
disco para o servidor; 8 GB, quatro núcleos e 80 GB são recomendados.

O preparo técnico inicial e a configuração do domínio são documentados em
`marufia-server/README.md` e `docs/SERVER_PUBLIC_DOMAIN.md`. Os segredos ficam em
arquivos locais ignorados pelo Git e nunca devem ser enviados em conversa.

## Uso diário

Abra o painel a partir da pasta do projeto:

```powershell
.\marufia-server\scripts\server-manager.ps1
```

Use o menu para iniciar, parar, reiniciar, fazer backup, consultar a saúde ou
abrir o Studio. Parar o servidor reduz o uso de memória e processador e não apaga
nenhum dado.

Para uma checagem direta:

```powershell
.\marufia-server\scripts\health-check.ps1
```

Todos os itens devem aparecer como `OK`. A quantidade de jogadores considera
presenças recebidas nos últimos 90 segundos.

## Backup e restauração

Para criar um backup agora:

```powershell
.\marufia-server\scripts\backup.ps1
```

O backup diário das 18h está configurado nesta máquina. Ele mantém pontos de
sete dias distintos e quatro semanas distintas. Uma falha nunca é anunciada
como sucesso.

Uma restauração comum é testada primeiro em banco separado:

```powershell
.\marufia-server\scripts\restore.ps1
```

Restaurar o banco em uso exige confirmação explícita, backup preventivo e teste
isolado bem-sucedido. Consulte `docs/SERVER_BACKUP_AND_RESTORE.md` antes dessa
operação. Arquivos físicos do Storage, segredos e token do Tunnel precisam de
cópias próprias; atualmente o aplicativo não usa Storage.

## Inicialização automática opcional

O servidor permanece no modo manual por padrão. Para iniciá-lo no logon do
Windows:

```powershell
.\marufia-server\scripts\configure-startup.ps1
```

Para retornar ao modo manual:

```powershell
.\marufia-server\scripts\remove-startup.ps1
```

## Atualização segura

Não troque versões dos containers automaticamente. Antes de uma atualização:

1. faça um backup;
2. confirme que o restore de teste funciona;
3. registre as versões atuais;
4. aplique a atualização;
5. execute o health check e os testes;
6. retorne às versões anteriores se alguma validação falhar.

As imagens do Supabase estão fixadas, o que permite manter a versão conhecida
durante a investigação de um problema.

## Transferir para outro computador

Transfira o repositório, os backups verificados, os arquivos físicos de Storage
se um dia forem usados, o `.env` privado, a chave protegida do banco e a
configuração do Tunnel. Instale as dependências no novo computador, restaure um
backup em banco de teste e só então altere o Tunnel ou DNS.

Não desative o computador antigo nem apague o Cloud antes de confirmar Auth,
RLS, Realtime, backup e acesso externo na nova máquina.

## Problemas comuns

- `Docker não está em execução`: abra o Docker Desktop e aguarde concluir.
- Erro contendo `sailor-ingest.sock` ou `docker-secrets-engine/engine.sock`:
  execute `start-server.ps1` normalmente. O inicializador identifica somente
  essa falha conhecida, preserva as pastas temporárias defeituosas e tenta
  iniciar o Docker novamente sem resetar volumes. Nesta máquina, mantenha o
  Docker Desktop em 4.89.0 ou superior.
- Um componente aparece `FALHA`: abra os logs pelo gerenciador e execute o
  health check novamente.
- Tunnel offline com serviços locais online: verifique a internet e o estado do
  Tunnel; não abra a porta 5432 do roteador.
- Falha ao criar conta após demora no e-mail: aguarde alguns segundos e tente
  novamente. O Auth aceita até 30 segundos para o SMTP; o aplicativo distingue
  essa demora de uma queda real do servidor.
- Jogadores conectados mostra zero: isso é normal sem presença enviada nos
  últimos 90 segundos.
- CPU permanece muito alta mesmo sem tráfego: reinicie apenas o serviço REST e
  confirme que a camada Marufia está usando PostgREST 16.1. A versão 14.12 podia
  repetir indefinidamente um conflito de revisão da ficha; a versão ativa remove
  esse comportamento sem desabilitar a proteção contra sobrescrita.
- Backup inválido: preserve o arquivo, não tente forçar a restauração e use o
  ponto válido anterior.
- O servidor consome recursos durante outro jogo: pare-o pelo gerenciador. Manter
  WSL e Plataforma de Máquina Virtual habilitados, por si só, não mantém os
  containers em execução.

Para evitar sockets presos, sempre pare o Marufia Server pelo gerenciador antes
de desligar manualmente o Docker Desktop. Se o Windows reiniciar ou faltar
energia, a recuperação automática será executada no próximo início do servidor.
Nunca escolha **Reset to factory defaults** para este erro, pois isso pode remover
containers e dados locais.

## Segurança

Nunca copie `service_role`, JWT secret, senha do banco, token do Tunnel ou senha
SMTP para o aplicativo dos jogadores. Studio, PostgreSQL e portas internas
permanecem locais. O cliente recebe apenas a URL pública e a chave publicável.

Consulte também `docs/SERVER_MANAGER.md`,
`docs/SERVER_BACKUP_AND_RESTORE.md`, `docs/SERVER_PUBLIC_DOMAIN.md` e
`docs/SERVER_CLOUDFLARE_TUNNEL.md`.

## Validação final antes do corte

O ensaio automatizado pela internet, inclusive queda e reconexão, já está
disponível. O roteiro e o instalador para o segundo computador estão descritos
em `docs/SERVER_ACCEPTANCE_TEST.md`.

Não troque o backend padrão nem abandone o Supabase Cloud antes de concluir esse
roteiro em duas máquinas e confirmar a persistência após reiniciar o Windows do
computador do Mestre.
