# Migração e rollback do Supabase Auth

Este documento define o procedimento futuro para levar as contas do Supabase
Cloud ao Marufia Server. Ele não autoriza uma migração imediata e não contém
credenciais.

## Princípios

- manter o Cloud funcionando até a validação integral do servidor próprio;
- nunca apagar, recriar ou redefinir contas automaticamente;
- preservar IDs de `auth.users`, identidades e hashes de senha;
- restaurar Auth junto com os vínculos das tabelas públicas;
- usar chaves JWT novas no Marufia Server;
- exigir novo login no corte, sem prometer preservar sessões antigas;
- testar restauração e rollback antes de tocar nos dados definitivos.

## O que pode ser preservado

Um dump completo compatível pode preservar:

- `auth.users` e os hashes de senha;
- `auth.identities` e os provedores vinculados;
- metadados de usuário;
- IDs usados por `profiles`, campanhas, membros, personagens e eventos;
- schema, funções, triggers, policies e RLS.

JWT secret, chaves de assinatura, configurações SMTP, templates de email, URLs,
DNS e serviços externos são configuração do novo ambiente e não devem ser
copiados cegamente do Cloud.

## Efeito para os jogadores

As senhas podem continuar válidas se os registros Auth forem restaurados
corretamente. As sessões abertas no Cloud não migram: access tokens e refresh
tokens antigos foram assinados por outra infraestrutura. Após o corte, o
aplicativo deve limpar ou substituir a sessão anterior e solicitar um novo login
no endpoint configurado para o Marufia Server.

## Ensaio obrigatório

Antes da migração definitiva:

1. registrar as versões de PostgreSQL e Supabase Auth de origem e destino;
2. fazer e verificar um backup completo da origem;
3. criar uma segunda instância self-hosted isolada, sem acesso de jogadores;
4. restaurar schema, Auth e dados conforme o procedimento oficial;
5. garantir que triggers de cadastro não criem perfis duplicados durante a
   restauração;
6. conferir contagens sem imprimir emails, hashes ou metadados pessoais;
7. conferir vínculos entre `auth.users`, `profiles`, `campaign_members`,
   `characters` e demais referências;
8. testar login de contas de teste previamente autorizadas;
9. testar perfil, campanhas, permissões Mestre/Jogador, refresh e logout;
10. testar RLS, Realtime e Storage antes de aprovar o ensaio;
11. destruir somente a instância descartável depois de reter o relatório e o
    backup necessário.

No ambiente atualmente fixado, o serviço Auth é `supabase/gotrue:v2.189.0`. A
versão deverá ser revisada novamente no dia da migração; atualizações de
containers e restauração de dados nunca devem ocorrer ao mesmo tempo.

## Preparação do corte

O corte só poderá começar quando Auth, Database, RLS, Realtime, Storage, Tunnel,
backup, restore e offline básico estiverem validados. Então:

1. comunicar uma janela de manutenção;
2. impedir novas escritas por um período curto e controlado;
3. criar o backup final e validar seu índice/hash;
4. restaurar em uma instância limpa e versionada;
5. executar health checks e testes funcionais;
6. trocar a configuração pública/DNS;
7. orientar novo login;
8. manter o Cloud intacto durante o período de observação.

## Verificações de integridade

O corte deve ser recusado se qualquer uma destas verificações falhar:

- contagem ou IDs de usuários divergentes sem explicação;
- usuário sem perfil esperado;
- referência pública sem usuário correspondente;
- duplicação de email/identidade;
- hash de senha ausente em conta que deveria usar email e senha;
- papéis de campanha divergentes;
- login, refresh, logout, RLS ou Realtime com falha;
- SMTP incapaz de entregar confirmação/reenvio;
- backup final sem validação ou restauração não ensaiada.

As consultas de conferência não devem exportar emails, tokens, hashes ou
metadados pessoais para logs.

## Rollback do corte

Se a validação falhar antes da troca pública, abandone a instância restaurada e
mantenha o Cloud como origem.

Se falhar depois da troca:

1. interrompa novas escritas no servidor próprio;
2. preserve um backup do estado com falha para diagnóstico;
3. reverta DNS/configuração para o Cloud;
4. confirme login e leitura no Cloud;
5. reconcilie separadamente qualquer escrita ocorrida durante a janela;
6. não restaure por cima do Cloud nem apague contas para forçar consistência.

O retorno ao Cloud é simples somente enquanto ele não tiver sido desativado e
enquanto não houver duas origens recebendo escritas simultaneamente. Por isso, o
plano de corte deve definir claramente qual backend aceita gravações em cada
momento.

## Referências oficiais

- [Restore Platform Project to Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Migrating Auth users between projects](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects)
- [Self-hosted Auth configuration](https://supabase.com/docs/guides/self-hosting/auth/config)
- [Self-hosted Auth keys](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
