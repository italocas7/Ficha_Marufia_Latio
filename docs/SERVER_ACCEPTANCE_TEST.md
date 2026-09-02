# Teste de aceitação do Marufia Server

## Ensaio automatizado

O ensaio público usa `https://api.marufiarpg.org` e cria contas descartáveis no
servidor local. Nenhuma conta real do Cloud é copiada ou modificada.

O fluxo completo é executado com:

```powershell
.\marufia-server\scripts\test-public-clients.ps1 `
  -PlayerCount 5 `
  -IncludeOutage `
  -Confirmation "TESTAR-QUEDA-MARUFIA"
```

Durante alguns minutos o Marufia Server e o Tunnel ficam indisponíveis de
propósito. O script sempre tenta religá-los e remove as contas, campanhas,
fichas, rolagens e sessões descartáveis ao terminar.

O teste cobre:

- login público por HTTPS;
- um Mestre, cinco jogadores e uma conta externa simultâneos;
- entrada em campanha, criação e abertura de fichas;
- alteração de PV por Jogador e Mestre;
- rolagens e presença pelo Realtime;
- eventos de campanha e sessão;
- isolamento RLS da conta externa;
- ausência de eventos duplicados;
- duas escritas concorrentes com uma única versão aceita;
- parada real dos containers e do Tunnel;
- preservação da fila local durante a queda;
- retorno, prontidão efetiva do Realtime e persistência dos dados.

A chave administrativa é usada somente no loopback para preparar as contas
descartáveis. Ela não é enviada ao executor dos clientes e não aparece em logs.

## Instalador de aceitação

O build self-hosted validado fica em:

```text
src-tauri/target/release/bundle/Marufia-Setup.exe
```

Confira o tamanho e o SHA-256 em:

```text
src-tauri/target/release/bundle/windows-artifacts.json
```

O pacote é um Alpha sem assinatura digital. O Windows pode mostrar um aviso; a
proteção do sistema não deve ser desativada. Esse instalador é somente para o
ensaio privado e não é a release pública do Cloud.

## Validação em segundo computador físico

Esta é a única parte que não pode ser substituída por clientes simulados.

1. No computador do Mestre, abra o gerenciador e confirme todos os itens online.
2. Copie `Marufia-Setup.exe` e `windows-artifacts.json` para o computador B.
3. No computador B, confira o SHA-256 antes de instalar.
4. Instale o Marufia e crie uma conta descartável com um email acessível.
5. Confirme o email recebido; depois retorne ao aplicativo Windows e faça login.
6. No computador A, use outra conta self-hosted como Mestre e crie uma campanha.
7. No computador B, entre na campanha, abra uma ficha, altere PV e faça uma rolagem.
8. Confirme no computador A que ficha e rolagem chegaram imediatamente.
9. Pare o servidor pelo gerenciador; no B, altere novamente a ficha e confirme a
   mensagem de modo offline.
10. Inicie o servidor; aguarde a reconexão e confirme a sincronização sem perda.
11. Com dados de teste ainda presentes, reinicie o Windows do computador A,
    inicie o servidor e confirme novamente a ficha no B.
12. Faça um backup final e execute a restauração de teste.

Para garantir que o caminho é realmente externo, conecte o computador B por
outra rede, como o ponto de acesso de um celular. Não abra a porta 5432.

Anote horário, resultado e qualquer mensagem vista. Só depois de todo esse fluxo
o backend padrão poderá ser trocado do Cloud para o Marufia Server.
