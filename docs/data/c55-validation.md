# Validação da redistribuição do C55

Sustenta a redistribuição do C55 no colo do útero. A decisão e as alternativas estão no [ADR 9](../adr/0009-c55-redistribution-cervix-only.md), e o método em [`/metodologia/#mortalidade`](https://brazil-cancer-map.josebazjunior09.workers.dev/metodologia/#mortalidade). O relatório da execução está em `pipeline/references/sim-c55-validation.json`.

**O efeito sobre a classe da Tendência não está comprovado.** A diferença de 2,9% contra 1,8% ao ano abaixo vale só para contagens nacionais. Ela é uma aproximação, e não foi medida na taxa padronizada por UF. A validação abaixo confere a integridade da série ajustada, sem demonstrar que o ajuste melhora a classificação.

## Resultado da série ajustada

Execução de 04/11/2026, versão do pipeline `0.1.0+ddbacb4`, anos 2014–2024, 5.571 municípios.

| Conferência | Resultado |
|---|---:|
| Células município × ano × idade | 64.304 |
| Pontos de série | 67.188 |
| Usos do fallback nacional | 36 |
| Células sem proporção calculável | 5 |
| Conferência de integridade | passou |
| Ajuste calculável em todas as células | **não** |
| Demais tipos e indicadores sem mudança | sim |
| Mapa e ficha concordam | sim |

A conferência verifica que C53+C54+C55 se conservam, que a alocação não reduz C53 nem C54, que os outros tipos, inclusive "Todos", não mudam, e que todo ponto sem taxa está sinalizado. O sucesso da integridade não significa ajuste calculável em todas as células.

**As cinco células**, com um C55 cada, sem proporção estadual nem nacional:

| Ano | Município | Idade |
|---|---|---|
| 2015 | Mossoró (240800) | 10–14 |
| 2015 | São Paulo (355030) | 10–14 |
| 2020 | Rio de Janeiro (330455) | ignorada |
| 2021 | Ubiratã (412800) | 10–14 |
| 2023 | Macapá (160030) | 15–19 |

Elas ficam sinalizadas, sem inventar proporção, e afetam também os territórios que as incluem. O contexto nacional fica com "ajuste não calculável", sem classe de Tendência. As cinco fichas afetadas foram inspecionadas no HTML gerado e exibem o aviso e a nota obrigatória.

**Contagens anuais do relatório.** Um ano com célula não calculável fica sem total ajustado:

| Ano | C53 | C55 | C53 ajustado | C54 ajustado |
|---|---:|---:|---:|---:|
| 2014 | 5.448 | 2.116 | 7.057,35 | 1.872,65 |
| 2015 | 5.727 | 2.150 | não calculável | não calculável |
| 2016 | 5.847 | 2.143 | 7.424,67 | 2.141,33 |
| 2017 | 6.385 | 2.114 | 7.906,91 | 2.419,09 |
| 2018 | 6.526 | 2.090 | 8.054,06 | 2.304,94 |
| 2019 | 6.596 | 1.929 | 7.989,84 | 2.471,16 |
| 2020 | 6.627 | 1.823 | não calculável | não calculável |
| 2021 | 6.606 | 1.915 | não calculável | não calculável |
| 2022 | 6.983 | 1.927 | 8.319,32 | 2.874,68 |
| 2023 | 7.209 | 1.770 | não calculável | não calculável |
| 2024 | 7.493 | 1.830 | 8.715,54 | 3.333,46 |

A comparação com o Atlas continua usando o C53 original, sem ajuste ([`sim-atlas-check.md`](sim-atlas-check.md)). Por isso ela não é validação externa da série ajustada.

## Efeito nas contagens

TabNet, Brasil, 2014–2024:

| Ano | 2014 | 2016 | 2018 | 2020 | 2022 | 2024 |
|---|---:|---:|---:|---:|---:|---:|
| C53 | 5.448 | 5.847 | 6.526 | 6.627 | 6.983 | 7.493 |
| C54 | 1.366 | 1.576 | 1.743 | 1.944 | 2.284 | 2.726 |
| C55 | 2.116 | 2.143 | 2.090 | 1.823 | 1.927 | 1.830 |
| C55 / útero | 23,7% | 22,4% | 20,2% | 17,5% | 17,2% | 15,2% |

A variação anual das **contagens** de 2014 a 2024 foi de +2,89% ao ano só com C53 e de +1,77% ao ano com o C55 redistribuído. Somar o C55 inteiro ao C53 dá +1,73%. A diferença de cerca de 1,1 ponto ao ano é maior que a faixa de "estável" (±1%), por isso a escolha **pode** mudar a classe, sobretudo nas UFs em que o C55 pesa mais (RJ, MG, AP, PB e SE ficam acima de 20%).

## Efeito no nível

Colo do útero em 2022, taxa ajustada por 100 mil:

| Área | Só C53 | Com C55 redistribuído | Diferença |
|---|---:|---:|---:|
| Brasil | 4,75 | 5,62 | +18% |
| MG | 2,94 | 3,79 | +29% |
| RJ | 4,21 | 5,59 | +33% |
| PA | 8,92 | 9,91 | +11% |
| SP | 3,27 | 4,01 | +22% |

A correção é desigual entre as UFs, e por isso o número do site difere do INCA. O cartão do colo avisa isso.

## Literatura

O INCA não redistribui o C55: o Atlas trata C53, C54 e C55 como itens separados. A redistribuição é o padrão da literatura brasileira, que reparte todo o C55 entre C53 e C54 na proporção original:

- **Gamarra, Valente e Azevedo e Silva (2010)**, *Correção da magnitude da mortalidade por câncer do colo do útero no Brasil, 1996–2005*, Rev Saúde Pública 44(4):629–38, [DOI 10.1590/S0034-89102010000400006](https://doi.org/10.1590/S0034-89102010000400006). Redistribui "segundo faixa etária, UF, área geográfica e ano". Das etapas que mais pesaram no Brasil, o C55 foi a maior: +55,6%, contra +22,0% do sub-registro e +21,2% das mal definidas.
- **Azevedo e Silva, Girianelli, Gamarra e Bustamante-Teixeira (2010)**, *Evolução da mortalidade por câncer do colo do útero no Brasil, 1981–2006*, Cad Saúde Pública 26(12), [DOI 10.1590/S0102-311X2010001200018](https://doi.org/10.1590/S0102-311X2010001200018). Sem correção, a série nacional era levemente crescente (β = 0,012; p = 0,007). Corrigida, passou a decrescente (β = −0,054; p < 0,001).
- **Azevedo e Silva et al. (2011)**, *Tendência da mortalidade por câncer nas capitais e interior do Brasil entre 1980 e 2006*, Rev Saúde Pública 45(6):1009–18 ([PDF](https://www.redalyc.org/pdf/672/67240194002.pdf)). Usa a mesma regra do C55.

Um estudo de 2023 sobre o Sudeste (Rev Saúde Pública v. 57, art. 25) foi visto só pelo resumo na busca.
