# Contrato do estado da ficha — schema v5

Este documento registra o formato persistente já utilizado pela Ficha de Marufia (Latio). A Fase 3 não altera o conteúdo das fichas existentes nem cria uma nova versão.

## Identificação

- Aplicação: `meta.appId = "marufia-latio"`
- Versão atual: `meta.schemaVersion = 5`
- Versão antiga mínima aceita: `1`
- Formato: JSON (`application/json`)

O valor `meta.schemaVersion` pertence ao conteúdo da ficha. O nome histórico da chave de `localStorage`, `marufia-latio-state-v1`, permanece inalterado para não perder fichas já salvas.

## Estrutura persistente

O objeto central contém estas áreas de primeiro nível:

- `meta`: identidade, versão e datas da ficha;
- `character`: dados básicos do personagem;
- `attributes`: atributos;
- `resources`: PV, PM e estados relacionados;
- `settings`: preferências persistentes;
- `skills` e `skillExtraPoints`: perícias;
- `effects`: efeitos ativos;
- `inventory`: dinheiro, armas, equipamentos e proteção;
- `magic` e `magicCore`: progressão e núcleo mágico;
- `combat`: ações, registro local e magias ativas;
- `talents` e `abilities`: talentos e habilidades;
- `world`: estado e Leis de Mundo;
- `notes`: antecedentes e anotações;
- `errors`: erros locais exibidos ao usuário.

O estado temporário da interface, como aba aberta e janelas, fica fora desse objeto e não é persistido.

## Serialização

O salvamento local usa `JSON.stringify` sobre uma cópia segura do estado. A exportação usa o mesmo objeto, acrescentando somente `meta.exportedAt` ao arquivo exportado. A importação ignora campos desconhecidos e completa campos conhecidos ausentes com os valores padrão da versão atual.

## Validação mínima

Antes de aceitar uma ficha, a aplicação confirma:

1. objeto JSON válido;
2. `meta.appId` correto;
3. versão inteira entre 1 e 5;
4. ausência de chaves perigosas;
5. limites de profundidade, tamanho e coleções;
6. tipos e faixas dos campos conhecidos.

## Migrações existentes

- v1: converte o antigo indicador de Mundo ativo;
- v1–v2: remove o estado antigo de turno de Mundo e magias de Mundo legadas do combate;
- versões antigas: migra a perícia `Escalar` para `Atletismo` preservando pontos e evoluções;
- v1–v4: adiciona a duração atual de Mundo;
- todas: remove estado temporário `ui`, normaliza campos conhecidos e grava como v5.

Versões futuras são rejeitadas para evitar perda silenciosa de informações.
