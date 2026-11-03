# 15: Citopatológico (SISCAN)

**What to build:** o mapa e a ficha ganham a razão de citopatológicos em mulheres de 25–64, no eixo Detecção precoce, para colo do útero e Todos, com a série encerrada em 2025. Referência: spec, seções 5, 6.1, 6.4, 9, 10 e 11.2.

**Blocked by:** 14 — Mamografia (SISCAN)

**Status:** ready-for-agent

- [ ] A razão é exames ÷ (mulheres de 25–64 ÷ 3), 2016–2025, reaproveitando o processamento do SISCAN do ticket 14
- [ ] A série fica congelada em 2025: o pipeline nunca acrescenta anos novos
- [ ] Tendência por quasi-Poisson com offset sobre 2016–2025; Referência = razão 1
- [ ] O indicador pinta o mapa nos dois modos, para colo e Todos
- [ ] O cartão diz "Série encerrada em 2025 pela mudança no rastreamento", com a ressalva do DNA-HPV, e traz a Ação do exame do colo, que explica a transição entre DNA-HPV e Papanicolau
- [ ] A metodologia ganha a seção do citopatológico, com o congelamento
