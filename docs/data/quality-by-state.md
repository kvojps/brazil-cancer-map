# Qualidade dos dados por UF

> Leitura curta. A [versão completa](https://github.com/kvojps/brazil-cancer-map/blob/11fd03c47e1ce09b9a2ccb873ccc75da1ccb304f/docs/data/quality-by-state.md), com as tabelas por UF e tipo, está no commit `11fd03c`. Os valores por UF continuam em [`quality-by-state-treatment.csv`](quality-by-state-treatment.csv) e [`quality-by-state-deaths.csv`](quality-by-state-deaths.csv).

Sustenta o recorte do MVP: 5 tipos de câncer, "Todos" sem C76–C80 no tratamento, e estadiamento e estômago fora (spec, seção 3).

**Data:** 02/11/2026. Painel-Oncologia `POBR2019–2024.dbc` (arquivos de 17/10/2026), janela de diagnóstico 2019–2023, e SIM `DO<UF>2022–2024.dbc`, finais.

**Estas não são as faixas publicadas.** As faixas vigentes são por UF × tipo em 2020–2024 e estão nos JSON em `site/public/dados/map/within_60_days/`. Esta medição usou "abaixo de 15%" para a faixa A; a regra vigente é "até 15%" inclusive (spec, seção 6.3), e nenhum valor medido é exatamente 15,0.

## Resultado

| Tipo | Casos 2019–2023 | % sem tratamento | UFs A / B / C |
|---|---:|---:|---|
| Todos | 1.986.134 | 33,9 | 2 / 15 / 10 |
| Todos sem C76–C80 | 1.696.835 | 30,6 | 3 / 17 / 7 |
| Mama | 284.890 | 19,7 | 14 / 10 / 3 |
| Colo do útero | 99.428 | 25,7 | 7 / 16 / 4 |
| Próstata | 208.950 | 21,2 | 8 / 17 / 2 |
| Colorretal | 200.053 | 31,8 | 3 / 21 / 3 |
| Pulmão | 68.052 | 25,2 | 7 / 18 / 2 |
| **Estômago** | 92.128 | **56,2** | 4 / 13 / **10** |

1. **O estadiamento fica fora.** Ele só existe para quem fez quimio ou radio: cirurgia (`TRATAMENTO = 1`) vem sempre com estádio `5`, e sem tratamento (`5`) vem sempre com `9`. A "% em estádio inicial" não mede detecção precoce.
2. **O estômago fica fora.** 56% dos casos vêm sem tratamento, 10 UFs ficam na faixa C, a série piora (47,7% em 2019, 59,6% em 2024) e AL chega a 89%.
3. **"Todos" exclui C76–C80 no tratamento.** C80 e C76 somam 7% dos casos, mas 19% dos casos sem tratamento. Sem eles, o CE cai de 41% para 20%, o MT de 36% para 17% e a SC de 38% para 26%. O C73 já fica de fora porque o Painel o agrupa com o C44.
4. **A % sem informação de tratamento é o limitante.** Mama vai de 5% (SE) a 59% (MA); colo do útero, de 8% (SE) a 56% (RR). No colo, a % sobe de 22,4% (2019) para 32,0% (2024), provavelmente por tratamento ainda não lançado.
5. **O SIM não é o gargalo.** Óbitos mal definidos (R00–R99) ficam entre 0,7% (ES) e 8,2% (RJ). C76–C80 e C97 somam 6,1% dos óbitos por câncer, de 3,4% (DF) a 9,2% (MG). C39 pesa 0,3% em pulmão e C63, 0,2% em próstata. O ponto fraco é o C55: 2–26% dos óbitos por câncer de útero ([`c55-validation.md`](c55-validation.md)).
6. **Os números por município são pequenos.** Em 5 anos, a parcela de municípios com 20 casos ou mais vai de 4% a 76% em mama e de 4% a 42% em colo, conforme a UF.
7. **"Até 60 dias" não se compara entre tipos**, sobretudo na próstata (35% entre os tratados), em que a vigilância ativa pode ser a conduta correta.

**C26:** a coluna `digestivo_pct_C26` do CSV divide pela soma de colorretal, estômago e C26, e chega a 10,1% no país. Sobre todos os óbitos digestivos (C15–C26), o C26 pesa de **5,0% a 5,9%** ([`sim-atlas-check.md`](sim-atlas-check.md#c26-digestivo-mal-definido)). Vale o segundo número.

## Método e limites

% sem informação = casos do tipo com `TRATAMENTO = 5` sobre todos os casos do tipo, só neoplasias malignas, por UF de residência e ano de diagnóstico. Faixas pelos cortes de 15% e 35% da spec, seção 6.3, com a ressalva da faixa A acima. Os scripts exploratórios não fazem parte do repositório.

- "Sem informação de tratamento" não é "não tratado": mistura tratamento fora do SUS, tratamento ainda não faturado e falhas na ligação CID + CNS.
- O SIM foi medido só em 2022–2024.
- As faixas são um corte prático, não um padrão epidemiológico.
