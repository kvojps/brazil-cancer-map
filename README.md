# Observatório do Câncer no Brasil

Dados sobre o câncer no seu município, para entender e agir.

Um mapa estático dos 5.571 municípios brasileiros (malha IBGE 2025) que reúne prevenção, detecção precoce, acesso ao tratamento e panorama do câncer, e liga cada dado a uma ação concreta.

**Site:** <https://brazil-cancer-map.josebazjunior09.workers.dev>

## Publicação

O site é publicado pelo Cloudflare Workers (assets estáticos, plano gratuito), ligado a este repositório. Cada push na `main` roda, a partir de `site/`, o build `npm run build` e o deploy `npx wrangler deploy --assets ./dist --name brazil-cancer-map --compatibility-date 2026-11-01`, com `NODE_VERSION=24.20.0`. Pushes em outras branches geram versões de preview com `npx wrangler versions upload` e as mesmas flags. Os dados vêm dos JSON já commitados em `site/public/dados/`: o deploy não roda o pipeline.

## Estrutura

- `pipeline/`: baixa, limpa, calcula, valida e exporta os dados (Python).
- `site/`: o site estático (Astro), que só exibe os dados já calculados.

## Como rodar

Pipeline (requer [uv](https://docs.astral.sh/uv/) e Node.js, que roda o mapshaper na simplificação da malha):

```sh
uv sync
npm ci --prefix pipeline
uv run python -m pipeline run --list                 # mostra etapas e fontes
uv run python -m pipeline run                        # roda tudo
uv run python -m pipeline run --source <fonte> --step <etapa>
uv run pytest
```

Onde se tratar usa `uv run python -m pipeline run --source cnes`, depois da malha publicada. O CNES seleciona o último mês comum às 27 UFs, baixa os DBC HB/ST e o `TAB_CNES.zip` auxiliar para obter os nomes dos hospitais. Na carga inicial de setembro de 2026, o auxiliar acrescentou cerca de 123 MB aos DBC; o cache evita baixá-lo novamente enquanto tamanho e data forem iguais. A proximidade é aproximada entre centroides municipais, sem rotas, e as contagens de habilitações por UF bloqueiam uma publicação fora das faixas documentadas na metodologia. Uma falha mantém a publicação anterior.

Site (requer Node.js 22.23.4 ou mais recente):

```sh
cd site
npm ci
npm run dev
npm run build
```

## Licenças

- **Código:** [`AGPL-3.0-or-later`](LICENSE).
- **Textos do projeto** (ações, metodologia, notas, ressalvas e glossário): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br), com atribuição ao Observatório do Câncer no Brasil.
- **Dados:** os dados de terceiros (DATASUS, IBGE, INCA e demais fontes) seguem as condições de reutilização de cada fonte, e os arquivos gerados pelo pipeline não são cobertos pela licença do código. A metodologia e cada arquivo exportado identificam a fonte, o período e as condições de reutilização. Quem citar o observatório deve citar também as fontes originais.

Contribuições entram sob a licença da parte alterada, sem CLA.

## Denominadores populacionais

Rode `uv run python -m pipeline run --source popsvs` para baixar os ZIP anuais
`POPSBR00.zip` a `POPSBR25.zip` do DATASUS com cache por tamanho e data e gerar
`data/clean/popsvs/population.parquet`. A fonte fornece município de seis dígitos,
ano, sexo (1 masculino, 2 feminino), idade (0–79 e 80 para 80+) e população.
As etapas de cálculo consultam `pipeline.population.Population.get` ou sua
variante em lote `get_many`: os limites
de idade são inclusivos e o retorno informa o ano usado e se é provisório.
Só a ausência do arquivo anual permite usar o ano imediatamente anterior;
município ausente gera erro, sem reconstruir sua história ou alterar o de origem.
Na consulta em lote, anos anteriores ao primeiro registro municipal são omitidos;
ausências posteriores e recortes incompletos geram erro, sem fallback indevido.

A validação exige 162 células distintas por município e ano, as 27 UFs e total
nacional entre 160 e 230 milhões em cada ano disponível. Para cada UF, aceita
45% a 155% do total aproximado de 2022 registrado em `STATE_BASELINES`, uma
faixa ampla para 2000–2025 que detecta cargas incompletas e duplicações, sem
pretender reproduzir taxas oficiais. A série MS/SVSA foi revista pós-Censo 2022:
publicações anteriores a 2025 usavam estimativas que superestimavam a população
em cerca de 5,8% e não devem ser usadas como alvo de igualdade. A conferência
de taxas deve usar o TabNet atual. Veja a [pesquisa e fontes da decisão](.scratch/mapa-cancer-br/research/13-denominador-populacional.md).
Os dados são públicos (Decreto 8.777/2016), sem licença explícita no FTP;
cite Ministério da Saúde/SVSA/CGIAE, ano e extração. POPSVS não substitui o
Censo 2022 fixo no indicador de HPV. A população sozinha não gera indicador
nem arquivo para o site.

## Mamografia (SISCAN)

Com a malha publicada e o POPSVS limpo, rode
`uv run python -m pipeline run --source siscan`. O download já reduz um CSV
anual por vez com DuckDB e apaga o bruto, mantendo contagens e metadados em
`data/clean/siscan/exams/`. A etapa `clean` também aceita CSVs previamente
baixados em `data/raw/siscan/`. Tamanho e data remotos iguais aos do agregado
permitem reaproveitá-lo sem guardar o CSV. São exigidos os dez anos 2016–2025.

A razão é exames de rastreamento em mulheres de 50–69 anos divididos pela
metade da população feminina dessa idade. O mínimo da cascata conta exames.
Mama e Todos compartilham os dados; valores acima de 2 recebem nota, e valores
fora de 0–10 bloqueiam a publicação (limiares operacionais, não oficiais).
A validação também confere a presença dos municípios da malha e as séries.
Os detalhes de campos, fórmula, Tendência, limitações e da diferença para a
orientação atual de 50–74 estão em `/metodologia/#mamografia` no site.

## Vacina HPV (SI-PNI)

O download é particionado por ano:

```sh
uv run python -m pipeline run --source hpv --step download --year 2020
# Repita até o ano corrente; depois use o histórico completo:
uv run python -m pipeline run --source hpv --step compute
uv run python -m pipeline run --source hpv --step validate
uv run python -m pipeline run --source hpv --step export
```

Cada mês é baixado, lido diretamente do ZIP e reduzido antes do próximo;
o ZIP é apagado só depois da extração bem-sucedida. Não se grava o CSV inteiro
descompactado. A redução guarda a primeira dose elegível de cada pessoa no mês;
a auditoria local deduplica também entre meses e anos e acumula as diagonais de idade
conforme a NT 16/2025. HPV quadrivalente e nonavalente entram, com ao menos uma
dose. D1 de 2015–2019 do TabNet completa as coortes da série exibida desde 2020;
não é uma série antiga publicada. O Censo 2022 fixo (SIDRA 9514) fornece os
12 recortes de sexo e idade por município. O histórico consolidado e o Censo
são baixados automaticamente na primeira execução. POPSVS não é usado.

O ano corrente usa os meses CSV anunciados no catálogo oficial, registrados
em `data/clean/hpv/availability.json` com fonte e data da consulta. Execute
`download --year <ano corrente>` antes de calcular para atualizar esse limite.
Ausências no meio do período e erros de acesso a recursos anunciados interrompem
a execução; não viram cobertura zero. O período exportado registra `audit_last_month` para delimitar os microdados de auditoria;
a extração dos agregados oficiais pode ter atualização mais recente.

Os meses reduzidos e seus metadados ficam em `data/clean/hpv/months/<ano>/`;
a chave pseudonimizada do paciente é necessária para a deduplicação longitudinal.
O site recebe apenas cobertura e classes prontas. Meses ausentes impedem o
cálculo. A ausência de histórico não vira cobertura zero. O ano corrente é
provisório; a Situação usa o último ano completo. A cascata conta a população,
e o HPV tem apenas Situação, sem Tendência estatística.

O workflow `HPV annual partitions` processa um ano por job, com limite de seis
horas, e persiste estado reduzido em assets da Release `hpv-state` (menos de
2 GiB por arquivo). Não publica os JSON do site automaticamente. Pode ser
acionado manualmente por ano e é agendado mensalmente; tamanho e data remotos
permitem reaproveitar meses que não mudaram. A carga inicial pode ser feita
na máquina do mantenedor. A medição e os limites estão em
[docs/data/hpv-benchmark.md](docs/data/hpv-benchmark.md); a investigação dos
insumos está na [pesquisa do HPV](.scratch/mapa-cancer-br/research/18-hpv-official-inputs.md).

O indicador publicado usa os numeradores qualificados das **coortes oficiais
agregadas** do painel do Ministério. A reconstrução dos microdados fica em
`data/clean/hpv/audit.json`: não reproduz integralmente a qualificação interna
do PNI e não substitui o numerador oficial. O denominador dos agregados é
conferido contra o Censo local antes de calcular coberturas e cascatas.

A partição do ano corrente também baixa a tabela oficial completa, em
`data/clean/hpv/official.json`, usando Chromium pelo Playwright. Instale o
navegador com `uv run playwright install chromium` ou indique um executável
existente em `CHROMIUM_PATH` (nesta máquina, `/snap/bin/chromium`). Para atualizar
somente os agregados, preservando os extratos de auditoria já disponíveis:

```sh
uv run python -c 'from pipeline.sources.hpv import HpvSource; HpvSource().download_official()'
```

Antes de exportar HPV, registre referências de cobertura conferidas no painel
oficial em `pipeline/references/hpv.json`: `source_url`, `extracted_at`,
`tolerance_pp` (entre 0 e 1 ponto percentual) e `observations`, com município
(`municipality`, seis dígitos), ano consolidado (`year`), sexo (`sex`: `F`,
`M` ou `null` para o total) e cobertura percentual (`value`). A amostra deve
incluir total e ambos os sexos, em municípios com dado próprio. O arquivo não
é fornecido com valores inventados: sua ausência ou qualquer divergência além
da tolerância impede `validate` e `export`. As referências reais de Recife, Brasileia e Jundiaí/2025 estão versionadas;
a validação é executada novamente antes de cada exportação.
