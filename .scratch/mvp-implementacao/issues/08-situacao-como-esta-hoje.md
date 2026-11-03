# 08: Situação e modo "como está hoje"

**What to build:** além da Tendência, o cidadão pode ver no mapa a Situação: o valor do último ano consolidado comparado à Referência, em 3 faixas fixas. O seletor do topo passa a escolher o indicador e o modo. Referência: spec, seções 9 e 11.1.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência; 29 — Valor e Situação do 60 dias sobre os casos de quimio e radio

**Status:** resolved

- [x] O pipeline calcula a Situação com faixas fixas, nunca quantis: alcançou (≥ Ref), perto (≥ 0,8 × Ref) e longe; a regra é reaproveitável, inclusive na forma invertida do tabagismo
- [x] Valores acima do possível entram como "alcançou", sem cortar o número, com a nota "valor acima do esperado, provavelmente erro no registro ou na estimativa de população"
- [x] A Situação passa pela mesma cascata da Tendência
- [x] Para o 60 dias, a Referência é 100% ("o que a lei garante"), a Situação usa o valor dos casos de quimio/radio ([ticket de decisão 28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md), implementação 29), e a próstata não tem Situação
- [x] O modo "como está hoje" usa uma escala de um só tom em 3 passos, mais escura quanto mais perto da Referência e diferente das cores da Tendência, com a legenda "A cor mostra a distância até a referência. Não é um ranking entre municípios."
- [x] O seletor de indicador e modo funciona pelo teclado; Tendência é o modo padrão


## Comments

Implementado em 2026-11-03:

- Classificação reutilizável em `pipeline/status.py`: cortes fixos, regra invertida por Referência ÷ 0,8 e nota para valores acima do limite possível. O valor não é cortado. No tabagismo, 7,4% é a apresentação arredondada do corte exato 5,9 ÷ 0,8, conforme o ticket de decisão 18.
- O Painel calcula a Situação sobre o valor não arredondado dos casos de quimio/radio, com a mesma origem da Tendência. Exporta `status`, `status_note` e `reference`; na próstata, Situação e Referência são nulas.
- Seletor nativo de indicador e modo, operável pelo teclado, com Tendência como padrão e Situação indisponível na próstata. O modo “como está hoje” usa três tons de roxo e mantém pontos e hachuras. Legenda, tooltip e tabela acessível apresentam a Situação.
- Reexecutadas `compute`, `validate` e `export` com os dados locais da extração de 17/10/2026. As seis camadas têm 5.571 municípios cada, conforme a malha existente; comparação com a versão anterior confirmou que nenhum valor, Tendência, origem, % sem informação ou faixa de qualidade mudou.
- Validação: 97 testes passando; mypy sem erros; Astro check sem erros ou avisos; build concluído, com o aviso existente de tamanho do bundle. Verificação do site por typecheck e build, sem teste interativo em navegador.
- Revisão `code-review` em dois eixos, base `4474e8d`: a duplicação da regra de hachura apontada em Standards foi corrigida; o fechamento deste ticket acompanha a última mudança.

Commits que resolveram o ticket:
- `b8fa6ad` — `feat: add fixed status bands and current situation map mode`.
- Commit deste fechamento — `fix: share map hatching policy and resolve status ticket`.
