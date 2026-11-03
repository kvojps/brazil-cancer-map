# 06: Faixa de qualidade A/B/C com hachura

**What to build:** onde muitos casos estão sem informação de tratamento, o mapa avisa. A faixa de qualidade é calculada por UF × tipo selecionado, e a faixa C recebe hachura diagonal no indicador de tratamento, já na primeira impressão do Mapa inicial. Referência: spec, seções 6.3 e 11.1.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** ready-for-agent

- [ ] A faixa é calculada por UF × tipo (inclusive "Todos") sobre os últimos cinco anos consolidados: A até 15% sem informação; B acima de 15% e abaixo de 35%; C 35% ou mais
- [ ] Não há lista fixa de UFs; o período usado é exportado e aparece na tela
- [ ] Na faixa C, os municípios recebem hachura diagonal só no indicador de tratamento correspondente, com o aviso "Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação."
- [ ] A hachura e os pontos do dado insuficiente não se confundem, e a hachura entra na legenda
- [ ] A informação da faixa também está disponível na tabela alternativa
