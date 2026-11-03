# 27: Tendência do 60 dias sobre os casos de quimio e radio

**What to build:** a Tendência do 60 dias deixa de pintar como "piorando" uma queda que vem da mudança de registro do Painel em maio de 2018. A classe passa a sair só dos casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos, uma série sem degrau de 2014 a 2024. O valor, a % sem informação e (no ticket 08) a Situação continuam sobre todos os casos, comparáveis ao TabNet. Referência: spec, seções 6.3, 6.4, 7, 8 e 11.2; decisão e medições no [ticket de decisão 27](../../mapa-cancer-br/issues/27-quebra-de-serie-do-painel.md) e na [pesquisa 27](../../mapa-cancer-br/research/27-quebra-de-serie-do-painel.md).

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** resolved

- [x] A limpeza do Painel conta também, por ano × município × tipo, os casos com `TRATAMENTO` 2, 3 ou 4 e, entre eles, os em até 60 dias (mesma regra do TabNet, inclusive os −1 a −90 dias), e grava as duas contagens no Parquet padronizado, ao lado das atuais
- [x] A Tendência de cada município usa numerador = casos de quimio/radio em até 60 dias e denominador = casos de quimio/radio, com o mesmo `quasi_poisson_trend`, a mesma janela (hoje 2015–2024) e os mesmos anos provisórios; um teste mostra que um município com degrau só nos casos de cirurgia e sem informação não muda de classe
- [x] `value` e `without_treatment_info` da camada continuam calculados sobre todos os casos diagnosticados, e a validação atual contra o TabNet (todos os casos, por UF e ano) continua passando sem mudança
- [x] A validação compara também, por UF e ano, os casos de quimio/radio e os em até 60 dias entre eles com uma tabela do TabNet filtrada pela Modalidade terapêutica (quimioterapia, radioterapia e ambos), baixada no `download` como as atuais; se falhar, nada do Painel é publicado
- [x] A série anual de quimio/radio (casos e % em até 60 dias) por município fica disponível no dado limpo para o gráfico do cartão (ticket 10), que mostra a série da Tendência e não a de todos os casos
- [x] O `period` da camada e do `manifest.json` diz em que universo a Tendência foi calculada (por exemplo `"trend_cases": "chemo_radio"`), e o texto de `source.period` deixa isso claro em português
- [x] A legenda e o tooltip do mapa dizem que a Tendência do 60 dias é medida nos casos tratados com quimioterapia ou radioterapia; o tooltip continua mostrando o valor e a % sem informação de todos os casos do último ano
- [x] O pipeline roda de novo e regenera `site/public/dados/map/within_60_days/all.json` e `manifest.json`; a distribuição nova das classes fica registrada nos comentários (a pesquisa prevê, sem cascata, cerca de 448 piorando, 151 melhorando, 2 estável, 4.955 sem direção clara e 15 não calculáveis)
- [x] O texto da nota de método fica registrado neste ticket para a metodologia (ticket 24): a quebra de maio de 2018 (Portaria SAS nº 643/2018), o recorte de quimio e radio e o porquê, o efeito medido (Brasil −3,7% → −1,3% ao ano) e a queda das cirurgias em 2024 ([ticket de decisão 28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md))

Fora deste ticket: o mínimo da cascata contado nos casos de quimio/radio já está no ticket 05; a nota de 2024 no cartão, no ticket 10; a Situação, no ticket 08.

## Comments

Resolvido em `1f3108e` (contagem de quimio/radio na limpeza, Tendência sobre esses casos, segunda validação contra o TabNet, `trend_cases` no período e textos da legenda, do tooltip e da tabela) e no commit seguinte, que regenera a camada e o `manifest.json` e fecha este ticket.

Decisões tomadas na implementação:
- **Filtro do TabNet:** `XModalidade Terapêutica` com `QUIMIOTERAPIA|2|1`, `RADIOTERAPIA|3|1` e `AMBOS|4|1`, e o resto da consulta igual à atual. As tabelas ficam em `data/raw/painel/tabnet/chemo_radio/{ano}.html`. Se uma das duas comparações falha, nada do Painel é publicado.
- **Dado limpo:** o Parquet ganha as colunas `chemo_radio` e `chemo_radio_within_60_days` por ano × município × tipo. O gráfico do cartão (ticket 10) calcula a % dessas duas contagens, como a camada já faz com as demais.
- **Textos novos (a aprovar, como os do ticket 04):**
  - legenda: "Tendência medida nos casos tratados com quimioterapia ou radioterapia.";
  - tooltip: a mesma frase numa linha própria, e o valor do último ano termina com "(todos os casos diagnosticados)";
  - a legenda da tabela acessível diz o mesmo;
  - `source.period`: "Anos de diagnóstico 2014–2026 (2025, 2026 provisórios). Tendência 2015–2024 medida nos casos tratados com quimioterapia ou radioterapia; valor de 2024 e % sem informação sobre todos os casos diagnosticados".
  - A nota longa sobre a quebra de 2018 fica para o cartão (ticket 10), como manda a seção 11.2.

**Validação (extração de 17/10/2026):**
- Os casos de quimio/radio e os em até 60 dias entre eles batem **exatamente** com o TabNet nas 351 combinações UF × ano (27 UFs, 2014–2026).
- A comparação de todos os casos continua exata.
- `value` e `without_treatment_info` não mudaram em nenhum dos 5.571 municípios.

**Distribuição das classes** ("60 dias × Todos", sem cascata), igual à prevista pela pesquisa:

| Classe | Antes (todos os casos) | Agora (quimio/radio) |
|---|---:|---:|
| Piorando | 906 | 448 |
| Melhorando | 108 | 151 |
| Estável | 0 | 2 |
| Sem direção clara | 4.554 | 4.955 |
| Não calculável | 3 | 15 |

- Dos 906 "piorando", 562 passaram a "sem direção clara".
- Brasil: −1,3% ao ano [IC 95% −2,2; −0,4], piorando. Antes era −3,7%.
- Os 12 municípios novos sem Tendência calculável não têm casos de quimio/radio na janela. Eles aparecem como dado insuficiente até a cascata (ticket 05) e mantêm o valor e a % sem informação.

**Texto da nota de método para a metodologia (ticket 24):**

> **Quebra de série do Painel-Oncologia e a Tendência do 60 dias.** Em maio de 2018, a Portaria SAS nº 643, de 17/05/2018, tornou obrigatórios o Cartão Nacional de Saúde e a CID-10 no exame anatomopatológico (biópsia ou peça cirúrgica). A partir daí, esse exame passou a criar casos no Painel. Antes, um caso só entrava se já houvesse diagnóstico registrado numa internação (AIH) ou num procedimento de alta complexidade (APAC), ou seja, quase só casos já tratados (mama e colo também vinham do SISCAN desde 2013). Com a mudança, entraram dois tipos de caso novos: os ainda sem tratamento registrado (a % sem informação foi de cerca de 4% para cerca de 30%, com um segundo degrau em maio de 2019) e os operados, cujo diagnóstico da peça sai depois da cirurgia e conta como "no prazo". A série de todos os casos deixou de ser comparável antes e depois de 2018.
>
> Por isso, a Tendência do 60 dias é medida **só nos casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos**. O registro desses casos (APAC) não mudou de 2014 a 2024: a % em até 60 dias deles foi de 44,3% em 2014, 42,6% em 2018 e 41,0% em 2024, sem degrau. Medida em todos os casos, a Tendência nacional seria de −3,7% ao ano. Medida em quimio e radio, é de −1,3% ao ano (IC 95% de −2,2% a −0,4%). A piora é real, mas entre metade e dois terços da queda aparente vinha da mudança de registro. O valor do último ano, a % sem informação e a Situação continuam calculados sobre todos os casos diagnosticados, como no TabNet do Ministério da Saúde e na Lei nº 12.732/2012.
>
> O recorte deixa de fora da Tendência a cirurgia como primeiro tratamento e os casos sem tratamento registrado. Outra mudança, ainda sem explicação oficial, afeta 2024: a partir de abril de 2024, os casos com primeiro tratamento por cirurgia caem de cerca de 6 mil para cerca de 2 mil por mês. Por isso, a % em até 60 dias de todos os casos em 2024 (33,5%, contra 37,1% em 2023) pode estar abaixo do real. A Tendência, medida em quimio e radio, não é afetada. A investigação está no [ticket de decisão 28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md).
