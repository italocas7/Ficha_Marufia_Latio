# Testes automatizados — Fase 39

`pnpm test:phase39` executa uma matriz única e falha imediatamente se qualquer etapa falhar. A matriz mantém explícitas as categorias de aceitação desta fase:

- estado;
- salvamento;
- migrações;
- autenticação;
- campanhas e entrada por código;
- personagens;
- sincronização;
- rolagens;
- permissões;
- operação offline;
- conflitos;
- interface e responsividade.

A execução começa pelos testes Python de dados e regras, continua por todos os contratos JavaScript e termina com o navegador real em 1440×900 e 390×844. A matriz de categorias impede que uma área de aceitação desapareça, enquanto a descoberta completa dos arquivos JavaScript garante que novos testes também entrem automaticamente. O teste de navegador cobre os fluxos completos usando um Supabase local simulado e isolado no próprio contexto do navegador.

## Banco remoto

As verificações do projeto Supabase vinculado continuam separadas porque exigem rede e credenciais locais. Para incluí-las na mesma execução, defina `MARUFIA_PHASE39_REMOTE=1`. Nesse modo, a matriz também executa a validação estrutural do banco e os 35 ataques transacionais da Fase 36.

O modo remoto não é necessário para trabalhar offline e não substitui os testes locais de RLS, permissões e migrations, que sempre são executados.

## Portões consolidados

As fases posteriores mantêm comandos menores para conferir contratos específicos:

- `pnpm test:alpha`: doze capacidades obrigatórias do Alpha e artefatos Windows;
- `pnpm test:mvp`: fluxo completo entre Mæstre e Jogador, incluindo fechamento e reabertura;
- `pnpm test:scope`: dezessete sistemas não prioritários mantidos fora do produto;
- `pnpm test:plan`: fechamento verificável das Fases 53 a 73.

`pnpm test` continua sendo a descoberta completa de testes Python e JavaScript. `pnpm build:site` executa essa suíte antes de gerar o pacote web, e `pnpm test:site` percorre a experiência real no navegador em desktop e celular.
