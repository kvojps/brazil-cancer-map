# 07: Seletor de Tipo de câncer (60 dias nos 5 tipos)

**What to build:** o cidadão escolhe o Tipo de câncer no topo do mapa: Todos os cânceres, mama, colo do útero, próstata, colorretal ou pulmão, e o 60 dias é repintado para o tipo. A nota sobre "Todos os cânceres" aparece junto ao seletor. Referência: spec, seções 3, 5, 6.3 e 11.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** resolved

- [x] O pipeline gera o 60 dias, a Tendência, a cascata e a faixa A/B/C para cada um dos 5 tipos
- [x] O seletor de tipo funciona pelo teclado e troca a camada do mapa via `feature-state`
- [x] A nota de "Todos os cânceres" aparece junto ao seletor com o texto aprovado da seção 11.2
- [x] A próstata não tem Situação e leva a ressalva fixa de que a vigilância ativa é conduta correta

## Comments

Resolvido em `2d22323` (camadas dos 5 tipos no pipeline), `f11d778` (seletor no site e dados regenerados) e no commit que fecha este ticket (ajustes da revisão).

- Códigos do eixo de tratamento: mama C50, colo do útero C53, próstata C61, colorretal C18–C21, pulmão C33–C34 (pesquisa 10). A camada traz `has_status`, falso só na próstata; a Situação em si fica no ticket 08.
- **Texto da ressalva da próstata ainda precisa de aprovação.** Nenhum documento tinha o texto aprovado; o site usa por ora: "Na próstata, acompanhar o câncer antes de tratar (vigilância ativa) pode ser a conduta correta. Por isso, começar o tratamento depois de 60 dias não indica, sozinho, falta de acesso, e este indicador não é comparado ao prazo da lei: o mapa mostra só a Tendência." O texto diz "pode ser" (como a pesquisa 10, que fala da próstata de baixo risco), onde a spec diz "é conduta correta".
- A ressalva aparece junto ao seletor e na legenda da tabela, não no tooltip (a spec, seção 11.1, limita o tooltip). O cartão (ticket 10) deve repeti-la.
- A legenda usa o período de "Todos": hoje os 6 tipos têm os mesmos anos (tendência 2015–2024, faixa 2020–2024).
