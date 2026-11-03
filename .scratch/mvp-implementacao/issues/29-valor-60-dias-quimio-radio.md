# 29: Valor e Situação do 60 dias sobre os casos de quimio e radio

**What to build:** o número do 60 dias deixa de cair só porque, desde abril de 2024, muitas cirurgias deixaram de aparecer no Painel. O valor do último ano consolidado (e, no ticket 08, a Situação) passa a sair dos mesmos casos da Tendência: os que começaram por quimioterapia, radioterapia ou ambos. A % sem informação e a faixa A/B/C continuam sobre todos os casos. O pipeline também passa a vigiar a contagem mensal por modalidade, para pegar a próxima quebra cedo. Referência: spec, seções 5, 6.3, 6.4, 9, 11.2 e 14; decisão e medições no [ticket de decisão 28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md) e na [pesquisa 28](../../mapa-cancer-br/research/28-queda-das-cirurgias-em-2024.md).

**Blocked by:** 27 — Tendência do 60 dias sobre os casos de quimio e radio

**Status:** ready-for-agent

- [ ] `value` da camada do 60 dias passa a ser a % em até 60 dias dos casos de quimio/radio (`chemo_radio_within_60_days` / `chemo_radio`) no último ano consolidado; um teste mostra que um município que perde só cirurgias não muda de valor
- [ ] `without_treatment_info` continua sobre todos os casos diagnosticados, sem mudança em nenhum município
- [ ] A validação do valor contra o TabNet passa a usar a tabela filtrada por modalidade (já baixada no ticket 27); a comparação de todos os casos continua, agora para validar a % sem informação e as contagens. Se uma falhar, nada do Painel é publicado
- [ ] A validação do Painel confere a contagem nacional de casos por mês e por modalidade de primeiro tratamento (cirurgia, quimio/radio, sem informação) e emite um alerta, sem bloquear a publicação, quando um mês fora dos provisórios cai muito abaixo da mediana dos 12 meses anteriores; com a extração de 17/10/2026, o alerta dispara nas cirurgias a partir de abril de 2024
- [ ] O `period` da camada e do `manifest.json` diz que o valor também é medido em quimio/radio (por exemplo `"value_cases": "chemo_radio"`), e `source.period` diz isso em português
- [ ] A legenda, o tooltip e a tabela acessível do mapa deixam de dizer "(todos os casos diagnosticados)" para o valor e passam a dizer que valor e Tendência vêm dos casos tratados com quimioterapia ou radioterapia; a % sem informação continua marcada como de todos os casos
- [ ] O pipeline roda de novo e regenera `site/public/dados/map/within_60_days/all.json` e `manifest.json`; o valor do Brasil em 2024 fica registrado nos comentários (a pesquisa prevê 41,0%, contra 33,5% em todos os casos)
- [ ] O texto da nota de método para a metodologia (ticket 24) fica registrado neste ticket: a queda das cirurgias de 2024, a causa provável (CPF na AIH, sem confirmação oficial), por que o valor também passou a quimio/radio, a diferença em relação ao TabNet e o efeito na faixa A/B/C (4 células de fronteira)

Fora deste ticket: a Situação e o modo "como está hoje" ficam no ticket 08, e a barra e a nota do cartão no ticket 10, os dois já usando este valor.
