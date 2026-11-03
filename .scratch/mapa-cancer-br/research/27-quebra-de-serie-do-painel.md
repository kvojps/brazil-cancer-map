# Quebra de série do Painel-Oncologia (2018–2019) e seu efeito na Tendência do 60 dias

Medido em 2026-11-03 com os microdados `POBR2013–2026.dbc` do Painel-Oncologia (extração de 17/10/2026, os mesmos do pipeline). As regras do pipeline (`pipeline/sources/painel.py`) são as mesmas: "Todos" do tratamento = C00–C97 sem C44, C73 e C76–C80; "até 60 dias" = `TEMPO_TRAT` de `+0000` a `+0060` ou de `-0001` a `-0090` (regra do TabNet); sem informação = `TRATAMENTO = 5`. Tipos: mama C50, colo C53, próstata C61, colorretal C18–C21, pulmão C33–C34.

Scripts em [`27-scripts/`](27-scripts/), todos rodados da raiz do repositório com `uv run python -I`:
- `extract.py <dir POBR*.dbc> <saída.parquet>`: extrai os campos usados;
- `common.py`: definições compartilhadas (tipos, regra do 60 dias);
- `break_by_year.py <parquet>`: quebra por ano × tipo, por mês, por modalidade;
- `break_detail.py <parquet>`: modalidade por mês, quebra por UF, por estabelecimento de diagnóstico (`CNES_DIAG`);
- `apac_subseries.py <parquet>`: % em até 60 dias por modalidade, mês a mês;
- `effect_on_classes.py <parquet> site/public/dados/municipalities.json`: classes da Tendência dos municípios em cada alternativa, com o `pipeline.trend.quasi_poisson_trend` do próprio pipeline;
- `cascade_origin.py <parquet> site/public/dados/municipalities.json`: origem do dado na cascata com cada denominador.

## 1. Causa: documentação oficial

A **nota técnica** do Painel (http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf, lida em 2026-11-03) diz:

> "Informações de diagnóstico de câncer de colo do útero e de mama estão disponíveis desde 2013 devido ao ano de início de implantação do SISCAN. Para os demais canceres as informações de diagnóstico oriundas do procedimento diagnóstico 'exame anatomopatológico para congelamento/parafina por peça cirúrgica ou por biópsia' (exceto colo uterino e mama) estão disponíveis a partir de maio de 2018, quando passou a ser obrigatório o registro do cartão nacional de saúde e da CID-10 (Portaria SAS Nº 643, de 17 de maio de 2018). Contudo, também estão disponíveis informações de casos anteriores a maio de 2018, em que, seguindo as regras definidas para construção do painel, havia informação de diagnóstico registrado na AIH ou na APAC."

Ou seja: **até abril de 2018, um caso dos outros cânceres só existia no Painel se já tivesse um registro de tratamento (AIH ou APAC) com o diagnóstico.** Por isso a % sem informação era de ~4%. A partir de maio de 2018, o exame anatomopatológico (BPA-I) passou a criar casos sozinho: casos ainda sem tratamento registrado e casos operados (o anatomopatológico da peça cirúrgica, junto da cirurgia do SIH). A hipótese do ticket (entrada do SISCAN) estava errada quanto à origem: o SISCAN alimenta mama e colo desde 2013, e o que entrou em 2018 foi o BPA-I.

O dicionário (`ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/Dicionario_Painel_Oncologia.pdf`) não traz campo de origem do registro. A nota técnica também diz que o caso é a combinação CNS master × CID-10 e que, nas cirurgias, "o resultado diagnóstico [pode ser] posterior ao tratamento", o que explica a regra dos −90 dias.

## 2. Causa: evidência nos microdados

### 2.1 Por ano e tipo

| Tipo | Ano | Casos | % ≤ 60 dias (todos os casos) | % sem informação | % ≤ 60 dias (tratados) |
|---|---|---:|---:|---:|---:|
| Todos | 2016 | 169.043 | 47,1 | 4,0 | 49,1 |
| Todos | 2017 | 173.784 | 47,1 | 3,5 | 48,8 |
| Todos | 2018 | 249.706 | 45,4 | 16,9 | 54,7 |
| Todos | 2019 | 328.248 | 39,7 | 29,8 | 56,6 |
| Todos | 2023 | 374.027 | 37,1 | 31,2 | 54,0 |
| Todos | 2024 | 345.217 | 33,5 | 33,6 | 50,5 |
| Mama | 2017 → 2019 | 38.772 → 53.146 | 41,7 → 36,5 | 5,6 → 17,7 | 44,2 → 44,4 |
| Colo | 2017 → 2019 | 11.430 → 18.164 | 37,5 → 39,5 | 8,4 → 22,4 | 40,9 → 50,9 |
| Próstata | 2017 → 2019 | 26.045 → 43.862 | 27,9 → 27,6 | 2,7 → 22,5 | 28,7 → 35,6 |
| Colorretal | 2017 → 2019 | 17.681 → 36.280 | 52,5 → 42,5 | 1,5 → 30,3 | 53,3 → 61,0 |
| Pulmão | 2017 → 2019 | 8.911 → 13.413 | 67,5 → 50,9 | 1,5 → 25,0 | 68,5 → 67,8 |

A quebra aparece em **todos os tipos, inclusive mama e colo**: mesmo com o SISCAN desde 2013, o anatomopatológico do BPA-I também acrescentou casos desses dois tipos.

### 2.2 Por mês: a data da quebra

"Todos", Brasil:

| Mês | Casos | % sem informação | % ≤ 60 dias (tratados) |
|---|---:|---:|---:|
| 2018-01 a 2018-04 | 13,5–15,5 mil/mês | 3,1–3,4 | 46,7–47,6 |
| **2018-05** | 25.019 | **21,1** | **58,3** |
| 2018-06 a 2019-04 | 20–26 mil/mês | 19,6–23,8 | 55–59 |
| **2019-05** | 30.658 | **34,9** | 56,9 |
| 2019-06 em diante | | ~34 | ~57 |

São **dois degraus**: maio de 2018 (Portaria 643) e maio de 2019 (sem explicação na documentação; forte no MA, RO, RJ e GO). Em maio de 2018, os cinco tipos saltam no mesmo mês (% sem informação: colorretal 1,0 → 18,4; próstata 2,3 → 15,9; pulmão 1,0 → 15,0; mama 5,7 → 16,0; colo 9,0 → 13,4).

### 2.3 Por UF

Mês do salto (primeiro mês de 2018–2019 com a % sem informação ≥ nível pré-quebra + 10 p.p.):

| Mês | UFs |
|---|---|
| 2018-05 | 16 UFs: RR, MA, PI, CE, RN, PB, PE, AL, BA, MG, ES, SP, PR, SC, RS, MT |
| 2018-06 a 2018-12 | PA, GO (jun), RO (jul), DF (ago), TO (set), AM (dez) |
| 2019 | RJ (mar), AC e AP (jun), SE (set) |
| 2018-01 | MS (oscilação já antes da portaria) |

A data é a **mesma na maior parte do país**, com atraso de adesão em algumas UFs. O nível pós-quebra varia muito: em 2022–2024, de 6% (TO) e 8% (AC) a 60% (MA). Tabela completa: saída de `break_detail.py`.

### 2.4 Por estabelecimento de diagnóstico e modalidade

- Casos de estabelecimentos (`CNES_DIAG`) que **nunca** tinham diagnosticado antes de maio de 2018: 3% em 2018, 9–13% de 2019 a 2024. **A quebra não vem de estabelecimentos novos**, e sim de um tipo novo de registro nos mesmos hospitais. Mesmo nos estabelecimentos antigos, a % sem informação vai de ~4% para ~26%.
- 99,8% dos casos sem informação estão em estabelecimentos que também registram tratamentos: são hospitais oncológicos, e não laboratórios isolados.
- Por modalidade do primeiro tratamento ("Todos", casos por ano):

| Ano | Cirurgia | Quimio | Radio | Quimio + radio | Sem informação |
|---|---:|---:|---:|---:|---:|
| 2017 | 22.950 | 106.105 | 36.490 | 2.143 | 6.096 |
| 2018 | 56.363 | 112.089 | 36.778 | 2.156 | 42.320 |
| 2019 | 74.828 | 119.594 | 33.622 | 2.238 | 97.966 |
| 2023 | 76.667 | 141.565 | 36.244 | 2.776 | 116.775 |
| 2024 | 42.922 | 148.020 | 35.847 | 2.501 | 115.927 |

Os casos novos de 2018 são de dois tipos: **sem informação** (+36 mil em 2018) e **cirurgia** (+33 mil). A % em até 60 dias das cirurgias salta de 73% para 89% em maio de 2018, porque o diagnóstico da peça cirúrgica sai depois da operação, o que conta como "no prazo" até −90 dias. Por isso, trocar o denominador para os casos tratados **não corrige** a quebra: inverte o sinal dela.

### 2.5 A série de quimio e radio não tem degrau

% em até 60 dias entre os casos cujo primeiro tratamento é quimio, radio ou ambos (APAC), "Todos":

| 2018-01 a 04 | 2018-05 a 08 | 2019-02 a 04 | 2019-05 a 07 | 2024-01 a 06 |
|---|---|---|---|---|
| 42,6–43,8 | 42,5–43,8 | 40,6–41,7 | 41,4–43,7 | 38,0–41,7 |

Por ano: 44,3 (2014), 44,1, 45,1, 44,9, 42,6 (2018), 41,5, 45,3 (2020), 42,6, 39,5, 39,3, 41,0 (2024). Tipos: mama 39,2 → 35,0; colo 39,8 → 34,2; próstata 24,8 → 23,7; colorretal 45,7 → 42,9; pulmão 69,8 → 58,2.

A série passa pelas três quebras (maio de 2018, maio de 2019 e a de 2024, seção 4) **sem degrau**: o registro do diagnóstico e do tratamento pela APAC não mudou. É o único recorte comparável de 2014 a 2024. O custo é deixar de fora a cirurgia como primeiro tratamento (13,7% dos tratados em 2017, 29,8% em 2023, quase só no regime pós-quebra) e os casos sem tratamento registrado.

## 3. Efeito sobre as classes do Mapa inicial

"60 dias × Todos", só o dado do próprio município (sem a cascata), malha 2025 (5.571 municípios), com o `quasi_poisson_trend` do pipeline:

| Alternativa | Piorando | Melhorando | Estável | Sem direção clara | Não calculável | Municípios com ≥ 20/ano | Brasil: variação anual [IC 95%] |
|---|---:|---:|---:|---:|---:|---:|---|
| **A**. 2015–2024, todos os casos (atual) | 906 | 108 | 0 | 4.554 | 3 | 2.073 | −3,7% [−4,7; −2,7] piorando |
| **B**. 2019–2024, todos os casos | 386 | 96 | 2 | 5.071 | 16 | 2.416 | −3,3% [−5,6; −1,0] piorando |
| **C**. 2015–2024, denominador = tratados | 190 | 341 | 1 | 5.036 | 3 | 1.613 | +0,7% [−1,0; +2,5] sem direção |
| **D**. 2019–2024, denominador = tratados | 358 | 78 | 2 | 5.112 | 21 | 1.811 | −2,4% [−4,0; −0,7] piorando |
| **E**. 2019–2023, todos os casos | 248 | 99 | 1 | 5.192 | 31 | 2.438 | −2,4% [−5,3; +0,5] sem direção |
| **F**. 2019–2023, denominador = tratados | 244 | 86 | 4 | 5.201 | 36 | 1.812 | −1,8% [−4,1; +0,6] sem direção |
| **G**. 2015–2024, só quimio/radio | 448 | 151 | 2 | 4.955 | 15 | 1.225 | −1,3% [−2,2; −0,4] piorando |

Dos 906 municípios "piorando" em A, 696 viram "sem direção clara" em B. Por UF, A tem 21 UFs piorando; G tem 13, e RR e MA passam de piorando a sem direção e melhorando, respectivamente.

**Leitura:** a piora é real, mas menor. As alternativas limpas (E, F, G) estimam de −1,3% a −2,4% ao ano para o Brasil, contra −3,7% hoje: **entre metade e dois terços da inclinação atual vem do registro**, e cerca de metade dos municípios "piorando" de A sai dessa classe em G.

## 4. Achado novo: queda das cirurgias a partir de abril de 2024

Casos com primeiro tratamento por cirurgia, "Todos", por mês: ~5,2–7,3 mil/mês em 2022 e 2023 e até fevereiro de 2024; depois 4.392 (abr/2024), 3.512, 3.041, … 1.914 (dez/2024), e **~1,5–2,2 mil/mês durante todo o ano de 2025**. Um atraso de registro deixaria os meses mais recentes mais baixos; aqui o patamar é plano em 2025, então é uma **mudança estrutural**, e não atraso. A nota técnica não a explica. Os casos sem informação e os de quimio/radio não mudam de patamar.

Efeito: 2024, que é o último ano consolidado e o ano da Situação, perde ~34 mil cirurgias, quase todas no prazo. A % em até 60 dias de todos os casos cai de 37,1% (2023) para 33,5% (2024), e a % sem informação sobe de 31,2% para 33,6%. A série de quimio/radio (G) não é afetada.

## 5. Alcance

- **Situação:** usa o último ano consolidado, 2024, e cai dentro do regime pós-2018 (sem efeito da quebra de 2018), mas sofre a queda das cirurgias de 2024 (seção 4). Como quase nenhum município chega a 80% do prazo, a faixa de Situação quase não muda; o número exibido, sim.
- **Faixa A/B/C:** os últimos 5 anos consolidados (2020–2024) estão todos no regime pós-2018, então a faixa não é afetada pela quebra de 2018. A queda das cirurgias em 2024 eleva um pouco a % sem informação desse ano (o denominador perde as cirurgias).
- **Mínimo de 20 por ano (cascata), janela 2015–2024, origem do dado:**

| Denominador do mínimo | Município | Região imediata | Dado insuficiente |
|---|---:|---:|---:|
| Todos os casos | 2.073 | 3.461 | 37 |
| Só quimio/radio | 1.225 | 4.273 | 73 |

- **Gráfico do cartão:** a série de todos os casos tem degraus em maio de 2018 e em 2024; a de quimio/radio, não.
