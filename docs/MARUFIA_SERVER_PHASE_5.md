# Marufia Server — Fase 5: autenticação

## Resultado

O Supabase Auth self-hosted foi validado no ambiente experimental local sem
copiar contas, senhas ou sessões do Supabase Cloud. O fluxo existente do cliente
continua inalterado e o Cloud permanece sendo o backend padrão do aplicativo.

Foram aprovados:

- cadastro por email e senha;
- criação automática do registro em `public.profiles`;
- login correto e recusa de senha incorreta;
- sessão com access token e refresh token;
- renovação do access token;
- logout e novo login;
- JWT local assinado com ES256 e papel `authenticated`;
- isolamento do perfil de outra conta por RLS;
- criação de campanha pelo Mestre e entrada do Jogador por código;
- papéis `gm` e `player` derivados de `campaign_members`.

As duas contas, campanha e associações criadas pelo teste foram descartadas ao
final. Uma verificação posterior confirmou zero usuários e zero linhas de dados
locais.

## Fluxo preservado no aplicativo

O cliente já usa o SDK oficial do Supabase com `persistSession`,
`autoRefreshToken` e `detectSessionInUrl` habilitados. Ele oferece cadastro,
login, reenvio de confirmação, restauração de sessão, escuta das mudanças de
autenticação e logout.

Redefinição de senha não existe atualmente no Marufia. Ela não foi adicionada
nesta fase para não ampliar ou alterar as funcionalidades do aplicativo. Quando
for implementada, deverá usar o mesmo domínio público, SMTP e lista de redirects
validados para confirmação de conta.

Os privilégios de Mestre e Jogador não ficam gravados no token como um papel
global. Eles pertencem a cada campanha e são obtidos de `campaign_members`,
preservando a autorização definida nas migrations e nas policies RLS.

## Sessões e chaves

O servidor experimental gera seu próprio conjunto de chaves. As sessões locais
usam JWT ES256 e não reutilizam o segredo JWT do Supabase Cloud.

Como consequência segura, access tokens e refresh tokens emitidos pelo Cloud não
serão aceitos pelo servidor próprio. No corte futuro, cada pessoa precisará fazer
login novamente. Isso não exige trocar a senha caso `auth.users`, identidades e
os hashes de senha sejam restaurados corretamente.

Somente a chave pública apropriada ao cliente foi usada pelos testes HTTP. Chave
secreta, `service_role`, senha de banco, JWT secret, senhas de usuários e tokens
de sessão não são escritos em logs nem enviados ao frontend.

## Email e SMTP

No ambiente estritamente local, a confirmação automática está habilitada apenas
para permitir testes descartáveis sem serviço de email. Essa combinação é
recusada automaticamente quando `SUPABASE_PUBLIC_URL` não aponta para loopback.

Antes de publicar o Auth na internet será obrigatório:

1. definir `ENABLE_EMAIL_AUTOCONFIRM=false`;
2. configurar um provedor SMTP real no `.env` privado;
3. usar remetente e domínio válidos;
4. usar HTTPS em API, site e redirects externos;
5. testar entrega, confirmação, reenvio e expiração dos links.

O SMTP embutido de avaliação não é adequado para produção. Credenciais SMTP não
devem ser solicitadas em conversa, commitadas ou colocadas no aplicativo; devem
ser configuradas diretamente no `.env` ignorado pelo Git.

## Proteções adicionadas

As validações compartilhadas dos scripts agora impedem:

- URL externa sem HTTPS;
- confirmação automática de email em servidor externo;
- publicação externa sem as variáveis SMTP obrigatórias;
- SMTP local ou remetente `.invalid` em servidor externo.

O comando abaixo valida o Auth somente em `localhost`/`127.0.0.1`, cria duas
contas aleatórias e sempre tenta removê-las:

```powershell
.\marufia-server\scripts\test-auth.ps1
```

O teste não deve ser executado contra o Cloud ou contra o futuro ambiente de
produção.

## Compatibilidade das contas existentes

O procedimento oficial de restauração preserva `auth.users`, identidades e
hashes de senha junto com o banco. Entretanto, nenhuma conta real foi copiada
nesta fase. O ensaio deverá ocorrer primeiro em uma instância isolada, com
backup anterior, versões compatíveis e conferência dos vínculos entre
`auth.users`, `profiles` e os dados das campanhas.

O roteiro completo e o rollback estão em
`docs/SERVER_AUTH_MIGRATION.md`. Referências oficiais:

- [Restore Platform Project to Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Migrating Auth users between projects](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects)
- [Auth configuration for self-hosting](https://supabase.com/docs/guides/self-hosting/auth/config)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

## Testes executados

| Verificação | Resultado |
|---|---|
| Auth local completo com duas contas descartáveis | OK |
| Perfil automático e isolamento entre contas | OK |
| Papéis Mestre/Jogador por campanha | OK |
| Senha incorreta | negada |
| Refresh e logout | OK |
| Limpeza das contas e dados temporários | OK |
| Schema local vazio após o teste | OK |
| 35 testes transacionais locais de RLS | OK |
| 35 testes transacionais remotos de RLS | OK |
| 12 testes Python | OK |
| 376 testes JavaScript | OK |
| Smoke test desktop e celular | OK |

O Auth Cloud continuou saudável e o Realtime Cloud continuou conectando. A Data
API Cloud permanece com o `503/PGRST002` preexistente e já registrado desde a
Fase 0; essa condição não foi causada pela Fase 5.

## Rollback

O rollback de código é a reversão do commit único da Fase 5. Isso remove o teste
e as novas validações, mas não toca no banco.

Não há rollback de dados desta execução porque todas as contas e linhas
descartáveis foram removidas e nenhuma conta Cloud foi importada. Se uma futura
migração de contas falhar, deve-se abandonar a instância de ensaio ou restaurar
o backup feito imediatamente antes dela; nunca se deve corrigir a produção
apagando ou recriando contas automaticamente.

## Limites e próxima etapa

Esta fase valida a compatibilidade funcional do Auth no servidor experimental.
O SMTP real depende do domínio e da publicação segura das Fases 8–9, e o ensaio
com as contas de produção depende de um backup controlado no momento da migração.

A próxima fase é a Fase 6 — Row Level Security. Ela deve preservar as policies
atuais e ampliar a evidência de que requisições alteradas manualmente não
atravessam os limites entre usuários e campanhas.
