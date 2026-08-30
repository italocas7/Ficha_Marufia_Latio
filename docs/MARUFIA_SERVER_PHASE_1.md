# Marufia Server — Fase 1: backend configurável

## Resultado

O endereço do Supabase, a chave pública e o endereço de retorno deixaram de ficar escritos no arquivo-fonte do aplicativo. O site e o aplicativo Windows agora são gerados para um ambiente selecionado, sem alterar regras, dados ou migrations.

O Supabase Cloud atual continua sendo o perfil padrão. Para voltar a ele, basta remover overrides privados como `.env.local` e executar novamente o build. Nenhuma mudança foi feita no projeto Cloud.

## Ambientes aceitos

| Modo | Uso | Regra de endereço |
|---|---|---|
| `cloud` | operação atual e fallback | HTTPS externo |
| `local` | desenvolvimento na própria máquina | somente `localhost`/loopback |
| `selfhosted` | futuro Marufia Server | HTTPS externo ou loopback durante preparação |

Os arquivos `.env`, `.env.<ambiente>` e `.env.local` continuam ignorados pelo Git. O perfil Cloud versionado contém somente dados que já são públicos no navegador. Chaves administrativas são rejeitadas.

## Fluxo de geração

```text
perfil Cloud + arquivos .env privados + variáveis do processo
                              ↓
                    validação de segurança
                              ↓
               dist/client/src/online/project.js
                              ↓
          site e aplicativo usam o ambiente selecionado
```

O arquivo `src/online/project.js` sem build permanece desconfigurado de propósito. Isso evita que um endereço antigo se torne dependência invisível do código e preserva o modo local quando nenhum pacote online foi gerado.

No Windows, a mesma seleção gera a CSP usada pelo Tauri. Apenas as origens exatas de REST/Auth, Realtime e do site são liberadas; PostgreSQL e qualquer porta administrativa permanecem fora do cliente.

## Verificação e rollback

`pnpm build:site` executa os testes antes de gerar o pacote e confirma que o marcador interno de configuração não chegou à distribuição. `pnpm test:site` verifica também que o ambiente empacotado corresponde ao ambiente selecionado.

O rollback técnico desta fase consiste em reverter o commit `feat: add configurable backend endpoint`. Como a fase não altera banco, dados ou Supabase Cloud, não existe rollback de dados.
