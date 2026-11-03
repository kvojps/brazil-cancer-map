# 07: Seletor de Tipo de câncer (60 dias nos 5 tipos)

**What to build:** o cidadão escolhe o Tipo de câncer no topo do mapa: Todos os cânceres, mama, colo do útero, próstata, colorretal ou pulmão, e o 60 dias é repintado para o tipo. A nota sobre "Todos os cânceres" aparece junto ao seletor. Referência: spec, seções 3, 5, 6.3 e 11.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** ready-for-agent

- [ ] O pipeline gera o 60 dias, a Tendência, a cascata e a faixa A/B/C para cada um dos 5 tipos
- [ ] O seletor de tipo funciona pelo teclado e troca a camada do mapa via `feature-state`
- [ ] A nota de "Todos os cânceres" aparece junto ao seletor com o texto aprovado da seção 11.2
- [ ] A próstata não tem Situação e leva a ressalva fixa de que a vigilância ativa é conduta correta
