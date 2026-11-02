# Qualidade dos dados de mama (C50) e colo do útero (C53) por UF

Medido em 2026-11-02 a partir dos microdados do FTP do DATASUS:

- **Painel-Oncologia** `POBR2019–2024.dbc`, arquivos gravados em 17/10/2026. Foram usadas só neoplasias malignas (`DIAGNOSTIC=01`), com `DIAG_DETH` C50 ou C53, por UF e município de residência. As métricas usam os anos de diagnóstico 2019–2023. 2024 entra só na tendência, porque ainda está incompleto.
- **SIM** `DO<UF>2022–2024.dbc` (finais), com `CAUSABAS`.

Para reproduzir, use os scripts em [`09-scripts/`](09-scripts/): `po.py` extrai, `po_uf.py` gera as métricas do Painel e `sim_uf.py` gera as do SIM. A DBC é lida com o pacote `datasus-dbc` + `dbfread` + `pandas`. A tabela completa está em [`09-tabela-uf.csv`](09-tabela-uf.csv).

## Achados

1. **O estadiamento só existe para quem fez quimioterapia ou radioterapia.** O cruzamento `TRATAMENTO × ESTADIAM` é exato:
   - quando o primeiro tratamento é cirurgia (`1`), o estádio vem sempre como `5` (não se aplica);
   - quando não há tratamento registrado (`5`), vem sempre como `9` (ignorado);
   - quando o primeiro tratamento é quimioterapia ou radioterapia (`2`, `3`, `4`), o estádio aparece preenchido em 100% dos casos.

   Por isso, a "% de diagnóstico em estádio inicial" **não mede detecção precoce**. Ela deixa de fora os casos operados primeiro, que tendem a ser os mais iniciais, e oscila conforme o perfil de tratamento de cada UF. No AP, por exemplo, chega a 92% para mama. **Não usar esse indicador no MVP**, nem com ressalva.
2. **A % "sem informação de tratamento" é o limitante.** Ela varia muito por UF:
   - mama: de 5% (SE) a 59% (MA);
   - colo do útero: de 8% (SE) a 56% (RR).

   O colo do útero é pior do que mama em quase todas as UFs.
3. **Os anos recentes ficam incompletos.** No país, a % sem tratamento de colo do útero passa de 22,4% (2019) para 28,8% (2023) e 32,0% (2024). Para mama, de 17,7% para 22,7%. A causa provável é o tratamento ainda não lançado, porque o Painel revisa os anos anteriores todo mês. Também pode haver uma piora real, e as duas coisas não se separam com este dado. Os últimos 1–2 anos precisam aparecer marcados como provisórios.
4. **O SIM não é o gargalo.** Os óbitos por causa mal definida (R00–R99) ficam entre 0,7% (ES) e 8,2% (RJ), e o total nacional cai de 5,3% para 4,5% entre 2022 e 2024. Os óbitos por câncer sem local definido (C76/C80) ficam entre 2% e 6% em todas as UFs. O ponto fraco é o **C55 (útero, parte não especificada)**: 2–26% dos óbitos por câncer de útero, acima de 20% em RJ, MG, AP, PB, SE. Por isso, **a tendência de mortalidade por colo do útero precisa redistribuir o C55** (método usual do INCA) ou usar C53+C55 com ressalva.
5. **Os números por município são pequenos.** Somando 5 anos de casos (2019–2023), a parcela de municípios com 20 casos ou mais fica em:
   - mama: 4–76% conforme a UF;
   - colo do útero: 4–42%, e só DF e RJ passam de 26%.

   Na maior parte dos municípios, as taxas e porcentagens anuais de colo do útero serão instáveis. Será preciso agregar períodos de vários anos ou regiões de saúde, ou suprimir o número abaixo de um limiar.

## Faixas por UF

O critério usa o pior valor de "sem tratamento" entre mama e colo do útero, nos anos de diagnóstico 2019–2023:

- **A:** até 15%;
- **B:** entre 15% e 35%;
- **C:** 35% ou mais.

Pelo critério do SIM, todas as UFs ficariam aceitáveis.

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

Legenda das colunas:

- **Casos e "sem trat."** referem-se aos anos de diagnóstico 2019–2023, por UF de residência.
- **≤60 d** é a parcela tratada em até 60 dias entre os casos com tratamento registrado. Tratamento com data anterior ao laudo conta como 0 dia.
- **Mun. ≥20 casos** é a % dos municípios da UF com 20 casos ou mais no período de 5 anos.
- **As três colunas de óbitos** vêm do SIM 2022–2024.

## Limitações desta medição

- **"Sem informação de tratamento" não é o mesmo que "não tratado".** O valor mistura três situações: tratamento fora do SUS, tratamento ainda não faturado e falhas na ligação CID + CNS. Este dado não permite separar uma da outra.
- **O SIM foi medido só no triênio 2022–2024.** Séries mais antigas, sobretudo no Norte e no Nordeste antes de 2010, têm mais óbitos mal definidos.
- **As faixas são um corte prático para decidir o recorte, não um padrão epidemiológico.**
