# 29: Valor e Situação do 60 dias sobre os casos de quimio e radio

**What to build:** o número do 60 dias deixa de cair só porque, desde abril de 2024, muitas cirurgias deixaram de aparecer no Painel. O valor do último ano consolidado (e, no ticket 08, a Situação) passa a sair dos mesmos casos da Tendência: os que começaram por quimioterapia, radioterapia ou ambos. A % sem informação e a faixa A/B/C continuam sobre todos os casos. O pipeline também passa a vigiar a contagem mensal por modalidade, para pegar a próxima quebra cedo. Referência: spec, seções 5, 6.3, 6.4, 9, 11.2 e 14; decisão e medições no [ticket de decisão 28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md) e na [pesquisa 28](../../mapa-cancer-br/research/28-queda-das-cirurgias-em-2024.md).

**Blocked by:** 27 — Tendência do 60 dias sobre os casos de quimio e radio

**Status:** resolved

- [x] `value` da camada do 60 dias passa a ser a % em até 60 dias dos casos de quimio/radio (`chemo_radio_within_60_days` / `chemo_radio`) no último ano consolidado; um teste mostra que um município que perde só cirurgias não muda de valor
- [x] `without_treatment_info` continua sobre todos os casos diagnosticados, sem mudança em nenhum município
- [x] A validação do valor contra o TabNet passa a usar a tabela filtrada por modalidade (já baixada no ticket 27); a comparação de todos os casos continua, agora para validar a % sem informação e as contagens. Se uma falhar, nada do Painel é publicado
- [x] A validação do Painel confere a contagem nacional de casos por mês e por modalidade de primeiro tratamento (cirurgia, quimio/radio, sem informação) e emite um alerta, sem bloquear a publicação, quando um mês fora dos provisórios cai muito abaixo da mediana dos 12 meses anteriores; com a extração de 17/10/2026, o alerta dispara nas cirurgias a partir de abril de 2024
- [x] O `period` da camada e do `manifest.json` diz que o valor também é medido em quimio/radio (por exemplo `"value_cases": "chemo_radio"`), e `source.period` diz isso em português
- [x] A legenda, o tooltip e a tabela acessível do mapa deixam de dizer "(todos os casos diagnosticados)" para o valor e passam a dizer que valor e Tendência vêm dos casos tratados com quimioterapia ou radioterapia; a % sem informação continua marcada como de todos os casos
- [x] O pipeline roda de novo e regenera `site/public/dados/map/within_60_days/all.json` e `manifest.json`; o valor do Brasil em 2024 fica registrado nos comentários (a pesquisa prevê 41,0%, contra 33,5% em todos os casos)
- [x] O texto da nota de método para a metodologia (ticket 24) fica registrado neste ticket: a queda das cirurgias de 2024, a causa provável (CPF na AIH, sem confirmação oficial), por que o valor também passou a quimio/radio, a diferença em relação ao TabNet e o efeito na faixa A/B/C (4 células de fronteira)

Fora deste ticket: a Situação e o modo "como está hoje" ficam no ticket 08, e a barra e a nota do cartão no ticket 10, os dois já usando este valor.

## Comments

**Andamento (sessão de 2026-11-03, interrompida antes de fechar o ticket).**

Feito, com testes (`uv run pytest`: 83 passando; `uv run mypy` e `npm run check` sem erros):
- `value` da camada = `chemo_radio_within_60_days / chemo_radio` no último ano consolidado (`_trend_and_shares` em `pipeline/sources/painel.py`); `without_treatment_info` continua sobre todos os casos. Teste: `test_a_municipality_that_loses_only_surgeries_keeps_its_value`.
- `period` ganha `"value_cases": "chemo_radio"` (constante `MEASURED_CASES`, que substituiu `TREND_CASES`); `source.period`: "Tendência 2015–2024 e valor de 2024 medidos nos casos tratados com quimioterapia ou radioterapia; % sem informação de 2024 sobre todos os casos diagnosticados; faixa de qualidade …".
- Validação contra o TabNet: `parse_tabnet` lê também a coluna "Sem informação de tratamento" (opcional: a tabela de quimio/radio não a tem), e `compare_with_tabnet` confere a contagem de casos (tolerância de 1%), a % em até 60 dias e a % sem informação (0,5 p.p.). A tabela de todos os casos valida a % sem informação e as contagens; a de quimio/radio valida o valor. Se uma falhar, nada é publicado.
- Vigilância mensal: `count_cases` agora devolve `PainelCounts` (`by_municipality` e `by_month`), numa única passada; `by_month` conta os casos de "Todos", Brasil, por mês do diagnóstico (`ANOMES_DIA`) × `FirstTreatment` (cirurgia, quimio/radio, sem informação) e vai para `data/clean/painel/months.parquet`. `monthly_drops` alerta quando um mês fora dos anos provisórios fica abaixo de 75% (`DROP_SHARE`) da mediana dos 12 meses anteriores (mês ausente conta como 0). O passo `validate` imprime os alertas no stderr (`painel: alert: …`) sem bloquear; `export` roda só as checagens que bloqueiam (`_check`), para não repetir os alertas.
- Site: `trendCasesText` virou `measuredCasesText` ("Tendência e valor do último ano medidos nos casos tratados com quimioterapia ou radioterapia") na legenda, no tooltip e na tabela; o tooltip diz "X% de todos os casos diagnosticados sem informação de tratamento"; a legenda da tabela diz que a % sem informação é sobre todos os casos.

Falta:
- Rodar o pipeline com os dados reais (`uv run python -m pipeline run --source painel`; o `clean` precisa rodar de novo por causa do `ANOMES_DIA` e do `months.parquet`), conferir que as duas comparações com o TabNet passam e que o alerta dispara nas cirurgias a partir de abril de 2024 (se não, ajustar `DROP_SHARE`; conferir também que 2020, a pandemia, não gera alertas demais).
- Regenerar e commitar `site/public/dados/map/within_60_days/*.json` e `manifest.json`; registrar aqui o valor do Brasil em 2024 (a pesquisa prevê 41,0%) e os alertas emitidos.
- Escrever aqui o texto da nota de método para a metodologia (ticket 24): queda das cirurgias de 2024, causa provável (CPF na AIH, sem confirmação oficial), por que o valor passou a quimio/radio, a diferença em relação ao TabNet e o efeito na faixa A/B/C (4 células de fronteira). Base: ticket de decisão 28 e pesquisa 28.
- Revisão (`code-review`), marcar as caixas, trocar o status para `resolved` e listar os commits.

**Nota de método para o ticket 24.** Desde abril de 2024, muitas cirurgias deixaram de aparecer no Painel-Oncologia: os registros mensais caíram de cerca de 6 mil para cerca de 2 mil e permaneceram nesse patamar em 2025. A pesquisa encontrou perda do vínculo das AIH aos casos em 581 hospitais, sem queda correspondente das cirurgias no SIH. A hipótese é que a introdução do CPF do paciente na AIH, na competência de abril de 2024, tenha prejudicado o vínculo pelo CNS; essa causa não tem confirmação oficial. Os casos operados em grande parte somem do Painel, em vez de passar à categoria sem informação de tratamento.

Por isso, o valor do último ano consolidado, assim como a Tendência, usa os casos cujo primeiro tratamento registrado foi quimioterapia, radioterapia ou ambos. O numerador conta esses casos tratados em até 60 dias e o denominador conta todos esses casos. Esse recorte não apresenta as quebras de registro de 2018, 2019 e 2024, mas exclui a cirurgia como primeiro tratamento e os casos sem informação. O valor difere da consulta de todos os casos no TabNet e deve ser comparado à tabela filtrada pelas mesmas modalidades. A % sem informação e a faixa A/B/C continuam sobre todos os casos diagnosticados.

Na janela de qualidade 2020–2024, a perda das cirurgias eleva a % sem informação em média 0,4 ponto percentual em Todos e afeta somente 4 das 162 células UF × tipo, todas na fronteira. No contrafactual sem a perda, Mama/MS (15,3% → 15,0%), Mama/DF (15,1% → 14,9%) e Próstata/GO (15,1% → 15,0%) passariam de B para A; Todos/PE (35,1% → 34,5%) passaria de C para B. Esses números são a estimativa contrafactual da [pesquisa 28, seção 3.2](../../mapa-cancer-br/research/28-queda-das-cirurgias-em-2024.md), não uma correção aplicada aos dados publicados.


**Conclusão (2026-11-03).** Reexecutadas as etapas `clean`, `compute`, `validate` e `export` com os microdados e as duas tabelas do TabNet já baixados da extração de 17/10/2026. A tentativa de executar também `download` foi interrompida enquanto o TabNet não respondia; nenhum arquivo da extração mudou. As duas comparações (todos os casos e quimio/radio), em todos os anos e UFs, passaram, assim como as verificações das seis camadas. Regenerados os seis JSON de `within_60_days` e o `manifest.json`.

Brasil, Todos, diagnóstico de 2024: **76.383 / 186.368 = 40,9850% (41,0%)** nos casos de quimio/radio; em todos os casos, 115.777 / 345.217 = 33,5375% (33,5%). Sem informação: 115.927 / 345.217 = 33,5809%. A comparação dos JSON antes/depois confirmou **zero mudanças de `without_treatment_info` em qualquer município, nos seis tipos**, e nenhuma mudança nas faixas de qualidade.

Mantido o limiar de alerta de 75% da mediana dos 12 meses anteriores. Foram emitidos 16 alertas, sem bloquear a publicação:
- Cirurgia: abril de 2020 e **abril a dezembro de 2024**. Em abril de 2024: 4.392 casos, 71% da mediana de 6.228; em dezembro: 1.914, 58% da mediana de 3.276.
- Quimio/radio: abril de 2020.
- Sem informação: fevereiro de 2015, fevereiro de 2017 e abril a junho de 2020.

Os cinco alertas de 2020 se concentram no início da pandemia. Os anos provisórios 2025 e 2026 não geram alertas. A revisão encontrou e corrigiu a ausência de meses inteiros na vigilância: agora o calendário é contínuo e um mês ausente conta como zero. O diagnóstico mensal é calculado e persistido em `compute`; `validate` apenas emite os alertas prontos.

Validação final: `uv run pytest` — **84 testes passando**; `uv run mypy` — sem erros; `npm run check` — sem erros ou avisos; `npm run build` — concluído (aviso de tamanho do bundle). Revisão paralela `code-review`, base `691026b`: Standards e Spec sem pendências após as correções.

Commits que resolveram o ticket:
- `eb96bfd` — `feat: measure the within-60-days value on chemo/radio cases and watch monthly counts`.
- Commit deste fechamento — `fix: complete monthly monitoring and publish chemo/radio values` (correções da revisão, dados regenerados e nota de método).
