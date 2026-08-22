# Contrato do produto — Fases 67 a 71

## Fase 67 — Resultado final esperado

```text
                  MARUFIA SERVER

                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼

   MARUFIA.EXE      MARUFIA.EXE     MARUFIA.EXE

    Jogador A        Jogador B         Mæstre
       │               │               │
       └───────────────┴───────────────┘

                 mesma campanha
```

O servidor compartilhado, as três identidades isoladas e a mesma campanha são cobertos pela simulação multiusuário. O executável Windows reutiliza a mesma ficha web e as mesmas regras validadas.

## Fase 68 — Experiência do Jogador

```text
Abrir Marufia
↓
Entrar na conta
↓
Selecionar personagem
↓
Selecionar campanha
↓
Usar ficha
↓
Rolar
↓
Fechar programa
```

O Jogador não precisa entender GitHub, Supabase, banco de dados, servidor ou terminal. O início oferece **Minhas fichas**, **Campanhas** e entrada por código; a ficha permanece local e a rolagem vinculada chega aos participantes autorizados.

## Fase 69 — Experiência do Mæstre

```text
Abrir Marufia
↓
Campanhas
↓
A Coroa Partida
↓
Painel do Mæstre
```

O painel apresenta personagens e seus PV/PM, presença, histórico e sessões simples. **Rolagens ao vivo** mostra personagem, perícia, resultado e desfecho conforme a visibilidade autorizada. O papel de Mæstre é conferido separadamente em cada campanha.

## Fase 70 — Princípio do produto

O Marufia Online não precisa inicialmente concorrer com Foundry VTT, Roll20 ou Fantasy Grounds. Seu objetivo específico é ser a ficha digital multiplayer própria de Marufia, instalada no computador dos jogadores, sincronizada pela internet e acompanhada em tempo real pelo Mæstre.

## Fase 71 — Ordem absoluta

1. Auditar projeto.
2. Garantir funcionamento atual.
3. Organizar persistência.
4. Preparar Supabase.
5. Autenticação.
6. Campanhas.
7. Personagens.
8. Migração local.
9. Salvamento remoto.
10. Sincronização.
11. Realtime.
12. Rolagens.
13. Painel do Mæstre.
14. Permissões.
15. Offline.
16. Segurança.
17. Testes.
18. Tauri.
19. Executável.
20. Alpha.

Essa ordem permanece como registro arquitetural. Qualquer inversão futura exige justificativa técnica explícita.
