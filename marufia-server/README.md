# Marufia Server

Esta pasta hospeda o ambiente experimental que permitirá ao computador do Mestre
executar o backend do Marufia. Ela é independente de `server/`, que continua
sendo o Worker do site publicado.

## Estado da Fase 3

O runtime oficial do Supabase Self-Hosted está validado na release fixada
`self-hosted/v0.8.0`. PostgreSQL, Auth, REST, Realtime, Storage, Studio, gateway e
pooler iniciaram com imagens imutáveis e passaram pelos health checks locais.
Edge Functions permanecem desativadas porque o cliente não as utiliza.

O Supabase Cloud continua sendo o backend padrão do aplicativo. Esta fase não
migra schema, dados nem contas e não muda qualquer funcionalidade da ficha.

## Pré-requisitos no Windows

- Windows 10/11 compatível com Docker Desktop;
- Docker Desktop com Docker Compose `2.24.4` ou mais novo;
- PowerShell 7.4 ou mais novo para gerar os segredos;
- ao menos 4 GB de RAM, 2 núcleos e 40 GB SSD disponíveis para o ambiente;
- recomendado: 8 GB de RAM, 4 núcleos e 80 GB SSD.

Nesta máquina foram validados WSL `2.7.12`, Docker Desktop `4.88.1`, Docker Engine
`29.7.2` e Docker Compose `5.4.0`.

## Primeiro preparo

Execute uma única vez, a partir da raiz do projeto:

```powershell
.\marufia-server\scripts\setup-environment.ps1
```

O comando cria `marufia-server/.env` com senhas e chaves criptograficamente
aleatórias, sem mostrá-las na tela. Se o arquivo já existir, o comando para sem
sobrescrevê-lo. O `.env` é ignorado pelo Git.

Para usar outro endereço público ou site de retorno:

```powershell
.\marufia-server\scripts\setup-environment.ps1 `
  -PublicUrl "https://api.exemplo.com" `
  -SiteUrl "https://app.exemplo.com"
```

Use endereços externos somente depois da configuração do Tunnel nas Fases 8-9.

## Operação

```powershell
.\marufia-server\scripts\start-server.ps1
.\marufia-server\scripts\status-server.ps1
.\marufia-server\scripts\restart-server.ps1
.\marufia-server\scripts\stop-server.ps1
```

Parar ou reiniciar nunca usa `down -v`: banco, Storage e chaves permanecem
preservados. O primeiro início baixa imagens e pode demorar.

Quando o servidor não for necessário, execute `stop-server.ps1`. Isso encerra os
containers e reduz o uso de memória e processador; WSL e Plataforma de Máquina
Virtual permanecerem habilitados não equivale a manter o servidor em execução.

## Segurança desta configuração

- gateway HTTP, pooler e PostgreSQL são publicados somente em `127.0.0.1`;
- PostgreSQL não fica acessível pela rede local nem pela internet;
- o futuro Tunnel deverá apontar apenas para `http://127.0.0.1:8000`;
- Studio é protegido pelo usuário e senha aleatórios do `.env`;
- `service_role`, JWT, banco e chaves administrativas não são enviados ao cliente;
- confirmação automática de email é provisória no ambiente experimental; SMTP e
  compatibilidade das contas serão tratados na Fase 5;
- as Edge Functions não iniciam por padrão.

## Limite desta fase

O runtime está operacional apenas em `127.0.0.1` e ainda contém o banco inicial
do Supabase, sem o schema, dados ou contas do Marufia. O schema será restaurado em
ambiente experimental somente na Fase 4. Cloudflare Tunnel, domínio público,
backups e migração de contas continuam reservados às fases próprias.

Consulte `docs/MARUFIA_SERVER_PHASE_3.md` para decisões, testes e rollback.
