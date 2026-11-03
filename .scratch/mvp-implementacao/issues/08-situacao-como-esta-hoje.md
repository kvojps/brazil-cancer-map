# 08: Situação e modo "como está hoje"

**What to build:** além da Tendência, o cidadão pode ver no mapa a Situação: o valor do último ano consolidado comparado à Referência, em 3 faixas fixas. O seletor do topo passa a escolher o indicador e o modo. Referência: spec, seções 9 e 11.1.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** ready-for-agent

- [ ] O pipeline calcula a Situação com faixas fixas, nunca quantis: alcançou (≥ Ref), perto (≥ 0,8 × Ref) e longe; a regra é reaproveitável, inclusive na forma invertida do tabagismo
- [ ] Valores acima do possível entram como "alcançou", sem cortar o número, com a nota "valor acima do esperado, provavelmente erro no registro ou na estimativa de população"
- [ ] A Situação passa pela mesma cascata da Tendência
- [ ] Para o 60 dias, a Referência é 100% ("o que a lei garante"), e a próstata não tem Situação
- [ ] O modo "como está hoje" usa uma escala de um só tom em 3 passos, mais escura quanto mais perto da Referência e diferente das cores da Tendência, com a legenda "A cor mostra a distância até a referência. Não é um ranking entre municípios."
- [ ] O seletor de indicador e modo funciona pelo teclado; Tendência é o modo padrão
