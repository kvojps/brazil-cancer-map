# Fontes de dados

Referência por `source` e por Fonte: insumos, pré-requisitos, calendário, endereços, volumes, validações e limiares operacionais. **Fonte** é o provedor oficial, e `source` é a unidade do pipeline (`GLOSSARY.md`). Fórmulas, classes, Referências e ressalvas ficam em [Como calculamos](https://brazil-cancer-map.kvojps.workers.dev/metodologia/). Os comandos de atualização ficam em `docs/data-update.md`.

**De onde vem cada informação:**

- **Validações e limiares:** lidos no código em 06/11/2026, em `pipeline/sources/` e `pipeline/download.py`. A lista de `source` foi conferida com `run --list`.
- **Calendário e volumes:** listagens feitas em 02/11/2026, salvo outra data indicada. São uma foto: só uma listagem não mostra se uma regravação é rotina.
- **Resultados:** da carga real indicada em cada seção. A carga completa não foi repetida para escrever este documento.
- **Endereços:** como usados no código ou anotados na data da listagem. A última conferência dos links da metodologia está em [`data/methodology-links.md`](data/methodology-links.md).

## Fonte e `source`

Uma Fonte pode alimentar mais de uma `source`, e nem toda `source` gera Indicador. A ordem é a do registro em `pipeline/sources/__init__.py`.

| `source` | Fonte | O que gera | Indicador ou uso |
|---|---|---|---|
| `mesh` | IBGE, Malha Municipal Digital 2025 | `municipalities.topojson`, `municipalities.json` | **Nenhum Indicador.** Geometria e Região imediata. Fora do `manifest.json` |
| `popsvs` | MS/SVSA/CGIAE, estimativas POPSVS | `data/clean/popsvs/population.parquet`, sem arquivo para o site | **Nenhum Indicador.** Denominador de `siscan`, `siscan_cytopathology` e `sim`. Fora do `manifest.json` |
| `painel` | Painel-Oncologia (DATASUS) | `map/within_60_days/`, fichas | Até 60 dias; % sem informação; faixa A/B/C |
| `cnes` | CNES (DATASUS) | Fichas, `where_to_treat` | Onde se tratar |
| `siscan` | SISCAN (DATASUS) | `map/mammography/`, fichas | Mamografia |
| `siscan_cytopathology` | SISCAN (DATASUS), **a mesma Fonte** | `map/cytopathology/`, fichas | Citopatológico, série encerrada em 2025 |
| `sim` | SIM (DATASUS) | `map/mortality/`, fichas | Tendência da mortalidade |
| `hpv` | Painel oficial de coortes HPV; IBGE, Censo 2022 (SIDRA 9514) | `map/hpv/`, fichas | Cobertura da vacina HPV |
| `inca` | INCA, Estimativa 2026–2028 | Fichas | Casos novos estimados |
| `vigitel` | Vigitel (MS/SVSA) | Fichas | Tabagismo na capital |

**Dependências:** as `source` de Indicador leem a malha publicada, e `siscan`, `siscan_cytopathology` e `sim` leem o POPSVS. `inca` é a exceção: valida e publica só o insumo versionado. Em `update`, escolher `mesh` recalcula todas as `source` selecionadas juntas, e escolher `popsvs` inclui `siscan`, `siscan_cytopathology` e `sim` no mesmo grupo. Uma falha descarta o grupo todo.

## Calendário

| Fonte | Conferir | Publicação | Ano X fecha | Carga do que o projeto usa | Atualização típica |
|---|---|---|---|---|---|
| Painel-Oncologia | Mensal | Mensal, regrava todos os anos | Sem data; os 2 últimos anos ficam provisórios | 0,20 GB | 0,20 GB |
| CNES | Mensal | Competência M por volta do dia 15 de M+1 | Não se aplica | ~24 MB + 123 MB do auxiliar | ~24 MB |
| Painel de coortes HPV | Mensal | Não documentado | Ano corrente provisório | Agregado pequeno | Agregado pequeno |
| POPSVS | Anual | Out/nov de X, depois do DOU de agosto | Revisões ocasionais | 0,09 GB | ~5 MB |
| SISCAN | Anual | Janeiro de X+1, regrava tudo | Janeiro de X+1, incerto se há correção depois | 24,4 GB de CSV | 24,4 GB, se a regravação se repetir |
| SIM | Anual | Final em dezembro de X+1 | Dezembro de X+1 | 1,40 GB (2014–2024) | ~130–150 MB |
| Vigitel | Anual | Microdado ~20 meses após a coleta | Idem | 83 MB | 83 MB |
| Estimativa INCA | A cada edição | Trienal; próxima por volta de 2029, por inferência | Não se aplica | Desprezível | Manual |
| Malha IBGE | Só com município novo | Fev–abr de X+1 | Não se aplica | 237 MB | Manual |

Conferir uma Fonte não significa publicar um período novo. As séries anuais têm períodos explícitos no código, e uma edição nova exige revisar esses períodos, as referências oficiais e as validações.

**Datas próximas:** SIM 2025 deve ficar final em dezembro de 2026, pelo padrão de 2023–2025. O POPSVS de 2026 não estava no FTP em 02/11/2026.

## Regras comuns

- **Falha de validação:** nada daquela `source` é publicado, e a última versão válida fica como está (spec, seção 16).
- **Cache:** o baixador compara tamanho e data remotos antes de baixar de novo, com novas tentativas contra falhas.
- **FTP do DATASUS:** é lento e instável, e a carga exigiu novas tentativas. Arquivos a partir de 64 MiB descem em trechos paralelos, retomados por trecho (padrão de 4). O SIM e o SISCAN usam 8, e o SISCAN usa tempo limite de 30 s. O cliente prefere EPSV e não envia REST no primeiro trecho, porque sessões PASV do DATASUS podem travar ao negociar REST.
- **DBC:** lidos com `datasus_dbc` + `dbfread`. Alguns arquivos têm a extensão em maiúscula.
- **Licença:** o Decreto 8.777/2016 prevê reuso livre de bases em formato aberto, mas os datasets têm `license_id` vazio e o FTP não traz licença explícita. Conteúdo de páginas gov.br sai sob CC BY-ND 3.0, por exemplo o texto da Estimativa e do Vigitel. Os modelos de citação estão em [`/metodologia/#reutilizacao-e-citacao`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#reutilizacao-e-citacao).
- **Pré-requisitos gerais:** Python 3.14+, `uv` e `uv sync`. Os pré-requisitos abaixo são os próprios de cada `source`.

## `mesh`

- **Insumos:** `BR_Municipios_2025.zip` (shapefile) e a lista oficial de municípios da API de localidades do IBGE.
- **Pré-requisitos:** Node.js e `npm ci --prefix pipeline`, para o mapshaper.
- **Calendário:** a malha é fixada em 2025 e atualizada à mão só quando surgir município novo. Datas das pastas: 2022 em 28/03/2023, 2024 em 29/04/2025, 2025 em 26/03/2026.
- **Endereços:** <https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/Brasil/BR_Municipios_2025.zip> e <https://servicodados.ibge.gov.br/api/v1/localidades/municipios>.
- **Volumes:** 237 MB de ZIP. Saída de 2.403.064 bytes de TopoJSON, ~0,71 MB gzip.
- **Validações, que bloqueiam:** mesmos municípios e mesmas Regiões imediatas da lista do IBGE, e não uma contagem fixa; sem geometria vazia nem código repetido; lista e geometria iguais; TopoJSON até 1.000.000 bytes gzip.
- **Limiares operacionais:** simplificação de 1,5% dos vértices, `weighted keep-shapes`, quantização 1e5. Saem as 2 "Áreas Operacionais" (Lagoa Mirim e Lagoa dos Patos), que não têm dado de saúde.
- **Resultado:** 5.571 municípios, com Boa Esperança do Norte (MT, 510183), instalado em 2025.
- **Referências:** [IBGE, malhas territoriais](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html).

## `popsvs`

- **Insumos:** `POPSBR00.zip` a `POPSBR25.zip`, um DBF em cada, em formato longo.
- **Colunas:** `COD_MUN` (7 dígitos, o pipeline corta para 6), `ANO`, `SEXO` (1 masculino, 2 feminino), `IDADE` (0–79 e 80 para 80+), `POP`. População em 1º de julho.
- **Pré-requisitos:** nenhum além dos gerais. A leitura usa `dbfread`, sem DBC.
- **Calendário:** anual. Os arquivos de 2000–2024 foram regravados juntos em 07/01/2025, na revisão pós-Censo, e o de 2025 saiu em 29/10/2025.
- **Endereços:** `ftp://ftp.datasus.gov.br/dissemin/publicos/IBGE/POPSVS/` e [TabNet](http://tabnet.datasus.gov.br/cgi/deftohtm.exe?ibge/cnv/popsvs2024br.def), que recusou HTTPS e respondeu por HTTP.
- **Volumes:** ~3,4 MB por ano, 4,75 MB em 2025, 0,09 GB na série. Cerca de 25–27 MB por DBF descompactado.
- **Armadilhas:** no arquivo de 2025 os nomes de coluna estão em minúsculas, e `idade` tem largura 5. O código só aceita arquivos até `POPSBR25` e anos até 2025, então o arquivo de 2026 exige mudar o código (lido em `pipeline/sources/popsvs.py`). Ao sair uma atualização, conferir se os anos anteriores foram regravados.
- **Validações, que bloqueiam:**
  - 162 células distintas por município × ano;
  - domínios válidos de código, ano, sexo, idade e população;
  - as 27 UFs em cada ano;
  - total nacional entre 160 e 230 milhões em cada ano;
  - cada UF entre 45% e 155% do total aproximado de 2022 (`STATE_BASELINES`).
- **Limiares operacionais:** as faixas acima são amplas para 2000–2025. Detectam cargas incompletas e duplicações, sem pretender reproduzir taxas oficiais.
- **Conferência manual** (arquivos lidos em 02/11/2026). Totais do Brasil: 2014 = 200.811.131; 2022 = 210.862.983; 2023 = 211.695.158; 2024 = 212.583.750; 2025 = 213.421.037. O de 2025 é igual à estimativa do IBGE no DOU. Recife (2611606):

  | Ano | Total | Mulheres 25–64 | Mulheres 50–69 | 9–14 anos |
  |---|---:|---:|---:|---:|
  | 2014 | 1.588.393 | 477.972 | 170.874 | 135.572 |
  | 2022 | 1.594.897 | 483.470 | 200.476 | 119.647 |
  | 2025 | 1.588.376 | 480.781 | 208.549 | 120.307 |

- **Por que não é o Censo:** a estimativa de 2022 (210,86 milhões) fica acima da contagem do Censo (203,08 milhões), porque se ajusta às projeções que corrigem a sub-enumeração. Os dois não são intercambiáveis ([ADR 5](adr/0005-population-denominators.md)).
- **Método:** [`/metodologia/#dados-e-fontes`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#dados-e-fontes).
- **Referências:** [Nota Técnica Ripsa 01/2025](http://tabnet.datasus.gov.br/cgi/IBGE/NT-Ripsa_01_2025_Estimativas_Populacionais.PDF) (DOI 10.5281/zenodo.17990183); Nota Técnica 41/2023-CGIAE/DAENT/SVSA/MS, sobre a superestimativa da série antiga; `IBGE/doc/NT-POPULACAO-RESIDENTE-2000-2024.pdf` no FTP.

## `painel`

- **Insumos:** `POBR<ano>.dbc`, um arquivo nacional por ano de diagnóstico, de 2014 em diante (2013 fica fora), e duas tabelas do TabNet por ano: todos os casos e filtrada por modalidade.
- **Filtro do TabNet:** `XModalidade Terapêutica` com `QUIMIOTERAPIA|2|1`, `RADIOTERAPIA|3|1` e `AMBOS|4|1`. As tabelas ficam em `data/raw/painel/tabnet/`.
- **Pré-requisitos:** nenhum além dos gerais. O TabNet precisa responder: uma carga já foi interrompida porque ele não respondia.
- **Calendário:** mensal. Os 14 arquivos tinham a mesma data, 17/10/2026, porque todos os anos são regravados juntos. Os 2 anos de diagnóstico mais recentes presentes nos dados são provisórios.
- **Endereços:** `ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Dados/`, dicionário e nota técnica em `Doc/` e em <http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf>, e TabNet em <http://tabnet.datasus.gov.br/cgi/dhdat.exe?PAINEL_ONCO/PAINEL_ONCOLOGIABR.def>.
- **Volumes:** 0,20 GB, de 6,9 a 24,0 MB por arquivo. A atualização é a carga inteira.
- **Validações, que bloqueiam:**
  - por UF e ano, contra as duas tabelas do TabNet: contagem de casos e % em até 60 dias; na de todos os casos, também a % sem informação;
  - camadas cobrem os municípios da malha;
  - porcentagens entre 0 e 100;
  - toda UF com faixa de qualidade.
- **Limiares operacionais:** 1% de diferença nos casos e 0,5 p.p. nas porcentagens por UF, porque o TabNet e o FTP se atualizam em dias diferentes.
- **Alerta, que não bloqueia:** contagem nacional por mês e modalidade de primeiro tratamento, abaixo de 75% da mediana dos 12 meses anteriores, com mês ausente valendo zero e sem vigiar os anos provisórios. Hoje dispara 16 alertas, listados em [`data/painel-series-breaks.md`](data/painel-series-breaks.md#3-resultado-depois-das-decisões).
- **Resultado:** extração de 17/10/2026, contagens **exatas** nas 351 combinações UF × ano (27 UFs, 2014–2026), nas duas tabelas.
- **Método e evidência:** [`/metodologia/#60-dias`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#60-dias), [`data/painel-series-breaks.md`](data/painel-series-breaks.md), [`data/quality-by-state.md`](data/quality-by-state.md).

## `cnes`

- **Insumos:** `HB<UF><aamm>.dbc` e `ST<UF><aamm>.dbc` das 27 UFs, na competência mais recente comum a todos, e `TAB_CNES.zip`, de onde vêm os nomes (`CADGERBR.dbf`), que os DBC não trazem.
- **Pré-requisitos:** malha publicada. Node.js e `npm ci --prefix pipeline`, porque o mapshaper calcula os centroides.
- **Calendário:** mensal. `HBSP2606` saiu em 15/07/2026, `2607` em 17/08, `2608` em 15/09 e `2609` em 15/10/2026.
- **Endereços:** `ftp://ftp.datasus.gov.br/dissemin/publicos/CNES/200508_/Dados/HB/`, `.../Dados/ST/` e `.../Auxiliar/TAB_CNES.zip`.
- **Volumes:** por competência, HB ~1,1 MB e ST ~23 MB. O auxiliar acrescentou cerca de 123 MB na carga inicial de setembro de 2026, e o cache evita baixá-lo de novo.
- **Armadilha:** alguns DBF saem da descompressão com NUL no lugar do terminador de cabeçalho, e o pipeline corrige isso antes de ler.
- **Validações, que bloqueiam:** competência comum às 27 UFs, sem misturar meses; nome presente para cada estabelecimento; ST coerente com HB em competência e município; município conhecido; listas sem repetição para todos os municípios; distância entre 0 e 20.040 km; contagem de pares estabelecimento × habilitação ativa dentro da faixa da UF.
- **Limiares operacionais:** faixas amplas por UF, que não são metas: AC 1–10; AL 2–25; AM 1–20; AP 1–10; BA 10–100; CE 5–70; DF 2–30; ES 4–50; GO 5–60; MA 2–35; MG 20–180; MS 3–35; MT 3–35; PA 3–40; PB 3–35; PE 5–70; PI 2–30; PR 15–130; RJ 15–130; RN 3–35; RO 1–20; RR 1–10; RS 15–140; SC 10–90; SE 2–25; SP 40–300; TO 1–20.
- **Resultado:** competência 202609, extração de 03/11/2026: 364 estabelecimentos, 480 habilitações ativas, listas para os 5.571 municípios.
- **Método:** códigos, proximidade e limites em [`/metodologia/#onde-se-tratar`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#onde-se-tratar).
- **Referências:** [INCA, Onde tratar pelo SUS](https://www.gov.br/inca/pt-br/assuntos/cancer/tratamento/onde-tratar-pelo-sus); Portaria SAES/MS 1.399/2019.

## `siscan` e `siscan_cytopathology`

As duas `source` leem a mesma Fonte e compartilham `pipeline/sources/siscan.py`, com caches separados em `data/clean/siscan/` e `data/clean/siscan_cytopathology/`.

| | `siscan` | `siscan_cytopathology` |
|---|---|---|
| Arquivos | `SISCAN_MAMOGRAFIA_<ano>.csv` | `SISCAN_CITO_COLO_<ano>.csv` |
| Ano do registro | `NU_ANO_COMPETENCIA` | `CO_ANO_LIBERACAO`, porque o arquivo não tem competência |
| Filtro próprio | `CO_IND_CLINICA=02` | Nenhum, sem filtro por motivo ou resultado |
| Volume, 2016–2025 | ~8,1 GB | 16,34 GB |

- **Colunas comuns:** `CO_IDADE_PACIENTE`, `SG_SEXO`, `CO_MUN_RESIDENCIA`, separador `;`. As variantes `_PACNT` não entram. O código `02` foi conferido em `INDICLINIC.CNV`, no `TAB_SISCAN.rar` oficial.
- **Pré-requisitos:** malha publicada e POPSVS limpo. Espaço para um CSV por vez: o maior arquivo é `SISCAN_CITO_COLO_2023.csv`, com 2,06 GB.
- **Calendário:** anual. Os 130 arquivos da pasta foram gravados entre 09/01 e 26/01/2026. Não se sabe se a regravação de todos os anos é rotina, nem se o ano X recebe correções depois de janeiro de X+1.
- **Endereços:** `ftp://ftp.datasus.gov.br/dissemin/publicos/SISCAN/SISCAN/` e `.../SISCAN/TAB_SISCAN.rar`.
- **Volumes:** pasta inteira de 53,4 GB; o que o projeto usa, 24,4 GB. O CSV é apagado depois de reduzido.
- **Janela fixa:** as duas usam a mesma constante `YEARS`, 2016–2025, que protege o congelamento do citopatológico. Publicar um ano novo de mamografia exige separar essa janela (lido no código). Os dez anos são exigidos.
- **Validações, que bloqueiam:** cobertura dos municípios da malha e razões entre 0 e 10, no mapa e nas séries. **Sem comparação com o TabNet nem com outro número oficial.**
- **Limiares operacionais:** razão acima de 2 recebe nota, sem cortar o valor; fora de 0–10 bloqueia. Não são metas oficiais.
- **Resultados:** a plausibilidade das razões depende destes números, sem conferência externa.

  | Ano | Mamografias | Citopatológicos |
  |---|---:|---:|
  | 2016 | 1.334.415 | 4.351.205 |
  | 2017 | 1.686.704 | 5.057.273 |
  | 2018 | 1.778.484 | 5.483.872 |
  | 2019 | 1.933.952 | 5.693.576 |
  | 2020 | 1.168.602 | 3.266.989 |
  | 2021 | 1.695.152 | 4.982.153 |
  | 2022 | 1.938.308 | 5.640.256 |
  | 2023 | 2.288.811 | 6.966.579 |
  | 2024 | 2.314.929 | 6.591.434 |
  | 2025 | 2.170.408 | 5.910.845 |

  Contagens no recorte, antes de excluir residências fora da malha.

  | Publicação | Mamografia (versão `0.1.0+cbff840`) | Citopatológico (versão `0.1.0+aac4065`) |
  |---|---|---|
  | Origem | 4.923 município, 643 região, 5 insuficientes | 5.417 município, 154 região |
  | Tendência | 938 melhorando, 535 piorando, 4.093 sem direção clara | 882 melhorando, 527 piorando, 4.162 sem direção clara |
  | Situação | 29 alcançou, 75 perto, 5.462 longe | 109 alcançou, 250 perto, 5.212 longe |
  | Razão máxima | 1,54 | 4,16 |

  Os 5 insuficientes da mamografia são a Região imediata de Amparo/SP: cerca de 17 mil mulheres de 50–69 anos e poucas dezenas de exames por ano. A conferência de Recife/2025 no citopatológico, por consulta separada, deu 47.146 exames e 480.781 mulheres, ou seja, 47.146 ÷ (480.781 ÷ 3) = 0,29418.
- **Método:** [`/metodologia/#mamografia`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#mamografia) e [`/metodologia/#citopatologico`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#citopatologico).
- **Referências:** [ficha de mama do INCA, 2014](https://ninho.inca.gov.br/jspui/handle/123456789/17330), [ficha de colo do INCA, 2014](https://ninho.inca.gov.br/jspui/handle/123456789/11663), [NT 626/2025](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2025/nota-tecnica-no-626-2025-cgcan-decan-saes-ms.pdf/view).

## `sim`

- **Insumos:** `DOBR2014.dbc` a `DOBR2024.dbc`, nacionais. Os preliminares (`SIM/PRELIM/DORES/`, por UF, 2025 e 2026) não entram.
- **Pré-requisitos:** malha publicada e POPSVS limpo.
- **Calendário:** ano X final em dezembro de X+1: 2022 em 21/12/2023, 2023 em 19/12/2024, 2024 em 23/12/2025. Anos antigos são regravados às vezes, como os `DOBR` de 1996–2018 em 24/01/2025 e o `DOBR2023` em 21/01/2025. A janela está fixa no código, em `YEARS`.
- **Endereços:** `ftp://ftp.datasus.gov.br/dissemin/publicos/SIM/CID10/DORES/` e [Atlas On-line do INCA](https://mortalidade.inca.gov.br/MortalidadeWeb/).
- **Volumes:** 1,40 GB em 2014–2024, ~130 MB por ano.
- **Validações, que bloqueiam:**
  - amostra de `pipeline/references/sim-atlas.json`: contagem exata e taxa com ±3% (relativo à taxa oficial);
  - série ajustada do C55: conservação de C53+C54+C55, outros tipos sem mudança, séries completas e taxas ausentes sempre sinalizadas;
  - todos os tipos, todos os municípios da malha, taxas finitas entre 0 e 10.000.
- **Limiares operacionais:** o teto de 10.000 é plausibilidade, e os ±3% acomodam o POPSVS revisto.
- **Método e evidência:** [`/metodologia/#mortalidade`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#mortalidade), [`data/sim-atlas-check.md`](data/sim-atlas-check.md), [`data/c55-validation.md`](data/c55-validation.md).

## `hpv`

**O indicador usa as coortes agregadas oficiais** ([ADR 4](adr/0004-hpv-from-official-aggregates.md)). Os microdados são só auditoria, opcional e separada, com `hpv-audit`.

- **Insumos do indicador:** tabela `KeWXGFP` do painel oficial (`official.json`) e Censo 2022 por município × sexo × idade (`census.parquet`, SIDRA 9514).
- **Pré-requisitos:** malha publicada e Chromium, com `uv run playwright install chromium` ou `CHROMIUM_PATH`. A extração usa a sessão pública do InfoMS, e guarda só agregados e filtros efetivos, sem cookies nem identificadores.
- **Calendário:** conferência mensal. O ano corrente é provisório. A série depende do esquema da tabela, e uma mudança de medida interrompe a extração.
- **Endereços:** <https://www.gov.br/saude/pt-br/vacinacao/paineis-de-vacinacao/hpv>, <https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_VACINACAO_HPV/index.html> e [SIDRA 9514](https://sidra.ibge.gov.br/tabela/9514).
- **Volumes:** 77.990 linhas de município × sexo × ano, de 2020 a 2026, consultadas em 05/11/2026. Censo: 66.840 células, 16.439.492 pessoas de 9–14 anos. Boa Esperança do Norte não existe no Censo, tem denominador oficial zero e usa a região, sem população inventada.
- **Validações, que bloqueiam:**
  - denominadores oficiais iguais ao Censo, por fatia;
  - cobertura dos municípios da malha, valores finitos e não negativos, Situação coerente com o valor;
  - referências em `pipeline/references/hpv.json` obrigatórias, com fonte, data e observações do total e dos dois sexos, em município com dado próprio e ano não provisório.
- **Limiares operacionais:** `tolerance_pp` é hoje **0,01 p.p.** O código aceita no máximo 1 p.p. Valores acima de 100% ficam sem corte, com nota.
- **Formato de `hpv.json`:** `source_url`, `extracted_at`, `tolerance_pp` e `observations`, cada uma com `municipality` (seis dígitos), `year`, `sex` (`F`, `M` ou `null` para o total) e `value`. O arquivo não é preenchido com valores inventados. Hoje traz nove referências reais de 2025, de Recife, Brasileia e Jundiaí.
- **Resíduo no contrato publicado:** o `manifest.json` ainda lista os 81 ZIPs da auditoria, e as camadas trazem `audit_last_month`. É metadado antigo, sem efeito em nenhum valor. A exportação atual grava só `official.json` e `census.parquet`.

**Auditoria (`hpv-audit`):**

- **Insumos:** um ZIP por mês com um CSV de microdados (`;`), de todas as vacinas, e a D1 consolidada do TabNet de 2015–2019. Códigos das vacinas e campos em [`data/hpv-official-inputs.md`](data/hpv-official-inputs.md).
- **Endereços:** `https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/PNI/csv/vacinacao_<mes>_<ano>_csv.zip`, com meses abreviados em português, e [catálogo de 2026](https://dadosabertos.saude.gov.br/dataset/doses-aplicadas-pelo-programa-de-nacional-de-imunizacoes-pni-2026).
- **Volumes:** por ano, 2020: 15,0 GB; 2021: 58,6 GB; 2022: 39,8 GB; 2023: 25,5 GB; 2024: 26,1 GB; 2025: 27,3 GB; 2026 até setembro: 23,1 GB. **Total de ~215 GB zipados**, cerca de 3,9 vezes isso descompactado, pela razão medida em setembro de 2026. Cada mês tem de 1,2 a 4,9 GB.
- **Calendário:** mensal, com atraso de ~1 mês. Os meses do ano corrente são regravados juntos (os 9 de 2026, em 01/11/2026), e os anos de 2020–2025 foram regravados em agosto de 2026. Não se sabe se isso é rotina.
- **Armadilhas:** HTTP 403 não significa mês ausente, por isso os meses vêm do catálogo. Mês anunciado que falha, ou mês ausente, interrompe a auditoria, sem virar zero. A API (`apidadosabertos.saude.gov.br`) só aceita `limit` e `offset`, sem filtro por vacina, e o endpoint CKAN do portal devolve 404. A leitura por `Range` não ajuda, porque o CSV é um só bloco comprimido.
- **O que fica local:** extratos com chaves de pacientes em `data/clean/hpv/months/` e `audit.json`. Nada disso entra no git nem nas Releases.
- **Não há medição do job anual.** Só há medições de etapas locais, em [`data/hpv-benchmark.md`](data/hpv-benchmark.md).
- **Método e evidência:** [`/metodologia/#hpv`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#hpv), [`data/hpv-official-inputs.md`](data/hpv-official-inputs.md).

## `inca`

- **Insumos:** `pipeline/references/inca-estimates-2026.json`, transcrito à mão das tabelas de Estado e Capital em 04/11/2026. Os 324 valores foram reconferidos. O download não acessa a rede.
- **Pré-requisitos:** nenhum além dos gerais.
- **Calendário:** a cada edição. Atual: 2026–2028, lançada em 04/02/2026. A página é reescrita a cada edição e não tem CSV oficial, por isso a extração não é automatizada. Uma edição nova exige mudar o código, que valida o nome da edição e o ano.
- **Endereços:** <https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/estado-capital/brasil> e [PDF no Ninho](https://ninho.inca.gov.br/jspui/handle/123456789/18038).
- **Validações, que bloqueiam:** as 27 UFs e capitais, com os seis recortes; inteiros não negativos, múltiplos de 10; recorte não maior que Todos; capital não maior que UF; Brasília igual ao Distrito Federal; proveniência presente. A conferência estrutural não elimina erro de transcrição.
- **Método:** [`/metodologia/#casos-estimados`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#casos-estimados).

## `vigitel`

- **Insumos:** base unificada `vigitel-2006-2024-peso-rake-csv.zip`, com dicionário XLSX e nota metodológica. Colunas exigidas: `ano`, `cidade`, `q6`, `fumante` e `pesorake2025`.
- **Pré-requisitos:** o arquivo local, baixado por `./download-vigitel.sh` (Bash, Python 3.11+, curl, flock, tee) ou indicado em `VIGITEL_INPUT_PATH`. O script grava URLs, data, tamanhos e SHA-256 em `data/raw/vigitel/download.json`, e não retoma por byte. `VIGITEL_PAGE_URL`, `VIGITEL_CSV_URL`, `VIGITEL_DICTIONARY_URL` e `VIGITEL_NOTE_URL` trocam os endereços. Quem as usa confere a compatibilidade da edição.
- **Calendário:** anual. A base de 2006–2024 saiu em 24/08/2026 e o relatório em 30/12/2025. O Vigitel 2025, com interior, ainda não saiu. Não há coleta em 2022.
- **Endereços:** <https://svs.aids.gov.br/daent/cgdnt/vigitel/>, de onde o script descobre o arquivo pelo padrão de nome, porque o nome muda a cada edição.
- **Volumes:** 83,1 MB (87.121.523 bytes). A base substitui a anterior a cada edição.
- **Validações, que bloqueiam:**
  - colunas presentes; ano, cidade, idade a partir de 18, `fumante` 0 ou 1 e peso positivo, sem descartar registros em silêncio;
  - as 27 capitais, com os mesmos anos; prevalência entre 0 e 100; amostra de pelo menos 2; intervalo coerente;
  - total ponderado das capitais contra a Figura 31 (p. 100) do relatório oficial: 2019 = 9,7; 2020 = 9,2; 2021 = 9,0; 2023 = 9,2; 2024 = 11,5 (`pipeline/references/vigitel.json`).
- **Limiares operacionais:** ±3% relativos no total das capitais, para acomodar o arredondamento e a revisão de pesos de Fortaleza e Florianópolis de agosto de 2026. **Essa comparação não valida cada capital.**
- **Resultado:** extração de 05/11/2026, 27 capitais, 18 anos observados entre 2006 e 2024.
- **Método:** [`/metodologia/#tabagismo`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#tabagismo).
- **Referências:** [relatório Vigitel Brasil 2006–2024](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/vigitel/vigitel-brasil-2006-2024.pdf), [orientações de análise](https://svs.aids.gov.br/daent/cgdnt/vigitel/orientacoes-vigitel-2006-2024.pdf).

## Referências oficiais, por Indicador

Por que cada Referência foi escolhida está na spec, seção 9. Os documentos:

| Indicador | Documento | O que diz |
|---|---|---|
| Até 60 dias | [Lei 12.732/2012](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12732.htm) | Primeiro tratamento em até 60 dias. A [Lei 13.896/2019](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13896.htm) (30 dias para exames) serve à Ação, porque o Painel não mede esse intervalo |
| Mamografia | [Ficha do INCA, 2014](https://ninho.inca.gov.br/jspui/handle/123456789/17330), indicador 1.2 | "Parâmetro: 1" |
| Citopatológico | [Ficha do INCA, 2014](https://ninho.inca.gov.br/jspui/handle/123456789/11663), indicador 1.2 | "Parâmetro para análise: 1" |
| HPV | [Plano de Dant 2021–2030](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/doencas-cronicas-nao-transmissiveis-dcnt/09-plano-de-dant-2022_2030.pdf), seção 6.2; [NT 41/2024](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2024/nota-tecnica-no-41-2024-cgici-dpni-svsa-ms/view) | 90% até 2030; dose única desde abril de 2024 |
| Tabagismo | Plano de Dant, seção 6.2 e Figura 61 | Reduzir 40% até 2030. **9,8% e 5,9% foram lidos nos rótulos do gráfico**, e o percentual está no texto |
| Mortalidade | Plano de Dant, seção 6.1 | Sem meta compatível: as metas são para 30–69 anos, padronizadas pela população de 2010. **18,3 e 6,7 por 100 mil foram lidos em gráfico** |

A portaria que regulamenta a Lei 14.758/2023 não foi lida, e não se sabe se ela cria metas numéricas nacionais.

## Evidências

| Arquivo | O que sustenta |
|---|---|
| [`data/quality-by-state.md`](data/quality-by-state.md) | Recorte de 5 tipos, "Todos" sem C76–C80, estadiamento e estômago fora |
| [`data/painel-series-breaks.md`](data/painel-series-breaks.md) | Recorte de quimio e radio no 60 dias |
| [`data/sim-atlas-check.md`](data/sim-atlas-check.md) | Segi/Doll com 80+ e tolerância de ±3% |
| [`data/c55-validation.md`](data/c55-validation.md) | Redistribuição do C55 no colo do útero |
| [`data/hpv-official-inputs.md`](data/hpv-official-inputs.md) | Agregados oficiais do HPV e como repetir a auditoria |
| [`data/hpv-benchmark.md`](data/hpv-benchmark.md) | Duração e disco de etapas da auditoria, como registro histórico |
| [`data/action-sources.md`](data/action-sources.md) | Fontes das Ações, para a revisão clínica |
| [`data/methodology-links.md`](data/methodology-links.md) | Conferência dos links da metodologia |
