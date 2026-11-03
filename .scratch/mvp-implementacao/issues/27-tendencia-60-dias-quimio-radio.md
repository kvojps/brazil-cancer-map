# 27: Tendência do 60 dias sobre os casos de quimio e radio

**What to build:** a Tendência do 60 dias deixa de pintar como "piorando" uma queda que vem da mudança de registro do Painel em maio de 2018. A classe passa a sair só dos casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos, uma série sem degrau de 2014 a 2024. O valor, a % sem informação e (no ticket 08) a Situação continuam sobre todos os casos, comparáveis ao TabNet. Referência: spec, seções 6.3, 6.4, 7, 8 e 11.2; decisão e medições no [ticket de decisão 27](../../mapa-cancer-br/issues/27-quebra-de-serie-do-painel.md) e na [pesquisa 27](../../mapa-cancer-br/research/27-quebra-de-serie-do-painel.md).

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** ready-for-agent

- [ ] A limpeza do Painel conta também, por ano × município × tipo, os casos com `TRATAMENTO` 2, 3 ou 4 e, entre eles, os em até 60 dias (mesma regra do TabNet, inclusive os −1 a −90 dias), e grava as duas contagens no Parquet padronizado, ao lado das atuais
- [ ] A Tendência de cada município usa numerador = casos de quimio/radio em até 60 dias e denominador = casos de quimio/radio, com o mesmo `quasi_poisson_trend`, a mesma janela (hoje 2015–2024) e os mesmos anos provisórios; um teste mostra que um município com degrau só nos casos de cirurgia e sem informação não muda de classe
- [ ] `value` e `without_treatment_info` da camada continuam calculados sobre todos os casos diagnosticados, e a validação atual contra o TabNet (todos os casos, por UF e ano) continua passando sem mudança
- [ ] A validação compara também, por UF e ano, os casos de quimio/radio e os em até 60 dias entre eles com uma tabela do TabNet filtrada pela Modalidade terapêutica (quimioterapia, radioterapia e ambos), baixada no `download` como as atuais; se falhar, nada do Painel é publicado
- [ ] A série anual de quimio/radio (casos e % em até 60 dias) por município fica disponível no dado limpo para o gráfico do cartão (ticket 10), que mostra a série da Tendência e não a de todos os casos
- [ ] O `period` da camada e do `manifest.json` diz em que universo a Tendência foi calculada (por exemplo `"trend_cases": "chemo_radio"`), e o texto de `source.period` deixa isso claro em português
- [ ] A legenda e o tooltip do mapa dizem que a Tendência do 60 dias é medida nos casos tratados com quimioterapia ou radioterapia; o tooltip continua mostrando o valor e a % sem informação de todos os casos do último ano
- [ ] O pipeline roda de novo e regenera `site/public/dados/map/within_60_days/all.json` e `manifest.json`; a distribuição nova das classes fica registrada nos comentários (a pesquisa prevê, sem cascata, cerca de 448 piorando, 151 melhorando, 2 estável, 4.955 sem direção clara e 15 não calculáveis)
- [ ] O texto da nota de método fica registrado neste ticket para a metodologia (ticket 24): a quebra de maio de 2018 (Portaria SAS nº 643/2018), o recorte de quimio e radio e o porquê, o efeito medido (Brasil −3,7% → −1,3% ao ano) e a queda das cirurgias em 2024 ([ticket de decisão 28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md))

Fora deste ticket: o mínimo da cascata contado nos casos de quimio/radio já está no ticket 05; a nota de 2024 no cartão, no ticket 10; a Situação, no ticket 08.
