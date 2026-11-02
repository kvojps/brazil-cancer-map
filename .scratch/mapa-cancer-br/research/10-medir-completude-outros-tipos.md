# Qualidade dos dados dos outros tipos de câncer por UF

Medido em 2026-11-02 com os mesmos microdados de [09-medir-completude-por-uf.md](09-medir-completude-por-uf.md): Painel-Oncologia `POBR2019–2024.dbc`, gravados em 17/10/2026, e SIM `DO<UF>2022–2024.dbc`. Como antes, as métricas do Painel usam os anos de diagnóstico 2019–2023, e 2024 entra só na tendência.

**Tipos medidos.** Os CIDs vêm de `DIAG_DETH`, por UF de residência:

| Tipo | CID |
|---|---|
| Todos os cânceres | `DIAGNOSTIC=01`, ou seja, C00–C97 sem C44 (pele não melanoma) e sem C73 (tireoide). O Painel põe C44 e C73 juntos em `DIAGNOSTIC=04`. |
| Todos, sem sítio mal definido | o mesmo, sem C76–C80 |
| Mama / colo do útero | C50 / C53 (repetidos para comparar) |
| Próstata | C61 |
| Colorretal | C18–C21 |
| Pulmão | C33–C34 |
| Estômago | C16 |

**Faixas**, as mesmas do ticket 09, aplicadas à % "sem informação de tratamento" de cada tipo: **A** abaixo de 15%, **B** de 15% a 35%, **C** 35% ou mais.

Scripts em [`10-scripts/`](10-scripts/): `po_todos.py` extrai, `po_tipos_uf.py` gera as métricas do Painel e `sim_tipos_uf.py` as do SIM (este lê os `.dbf` já descomprimidos pelo `sim_uf.py` do ticket 09). Tabelas: [`10-tabela-uf-tipo-painel.csv`](10-tabela-uf-tipo-painel.csv) (formato longo, com a linha `BR`) e [`10-tabela-uf-sim.csv`](10-tabela-uf-sim.csv).

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

**UFs na faixa C por tipo:**
- Todos sem C76–C80: AL, MA, PE, RN, RO, RR, RS.
- Mama: MA, RN, RR.
- Colo do útero: AP, RN, RO, RR.
- Próstata: MS, RR.
- Colorretal: RJ, RO, RS.
- Pulmão: ES, MS.
- Estômago: AL (89%), RS (86%), MS (77%), RN (73%), GO, SP, RJ, PE, ES, RO.

**Tendência nacional da % sem tratamento (2019 → 2023 → 2024):**
- Todos: 34,2 → 34,2 → 36,9
- Próstata: 22,5 → 21,3 → 24,7
- Colorretal: 30,3 → 32,7 → 35,0
- Pulmão: 25,0 → 26,0 → 25,4
- Estômago: 47,7 → 54,5 → 59,6, com pico de 61% em 2021–2022

## Achados

1. **Próstata, colorretal e pulmão se sustentam no mesmo nível de mama e colo do útero.** São de 2 a 3 UFs na faixa C, e o valor nacional fica entre 21% e 32%.
2. **O estômago não se sustenta no eixo Acesso ao tratamento.** No país, 56% dos casos vêm sem tratamento, 10 UFs ficam na faixa C, a série piora e o valor chega a 89% em AL. Só 11% dos casos têm cirurgia como primeiro tratamento, contra 21% nos demais tipos. Isso sugere que a gastrectomia não está sendo ligada ao diagnóstico, somada ao diagnóstico tardio, em que a pessoa morre antes de tratar. Este dado não separa as duas causas. Mostrar "56% sem tratamento" comunicaria uma falha que pode ser do registro.
3. **"Todos os cânceres" precisa de uma definição explícita.** Os códigos C80 (primário desconhecido) e C76 (sítio mal definido) somam 7% dos casos, mas 19% dos casos sem tratamento, porque 88–89% deles vêm sem tratamento. Também distorcem algumas UFs: o CE cai de 41% para 20% sem eles, o MT de 36% para 17% e a SC de 38% para 26%. Outra opção é excluir C76–C80 do "Todos" no eixo Acesso ao tratamento, o que deixa 7 UFs na faixa C. O C73 (tireoide) já fica de fora, porque o Painel o agrupa com o C44.
4. **"Tratado em até 60 dias" não se compara entre tipos, sobretudo na próstata (35%).** Na próstata de baixo risco, a vigilância ativa e a hormonioterapia adiada são conduta correta. Por isso, um número baixo nesse tipo não indica, por si só, falha de acesso. O indicador da Lei dos 60 dias para próstata precisa de ressalva ou não deve ser usado.
5. **Os números municipais de pulmão e estômago são tão pequenos quanto os de colo do útero.** Só de 10% a 14% dos municípios somam 20 casos ou mais em 5 anos. Mama, próstata e colorretal ficam entre 26% e 34%. O "Todos" passa de 93%, por isso **é a única visão que funciona município a município sem agregar**.
6. **O SIM está bom para os quatro tipos novos.** Os códigos de sítio mal definido que poderiam absorver óbitos desses tipos são desprezíveis: C39 (respiratório) responde por 0,3% dos óbitos de pulmão e C63 (genital masculino) por 0,2% dos de próstata. A exceção é o **C26 (digestivo mal definido)**, com 10% dos óbitos digestivos no país e até 16,5% no PI e 13,6% em MG. É um problema da mesma natureza que o C55 no útero, só que menor. C76–C80 e C97 somam 6,1% dos óbitos por câncer no país, variando de 3,4% (DF) a 9,2% (MG).

## Recomendação para [Quais indicadores entram no MVP?](../issues/04-indicadores-do-mvp.md)

- **Seletor do MVP:** mama, colo do útero, próstata, colorretal e pulmão, ou seja, **5 tipos**.
- **Estômago:** sai do MVP ou entra só com Panorama (tendência de mortalidade no SIM). Nesse caso, o eixo Acesso ao tratamento mostra uma justificativa, como "o registro de tratamento deste tipo ainda é incompleto". A escolha fica para o ticket 04.
- **"Todos os cânceres"** no Acesso ao tratamento passa a significar C00–C97 sem C44, C73 e C76–C80, e a definição aparece na página. As UFs da faixa C mudam conforme a visão, então a ressalva de qualidade precisa ser **por UF e por tipo**, não uma lista fixa de UFs.
- **"Até 60 dias"** fica sem ressalva só para os tipos em que a demora é inequivocamente ruim. Para próstata, ressalva ou exclusão.

## Limitações

- Valem as mesmas do ticket 09: "sem informação" não é o mesmo que "não tratado", e as faixas são um corte prático.
- A hipótese sobre a gastrectomia no estômago não foi verificada no SIH.
- `mun_com_caso` da linha BR passa de 100% porque inclui códigos de município ignorado ou inválido. Os valores por UF não têm esse problema.
