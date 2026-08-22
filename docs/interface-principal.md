# Interface principal — Fase 37

Depois de uma entrada explícita na conta, o Marufia Online apresenta um início único sem substituir a ficha aberta. Um botão **Marufia** no cabeçalho permite retornar a esse início a qualquer momento enquanto a sessão estiver conectada.

O painel oferece:

- **Minhas fichas**: lista resumida dos personagens da própria conta, com campanha, schema e última atualização;
- **Campanhas**: reutiliza a listagem e as rolagens já existentes;
- **Entrar em campanha**: abre diretamente o formulário seguro de código de convite;
- **Configurações**: reutiliza as configurações, importação e backup da ficha atual;
- **Painel do Mæstre**: aparece separadamente para cada campanha em que o vínculo da conta possui papel exato `gm`.

O início não muda o personagem carregado, não altera o JSON schema v5 e não cria um papel administrativo global. Recarregar uma sessão já restaurada mantém a pessoa na ficha; o painel abre automaticamente apenas depois de login ou cadastro concluído, e continua disponível pelo cabeçalho.

Em telas estreitas, os acessos passam para uma coluna e os rótulos dos controles do cabeçalho permanecem disponíveis a leitores de tela.
