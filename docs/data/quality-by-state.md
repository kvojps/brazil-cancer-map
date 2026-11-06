# Qualidade dos dados por UF

Evidência do recorte do MVP: 5 tipos de câncer, "Todos" sem C76–C80 no tratamento, e estadiamento e estômago fora (spec, seção 3).

**Estas não são as faixas publicadas.** Janela de diagnóstico **2019–2023**, medida em 02/11/2026 para decidir o recorte. As faixas vigentes são por UF × tipo em 2020–2024, e estão nos JSON em `site/public/dados/map/within_60_days/`.

Fontes: Painel-Oncologia `POBR2019–2024.dbc`, arquivos gravados em 17/10/2026, só neoplasias malignas, por UF e município de residência. As métricas usam os anos de diagnóstico 2019–2023, e 2024 entra só na tendência. SIM `DO<UF>2022–2024.dbc`, finais, com `CAUSABAS`. Os scripts exploratórios não fazem parte do repositório.

**Dois cuidados ao ler os números:**

- **Faixa A:** estas tabelas usaram "abaixo de 15%". A regra vigente é "até 15%" inclusive (spec, seção 6.3). Nenhum valor das tabelas é exatamente 15,0, então nenhuma faixa daqui muda com isso.
- **C26:** a coluna de C26 divide pela soma de colorretal, estômago e o próprio C26, e por isso chega a 10,1% no país. Sobre todos os óbitos digestivos (C15–C26), o C26 pesa de **5,0% a 5,9%** ([`sim-atlas-check.md`](sim-atlas-check.md#c26-digestivo-mal-definido)). Vale o segundo número.

## O que a medição sustenta

1. **O estadiamento só existe para quem fez quimioterapia ou radioterapia.** O cruzamento `TRATAMENTO × ESTADIAM` é exato: primeiro tratamento por cirurgia (`1`) vem sempre com estádio `5` (não se aplica); sem tratamento registrado (`5`) vem sempre com `9` (ignorado); quimio ou radio (`2`, `3`, `4`) vem preenchido em 100% dos casos. A "% de diagnóstico em estádio inicial" deixa de fora os casos operados primeiro e não mede detecção precoce. No AP, chega a 92% para mama.
2. **A % sem informação de tratamento é o limitante.** Mama vai de 5% (SE) a 59% (MA), e colo do útero de 8% (SE) a 56% (RR).
3. **Os anos recentes ficam incompletos.** A % sem tratamento de colo do útero passa de 22,4% (2019) para 28,8% (2023) e 32,0% (2024). A causa provável é o tratamento ainda não lançado, porque o Painel revisa os anos anteriores todo mês. Também pode haver piora real, e este dado não separa as duas coisas.
4. **O SIM não é o gargalo.** Os óbitos por causa mal definida (R00–R99) ficam entre 0,7% (ES) e 8,2% (RJ), e o total nacional cai de 5,3% para 4,5% entre 2022 e 2024. O ponto fraco é o C55: 2–26% dos óbitos por câncer de útero, acima de 20% em RJ, MG, AP, PB e SE. Ver [`c55-validation.md`](c55-validation.md).
5. **Os números por município são pequenos.** Somando 5 anos, a parcela de municípios com 20 casos ou mais vai de 4% a 76% em mama, conforme a UF, e de 4% a 42% em colo do útero. O DF, com um só município, fica fora dessas faixas.
6. **O estômago não se sustenta no Acesso ao tratamento.** No país, 56% dos casos vêm sem tratamento, 10 UFs ficam na faixa C, a série piora (47,7% em 2019, 54,5% em 2023 e 59,6% em 2024) e o valor chega a 89% em AL. Só 11% dos casos têm cirurgia como primeiro tratamento, contra 21% nos demais tipos. Isso sugere gastrectomia não ligada ao diagnóstico, somada a diagnóstico tardio. É hipótese, não verificada no SIH.
7. **"Todos" precisa excluir C76–C80 no tratamento.** C80 e C76 somam 7% dos casos, mas 19% dos casos sem tratamento, porque 88–89% deles vêm sem tratamento. Sem eles, o CE cai de 41% para 20%, o MT de 36% para 17% e a SC de 38% para 26%. O C73 já fica de fora, porque o Painel o agrupa com o C44.
8. **"Até 60 dias" não se compara entre tipos, sobretudo na próstata (35%).** A vigilância ativa pode ser a conduta correta, então um número baixo não indica, sozinho, falha de acesso.
9. **O SIM está bom para os tipos do seletor.** C39 responde por 0,3% dos óbitos de pulmão, e C63 por 0,2% dos de próstata. C76–C80 e C97 somam 6,1% dos óbitos por câncer no país, de 3,4% (DF) a 9,2% (MG).

## Resumo nacional (Painel-Oncologia, 2019–2023)

| Tipo | Casos | % sem tratamento | UFs A / B / C | % ≤ 60 dias (tratados) | % municípios com ≥ 20 casos em 5 anos |
|---|---:|---:|---|---:|---:|
| Todos | 1.986.134 | 33,9 | 2 / 15 / 10 | 55,4 | 94,8 |
| Todos sem C76–C80 | 1.696.835 | 30,6 | 3 / 17 / 7 | 55,7 | 93,4 |
| Mama | 284.890 | 19,7 | 14 / 10 / 3 | 42,1 | 34,1 |
| Colo do útero | 99.428 | 25,7 | 7 / 16 / 4 | 50,2 | 14,4 |
| Próstata | 208.950 | 21,2 | 8 / 17 / 2 | 34,6 | 31,2 |
| Colorretal | 200.053 | 31,8 | 3 / 21 / 3 | 59,6 | 26,3 |
| Pulmão | 68.052 | 25,2 | 7 / 18 / 2 | 66,2 | 10,0 |
| **Estômago** | 92.128 | **56,2** | 4 / 13 / **10** | 60,2 | 11,1 |

## % sem informação e faixa, por UF e tipo

Cada célula traz a % sem informação de tratamento em 2019–2023 e a faixa histórica. Casos, % em 2023, % em até 60 dias entre os tratados e municípios com 20 casos ou mais estão em [`quality-by-state-treatment.csv`](quality-by-state-treatment.csv). Na linha `BR`, `mun_com_caso` passa de 100% porque inclui códigos de município ignorado ou inválido.

| UF | Todos | Todos sem C76–C80 | Mama | Colo | Próstata | Colorretal | Pulmão | Estômago |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| AC | 15,1 B | 14,6 A | 12,6 A | 33,6 B | 4,2 A | 13,1 A | 5,8 A | 8,5 A |
| AL | 49,6 C | 36,2 C | 14,1 A | 12,1 A | 9,7 A | 30,6 B | 16,6 B | 89,3 C |
| AM | 19,2 B | 17,8 B | 15,9 B | 10,2 A | 27,0 B | 19,5 B | 8,5 A | 25,6 B |
| AP | 21,9 B | 21,0 B | 11,1 A | 43,7 C | 7,7 A | 26,5 B | 28,6 B | 14,9 A |
| BA | 25,0 B | 25,9 B | 15,7 B | 32,3 B | 32,3 B | 26,4 B | 14,4 A | 21,6 B |
| CE | 41,4 C | 19,6 B | 8,4 A | 13,0 A | 16,8 B | 22,7 B | 9,3 A | 16,0 B |
| DF | 19,3 B | 19,1 B | 14,4 A | 18,6 B | 8,7 A | 21,8 B | 18,8 B | 18,8 B |
| ES | 31,4 B | 28,8 B | 21,3 B | 27,1 B | 20,3 B | 27,9 B | 37,8 C | 49,7 C |
| GO | 28,3 B | 29,0 B | 11,5 A | 25,7 B | 13,8 A | 28,9 B | 26,3 B | 64,0 C |
| MA | 57,4 C | 59,7 C | 59,3 C | 25,7 B | 25,8 B | 28,6 B | 23,1 B | 32,9 B |
| MG | 29,9 B | 28,4 B | 20,4 B | 26,9 B | 19,4 B | 30,5 B | 23,0 B | 34,3 B |
| MS | 31,5 B | 32,3 B | 15,9 B | 18,6 B | 39,0 C | 27,0 B | 36,9 C | 76,5 C |
| MT | 35,9 C | 17,4 B | 12,1 A | 19,9 B | 10,4 A | 16,5 B | 12,0 A | 18,0 B |
| PA | 24,4 B | 24,4 B | 9,4 A | 10,6 A | 17,8 B | 26,7 B | 34,6 B | 27,7 B |
| PB | 31,8 B | 28,2 B | 10,5 A | 20,8 B | 19,1 B | 28,5 B | 20,0 B | 19,0 B |
| PE | 34,9 B | 36,4 C | 21,9 B | 22,1 B | 22,6 B | 32,3 B | 20,4 B | 52,9 C |
| PI | 24,4 B | 25,3 B | 11,3 A | 8,7 A | 22,1 B | 28,6 B | 18,3 B | 25,4 B |
| PR | 29,7 B | 25,0 B | 20,5 B | 29,8 B | 17,9 B | 27,4 B | 19,6 B | 32,0 B |
| RJ | 36,5 C | 33,4 B | 14,7 A | 26,3 B | 19,5 B | 44,2 C | 33,1 B | 53,4 C |
| RN | 38,4 C | 41,4 C | 48,7 C | 39,2 C | 22,2 B | 24,0 B | 34,4 B | 73,4 C |
| RO | 37,0 C | 35,5 C | 28,5 B | 38,3 C | 24,9 B | 39,7 C | 29,3 B | 46,5 C |
| RR | 42,6 C | 39,3 C | 35,5 C | 56,0 C | 37,7 C | 34,4 B | 14,5 A | 17,6 B |
| RS | 37,5 C | 38,5 C | 19,6 B | 33,1 B | 13,2 A | 41,3 C | 26,7 B | 85,9 C |
| SC | 38,3 C | 26,2 B | 14,0 A | 27,1 B | 15,1 B | 28,7 B | 23,6 B | 29,1 B |
| SE | 14,8 A | 14,9 A | 5,3 A | 7,7 A | 20,8 B | 8,1 A | 18,0 B | 12,8 A |
| SP | 34,0 B | 30,0 B | 19,6 B | 28,7 B | 24,6 B | 32,1 B | 30,2 B | 58,7 C |
| TO | 8,7 A | 9,2 A | 6,9 A | 9,0 A | 3,4 A | 10,0 A | 11,5 A | 13,3 A |
| BR | 33,9 B | 30,6 B | 19,7 B | 25,7 B | 21,2 B | 31,8 B | 25,2 B | 56,2 C |

## Mama e colo do útero por UF

A faixa desta tabela usa o pior valor entre mama e colo do útero.

| UF | Faixa | Casos mama | Casos colo | Sem trat. mama % | Sem trat. colo % | Sem trat. colo 2023 % | ≤60 d mama % | ≤60 d colo % | Mun. ≥20 casos mama % | Mun. ≥20 casos colo % | Óbitos mal definidos % | Câncer sem sítio (C76/C80) % | Útero sem parte (C55) % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SE | A | 2.285 | 963 | 5,3 | 7,7 | 6,5 | 49,4 | 61,8 | 30,7 | 12,0 | 7,1 | 3,9 | 20,1 |
| PI | A | 3.209 | 1.961 | 11,3 | 8,7 | 10,3 | 52,5 | 65,2 | 10,3 | 4,9 | 4,5 | 4,4 | 8,5 |
| TO | A | 1.253 | 646 | 6,9 | 9,0 | 8,7 | 42,7 | 34,4 | 4,3 | 4,3 | 2,3 | 3,3 | 10,1 |
| PA | A | 4.257 | 3.252 | 9,4 | 10,6 | 13,8 | 39,8 | 31,5 | 22,2 | 25,0 | 7,0 | 3,7 | 8,2 |
| AL | A | 3.346 | 1.652 | 14,1 | 12,1 | 9,0 | 36,9 | 45,9 | 29,4 | 11,8 | 5,2 | 5,1 | 12,5 |
| CE | A | 11.216 | 3.841 | 8,4 | 13,0 | 17,0 | 44,0 | 55,7 | 54,9 | 15,8 | 2,3 | 4,5 | 11,9 |
| AM | B | 2.850 | 2.373 | 15,9 | 10,2 | 8,7 | 33,4 | 26,6 | 9,7 | 11,3 | 7,9 | 3,0 | 5,4 |
| DF | B | 3.337 | 1.059 | 14,4 | 18,6 | 18,1 | 33,8 | 44,5 | 100,0 | 100,0 | 2,1 | 3,0 | 6,7 |
| MS | B | 3.559 | 1.470 | 15,9 | 18,6 | 18,8 | 38,2 | 68,0 | 43,0 | 12,7 | 3,4 | 4,2 | 14,8 |
| MT | B | 3.434 | 1.480 | 12,1 | 19,9 | 18,0 | 45,6 | 56,6 | 16,9 | 6,3 | 4,8 | 3,9 | 6,6 |
| PB | B | 5.296 | 1.917 | 10,5 | 20,8 | 28,3 | 34,0 | 33,3 | 18,8 | 5,8 | 5,0 | 4,4 | 20,9 |
| PE | B | 12.576 | 5.359 | 21,9 | 22,1 | 23,2 | 46,7 | 52,3 | 52,4 | 25,9 | 4,0 | 5,2 | 12,4 |
| GO | B | 6.867 | 3.259 | 11,5 | 25,7 | 24,4 | 37,6 | 45,8 | 20,7 | 9,8 | 1,5 | 3,7 | 15,8 |
| RJ | B | 23.083 | 6.491 | 14,7 | 26,3 | 28,7 | 33,9 | 36,7 | 76,1 | 42,4 | 8,2 | 5,6 | 25,6 |
| MG | B | 32.299 | 8.986 | 20,4 | 26,9 | 28,5 | 42,2 | 56,4 | 29,8 | 9,4 | 6,7 | 5,9 | 21,9 |
| ES | B | 6.434 | 2.272 | 21,3 | 27,1 | 37,3 | 50,8 | 58,7 | 67,9 | 21,8 | 0,7 | 2,9 | 5,5 |
| SC | B | 13.552 | 4.585 | 14,0 | 27,1 | 30,8 | 40,6 | 56,5 | 38,0 | 16,6 | 2,5 | 3,9 | 12,7 |
| SP | B | 64.230 | 16.985 | 19,6 | 28,7 | 32,4 | 40,5 | 45,8 | 51,3 | 21,1 | 4,0 | 4,4 | 19,4 |
| PR | B | 20.075 | 7.883 | 20,5 | 29,8 | 32,9 | 59,4 | 74,0 | 46,4 | 18,3 | 2,1 | 4,0 | 17,4 |
| BA | B | 16.443 | 5.878 | 15,7 | 32,3 | 30,8 | 35,6 | 41,1 | 33,1 | 11,3 | 8,1 | 4,5 | 17,0 |
| RS | B | 23.648 | 8.177 | 19,6 | 33,1 | 40,8 | 43,7 | 55,4 | 33,6 | 13,7 | 4,5 | 3,4 | 15,9 |
| AC | B | 603 | 554 | 12,6 | 33,6 | 11,9 | 38,1 | 24,5 | 9,1 | 18,2 | 6,5 | 2,2 | 1,7 |
| MA | C | 9.479 | 4.251 | 59,3 | 25,7 | 27,7 | 45,5 | 46,5 | 14,7 | 16,6 | 5,6 | 4,3 | 6,1 |
| RO | C | 2.024 | 1.088 | 28,5 | 38,3 | 37,8 | 41,9 | 47,5 | 32,7 | 17,3 | 6,9 | 4,3 | 9,3 |
| RN | C | 8.575 | 2.307 | 48,7 | 39,2 | 50,2 | 47,3 | 60,3 | 37,7 | 14,4 | 3,4 | 4,1 | 8,6 |
| AP | C | 450 | 380 | 11,1 | 43,7 | 23,1 | 27,8 | 33,2 | 12,5 | 12,5 | 5,0 | 3,1 | 21,3 |
| RR | C | 510 | 359 | 35,5 | 56,0 | 65,2 | 34,7 | 22,2 | 6,7 | 6,7 | 3,8 | 4,2 | 5,2 |

## Óbitos por UF (SIM, 2022–2024)

As contagens de óbitos de cada tipo estão em [`quality-by-state-deaths.csv`](quality-by-state-deaths.csv).

| UF | Óbitos por câncer | Sítio mal definido (C76–C80, C97) % | C26 sobre colorretal, estômago e C26 % | Pulmão: C39 % | Próstata: C63 % |
|---|---:|---:|---:|---:|---:|
| DF | 8.708 | 3,4 | 5,4 | 0,3 | 0,0 |
| TO | 4.007 | 3,7 | 8,1 | 0,4 | 0,0 |
| ES | 14.759 | 3,8 | 6,0 | 0,2 | 0,2 |
| AC | 1.923 | 3,8 | 3,0 | 0,0 | 0,8 |
| AM | 8.949 | 3,9 | 4,7 | 0,2 | 0,0 |
| RS | 61.597 | 4,2 | 10,1 | 0,2 | 0,3 |
| SE | 6.210 | 4,4 | 13,4 | 0,8 | 0,0 |
| GO | 22.365 | 4,5 | 12,4 | 0,3 | 0,1 |
| PR | 48.926 | 4,7 | 10,3 | 0,3 | 0,0 |
| AP | 1.625 | 5,0 | 11,9 | 0,0 | 0,0 |
| MS | 9.494 | 5,0 | 8,6 | 0,2 | 0,3 |
| SC | 31.770 | 5,2 | 8,8 | 0,3 | 0,2 |
| PA | 17.575 | 5,3 | 4,8 | 0,7 | 0,5 |
| MT | 9.890 | 5,7 | 7,4 | 0,5 | 0,5 |
| SP | 181.964 | 5,8 | 9,2 | 0,4 | 0,2 |
| RR | 1.441 | 5,8 | 10,2 | 1,4 | 0,0 |
| BR | 747.649 | 6,1 | 10,1 | 0,3 | 0,2 |
| RN | 11.455 | 6,1 | 9,6 | 0,5 | 0,1 |
| MA | 14.329 | 6,2 | 6,5 | 0,3 | 0,2 |
| RO | 4.582 | 6,2 | 6,8 | 0,3 | 0,0 |
| PI | 9.280 | 6,3 | 16,5 | 0,5 | 0,1 |
| BA | 45.377 | 6,9 | 11,6 | 0,6 | 0,2 |
| PE | 30.108 | 7,0 | 9,2 | 0,4 | 0,2 |
| CE | 30.530 | 7,1 | 8,7 | 0,3 | 0,3 |
| RJ | 70.064 | 7,1 | 12,2 | 0,2 | 0,1 |
| AL | 8.154 | 8,0 | 9,9 | 0,5 | 0,5 |
| PB | 13.485 | 8,3 | 9,5 | 0,5 | 0,3 |
| MG | 79.082 | 9,2 | 13,6 | 0,3 | 0,2 |

## Limites

- **"Sem informação de tratamento" não é "não tratado".** O valor mistura tratamento fora do SUS, tratamento ainda não faturado e falhas na ligação CID + CNS.
- **O SIM foi medido só em 2022–2024.** Séries mais antigas, sobretudo no Norte e no Nordeste antes de 2010, têm mais óbitos mal definidos.
- **As faixas são um corte prático**, não um padrão epidemiológico.
