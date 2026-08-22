# MVP do Marufia Online — Fase 51

O MVP está definido pelo menor fluxo que permite iniciar e continuar uma campanha online sem perder dados. Esta fase não adiciona telas, regras de RPG ou sistemas paralelos.

## Critérios obrigatórios

1. O Mæstre cria uma conta, cria uma campanha e recebe o código de entrada.
2. O Jogador cria uma conta, usa o código e entra na campanha.
3. O Jogador cria ou importa um personagem e o vincula à campanha.
4. O Jogador altera a ficha e faz uma rolagem; o Mæstre recebe ambos.
5. O Mæstre altera o PV; o Jogador recebe a mudança.
6. Todos fecham o programa, abrem novamente e encontram campanha, ficha, PV e rolagem preservados.

## Portão de aceitação

`pnpm test:mvp` valida os seis critérios em uma simulação isolada com duas contas. O teste encerra as sessões e os canais, serializa o banco e o salvamento local e então cria novos clientes para a reabertura. As contas precisam entrar novamente antes que os dados persistidos sejam conferidos.

O teste também confirma que a senha em texto puro não entra no retrato persistido da identidade simulada. O schema da ficha permanece na versão 5.

O portão do MVP complementa, sem substituir, `pnpm test:alpha`, a suíte completa, o build oficial e os testes reais de navegador.

## Resultado esperado

Com os dois portões e a suíte completa aprovados, o Marufia Online atende ao MVP planejado. Recursos fora deste fluxo permanecem fora do escopo até uma fase posterior.
