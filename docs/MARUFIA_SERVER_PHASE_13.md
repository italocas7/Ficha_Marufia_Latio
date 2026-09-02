# Fase 13 — Teste com dois computadores e vários clientes

STATUS: Parcial

## Alterações

- criado um ensaio público descartável para Mestre, cinco jogadores e uma conta
  externa;
- adicionada queda controlada de servidor/Tunnel com recuperação automática;
- adicionada barreira autenticada que espera um evento real do Realtime após o
  reinício;
- gerado um instalador Windows de aceitação configurado para
  `https://api.marufiarpg.org`;
- corrigido o fechamento do `.env.local` durante a alternância Cloud/self-hosted;
- documentado o roteiro do segundo computador físico.

## Testes executados

- login e operações através do domínio HTTPS real;
- 7 clientes simultâneos no fluxo inicial e 8 na reconexão/conflito;
- cinco jogadores alterando fichas, presença e rolagens;
- alterações Mestre → Jogador e Jogador → Mestre;
- campanha, sessão e eventos Realtime;
- conta externa recebendo zero dado/evento da campanha;
- escrita concorrente com uma versão aceita e outra recusada;
- parada real de todos os containers e do Tunnel;
- 26 testes de ficha e rolagem offline enquanto o servidor estava parado;
- recuperação de Database, Auth, REST, Realtime, Storage e Tunnel;
- backup novo e restauração em banco isolado;
- suíte final com 12 testes Python e 424 testes JavaScript;
- build Windows com sua própria passagem de 12 testes Python e 418 JavaScript,
  antes da inclusão dos seis testes estáticos desta fase;
- integridade e segurança do executável e instalador Windows.

## Resultados

O servidor preservou os dados pela queda, voltou pela mesma URL e aceitou novas
operações. O Realtime precisou de uma tentativa adicional depois que os
containers já apareciam saudáveis; a nova barreira aguardou o primeiro evento
autenticado antes de liberar a continuação. Nenhum evento duplicado ou vazamento
para a conta externa foi observado.

O restore isolado reconstruiu schema, dados, Auth, RLS, RPCs e Realtime sem
alterar o banco em uso. Ao final, a contagem de dados descartáveis era zero e o
health check mostrava todos os seis componentes como `OK`.

O instalador self-hosted foi criado e passou na verificação de hash e de
segurança. Ele não foi promovido a release oficial: o gate de release recusou
corretamente hashes diferentes das notas do Alpha Cloud.

## Riscos e pendências

- falta executar o roteiro em um segundo computador físico e outra rede;
- falta reiniciar o Windows do computador do Mestre com dados de teste ativos;
- confirmação de email e redirecionamento precisam ser observados por uma pessoa
  no dispositivo B;
- o Realtime pode levar dezenas de segundos para retomar após reinício completo;
- o instalador de aceitação é Alpha sem assinatura digital;
- o Supabase Cloud continua como padrão e não houve corte definitivo.

## Rollback

O ensaio apaga suas contas e dados por cascade. O servidor pode voltar ao Cloud
com `select-client-backend.ps1 -Mode Cloud`; o perfil versionado nunca foi
alterado. Reverter o commit desta fase remove apenas o executor, testes e
documentação.

## Próximo passo

Executar `docs/SERVER_ACCEPTANCE_TEST.md` no segundo computador. Somente após
registrar sucesso em todos os itens será seguro decidir o corte do Cloud.
