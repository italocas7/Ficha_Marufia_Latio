# Autenticação do Marufia Online — Fase 8

A autenticação usa o cliente oficial do Supabase já configurado e não bloqueia o modo offline da ficha.

## Fluxos implementados

- criação de conta com nome exibido, email e senha;
- login por email e senha;
- restauração automática da sessão persistida pelo cliente oficial;
- leitura do próprio registro em `profiles`;
- logout somente deste dispositivo;
- mensagem específica quando o email ainda precisa ser confirmado;
- confirmação concluída numa página mínima do próprio Marufia Server, sem abrir a ficha hospedada nem depender do `127.0.0.1` do computador do Mæstre;
- reenvio do email de confirmação para contas que receberam um link antigo ou expirado;
- continuidade da ficha local quando o serviço online estiver indisponível.

## Integração posterior

Desde as Fases 15 a 18, uma ficha local pode ser importada para a conta, salva remotamente com debounce e acompanhada pelo indicador de sincronização no cabeçalho. Sem sessão, o indicador permanece `Offline` e o salvamento local continua independente.

Senhas são entregues diretamente ao Supabase e não são copiadas para o estado da ficha, `localStorage` da ficha, exports JSON ou logs. A sessão usa a chave isolada `marufia-online-auth-v1`, mantida pelo cliente oficial.

No ambiente self-hosted, o retorno é `https://<api>/auth-confirmed`. A página remove imediatamente o fragmento de autenticação da barra de endereço, não usa recursos externos e orienta a pessoa a voltar ao aplicativo. Um link antigo ou já utilizado mostra uma instrução para solicitar novo envio; um link válido confirma a conta antes de apresentar a página.

O perfil é criado pelo gatilho da Fase 7. O cliente autenticado pode ler somente o próprio perfil e editar apenas `display_name` e `avatar_url`.

## Testes

- `pnpm test:auth`: valida cadastro, login, recuperação, logout, mensagens e escaping.
- `pnpm test:e2e`: valida o fluxo completo no navegador com um Supabase isolado de teste.
- `pnpm test:supabase`: valida a saúde dos serviços reais sem criar usuários.
