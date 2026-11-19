# Quebras de série do Painel-Oncologia

> Leitura curta. A [versão completa](https://github.com/kvojps/brazil-cancer-map/blob/11fd03c47e1ce09b9a2ccb873ccc75da1ccb304f/docs/data/painel-series-breaks.md), com a investigação por UF, estabelecimento e tipo, as tabelas intermediárias e todas as fontes, está no commit `11fd03c`.

Sustenta o recorte de quimio e radio no valor, na Situação e na Tendência do 60 dias. A decisão e o custo aceito estão no [ADR 3](../adr/0003-within-60-days-on-chemo-and-radio-cases.md), e o método em [`/metodologia/#60-dias`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#60-dias).

**Data:** 03/11/2026, microdados `POBR2013–2026.dbc` da extração de 17/10/2026, a mesma do pipeline.

## Resultado

**A série de todos os casos tem três quebras de registro, e a de quimio e radio não tem nenhuma.** Por isso o 60 dias usa só os casos cujo primeiro tratamento é quimio, radio ou ambos.

| Quebra | Causa | Efeito na série de todos os casos |
|---|---|---|
| Maio de 2018 | Portaria SAS nº 643/2018: o anatomopatológico do BPA-I passa a criar casos sozinho, segundo a nota técnica do Painel | % sem informação de 3,1–3,4% para 21,1% no mês, nos cinco tipos e em 16 UFs no mesmo mês |
| Maio de 2019 | Sem explicação na documentação | % sem informação para 34,9% |
| Abril de 2024 | **Hipótese, sem confirmação oficial:** a AIH ganha campo próprio de CPF na competência 04/2024, e o Painel liga os registros pelo CNS master | Cirurgias de ~6,5 mil/mês para ~2 mil/mês em 2025. % em até 60 dias de 37,1% (2023) para 33,5% (2024) |

- **Quimio e radio atravessam as três quebras sem degrau:** 42,6–43,8% em até 60 dias antes e depois de maio de 2018, e de 39,3% a 45,3% por ano de 2014 a 2024. É o único recorte comparável em toda a janela.
- **A cirurgia não caiu no SUS.** No TabNet do SIH, as AIH do subgrupo 0416 vão de 177.007 (2023) a 195.928 (2024) e 214.349 (2025), sem degrau em abril de 2024. No Painel, 581 dos 909 estabelecimentos que operavam passam a zero ou quase zero cirurgias e concentram 95% da perda, mantendo quimio e radio.
- **Trocar o denominador para os casos tratados não corrige a quebra de 2018:** inverte o sinal dela, porque as cirurgias novas entram quase todas no prazo.
- **Custo aceito:** saem a cirurgia como primeiro tratamento (13,7% dos tratados em 2017, 29,8% em 2023) e os casos sem tratamento registrado. Os municípios com 20 casos ou mais por ano caem de 2.073 para 1.225.
- **Faixa A/B/C e Situação quase não mudam com a queda de 2024.** Só 4 das 162 células UF × tipo mudam de faixa na janela 2020–2024, todas na borda (≤ 0,6 p.p.). A classe de Situação fica em "longe" em quase todos os municípios em qualquer opção; o número exibido muda.

**Alternativas medidas antes da decisão** ("60 dias × Todos", sem cascata, 5.571 municípios):

| Alternativa | Piorando | Melhorando | Sem direção clara | Brasil: variação anual [IC 95%] |
|---|---:|---:|---:|---|
| A. 2015–2024, todos os casos (regra da época) | 906 | 108 | 4.554 | −3,7% [−4,7; −2,7] |
| B. 2019–2024, todos os casos | 386 | 96 | 5.071 | −3,3% [−5,6; −1,0] |
| C. 2015–2024, denominador = tratados | 190 | 341 | 5.036 | +0,7% [−1,0; +2,5] |
| D. 2019–2024, denominador = tratados | 358 | 78 | 5.112 | −2,4% [−4,0; −0,7] |
| E. 2019–2023, todos os casos | 248 | 99 | 5.192 | −2,4% [−5,3; +0,5] |
| F. 2019–2023, denominador = tratados | 244 | 86 | 5.201 | −1,8% [−4,1; +0,6] |
| **G. 2015–2024, só quimio/radio (adotada)** | 448 | 151 | 4.955 | −1,3% [−2,2; −0,4] |

A piora é real, mas menor: entre metade e dois terços da inclinação da regra da época vinha do registro.

## Resultado depois das decisões

Com a extração de 17/10/2026, já com o recorte de quimio e radio:

- **Tendência sem cascata:** 448 piorando, 151 melhorando, 2 estáveis, 4.955 sem direção clara e 15 não calculáveis. Dos 906 "piorando" da regra anterior, 562 passaram a "sem direção clara". Brasil: −1,3% ao ano [IC 95% −2,2; −0,4].
- **Com a cascata:** 1.225 municípios com dado próprio, 4.273 pela Região imediata e 73 com Dado insuficiente.
- **Valor do Brasil, Todos, 2024:** 76.383 / 186.368 = 41,0%. A % sem informação (33,6%) e as faixas de qualidade não mudaram em nenhum município.
- **Conferência com o TabNet:** contagens de casos e de "até 60 dias" exatas nas 351 combinações UF × ano (27 UFs, 2014–2026), nas duas tabelas.
- **Vigilância mensal:** 16 alertas, sem bloquear a publicação. O limiar está em [`data-sources.md`](../data-sources.md#painel).
  - Cirurgia: abril de 2020 e abril a dezembro de 2024.
  - Quimio/radio: abril de 2020.
  - Sem informação: fevereiro de 2015, fevereiro de 2017 e abril a junho de 2020.

## Método

Regras do pipeline: "Todos" do tratamento = C00–C97 sem C44, C73 e C76–C80; "até 60 dias" = `TEMPO_TRAT` de `+0000` a `+0060` ou de `-0001` a `-0090`, como o TabNet; sem informação = `TRATAMENTO = 5`; cirurgia = `1`; quimio/radio = `2`, `3` ou `4`. A Tendência usa o `quasi_poisson_trend` do pipeline. A causa das quebras vem da [nota técnica do Painel](http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf), dos [avisos do SIHD](http://sihd.datasus.gov.br/principal/listarAvisos.php), dos layouts do SISAIH01 e do [TabNet do SIH](http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sih/cnv/qibr.def), lidos em 03/11/2026. Os scripts exploratórios não fazem parte do repositório.
