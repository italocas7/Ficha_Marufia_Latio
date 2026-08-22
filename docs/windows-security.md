# SmartScreen e assinatura — Fase 45

## Estado atual

`Marufia.exe` e `Marufia-Setup.exe` foram verificados pelo Windows como `NotSigned`. Nenhum certificado comercial ou autoassinado foi adquirido, criado ou instalado. Por isso, o Alpha sem assinatura pode mostrar **Editor desconhecido** ou **O Windows protegeu o computador**. Isso é esperado para esta distribuição, não altera a ficha e não impede o teste em computadores cuja política permita continuar.

O SmartScreen considera a reputação do arquivo e do publicador. Como os artefatos atuais não têm assinatura, cada nova versão começa sem reputação própria. Uma assinatura válida identifica o publicador e permite construir reputação consistente, mas não garante que o primeiro download de uma versão nova fique sem aviso.

Na versão `0.2.0`, o aplicativo pode abrir somente páginas sob `https://github.com/italocas7/Ficha_Marufia_Latio/releases/*` no navegador padrão. O aviso não baixa nem executa arquivos, e não habilita shell, acesso ao sistema de arquivos ou outras URLs.

## Procedimento seguro para o Alpha sem assinatura

1. Aceite o arquivo somente quando ele vier diretamente do responsável pelo projeto.
2. Confirme o nome e o SHA-256 no arquivo `windows-artifacts.json` antes de abrir o programa.
3. Se aparecer apenas o aviso de aplicativo desconhecido, selecione **Mais informações**, confira o nome do arquivo e use **Executar assim mesmo** somente se a origem e o hash forem os esperados.
4. Se o antivírus identificar uma ameaça, o hash não coincidir, a origem for diferente ou uma política empresarial bloquear a execução, cancele e procure o responsável pelo projeto.

Não desative o SmartScreen, o Microsoft Defender ou qualquer outra proteção do Windows. Não instale certificados desconhecidos para contornar o aviso.

## Verificação do projeto

`pnpm test:windows-security` confere os hashes registrados, a estrutura PE dos dois arquivos e o estado Authenticode informado pelo Windows. Nesta fase, `NotSigned` é um resultado conhecido e documentado; uma assinatura futura só será aceita pelo verificador quando o Windows a classificar como válida.

## Decisão futura

A assinatura não é necessária para continuar este Alpha experimental. Antes de ampliar sua distribuição, o responsável poderá escolher, em uma fase separada, entre publicação MSIX pela Microsoft Store ou uma identidade de assinatura válida para distribuição direta. Essa decisão pode envolver cadastro, validação de identidade e custo; nenhuma dessas opções será ativada automaticamente.

Uma assinatura autoassinada não resolve a confiança pública do SmartScreen e, portanto, não será usada como atalho.

## Referências oficiais

- [Reputação do SmartScreen para desenvolvedores de aplicativos Windows](https://learn.microsoft.com/pt-br/windows/apps/package-and-deploy/smartscreen-reputation)
- [Opções de assinatura de código para desenvolvedores Windows](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
