# Guia do pesquisador

## Quero só os dados

Baixe os assets da [Versão de dados `data-2026-11-06`](https://github.com/kvojps/brazil-cancer-map/releases/tag/data-2026-11-06). Não é preciso Python: os CSV abrem em ferramentas de análise e planilhas que suportem o tamanho das células; Parquet serve para ferramentas que leem esse formato. A [lista de Releases](https://github.com/kvojps/brazil-cancer-map/releases) permite escolher outra versão. Guarde o nome da versão junto da análise.

Cada linha preserva uma parte do Contrato de dados; os arquivos não são uma tabela plana com uma linha por município. Cada nome abaixo tem as extensões `.csv` e `.parquet`, com o mesmo conteúdo:

| Arquivo (sem extensão) | Indicador ou conteúdo |
|---|---|
| `within_60_days` | Até 60 dias, incluindo qualidade da informação |
| `where_to_treat` | Onde se tratar |
| `mammography` | Mamografia |
| `cytopathology` | Citopatológico |
| `mortality` | Tendência de mortalidade e taxas |
| `hpv` | Cobertura da vacina HPV |
| `estimated_cases` | Casos novos estimados, por UF e capital |
| `smoking` | Tabagismo na capital |
| `contract` | Manifesto, índice municipal, malha e demais dados auxiliares |

Os JSON prontos também estão em [`site/public/dados/`](../site/public/dados/): `map/<indicador>/<tipo>.json` traz o mapa; `profiles/<UF>.json`, as séries e o contexto municipal; `municipalities.json` e `municipalities.topojson`, o índice e a malha. Para conceitos, consulte o [Glossário](../GLOSSARY.md); para fórmulas, Referências e ressalvas, [Como calculamos (`/metodologia/`)](https://brazil-cancer-map.kvojps.workers.dev/metodologia/).

## Formato e manifesto

| Coluna | Como ler |
|---|---|
| `file` | Caminho relativo do JSON de destino, por exemplo `profiles/PE.json` |
| `path` | Lista JSON de chaves ou índices dentro desse arquivo |
| `value` | Registro, lista ou escalar codificado em JSON, a inserir naquele caminho |
| `source` | Metadados da Fonte, codificados em JSON |
| `period` | Período do dado, codificado em JSON |
| `conditions` | Condições de reutilização |
| `citation` | Orientação de citação |

Os metadados aparecem na primeira linha de cada combinação de Fonte e período em cada tabela; nas seguintes, essas colunas ficam vazias para evitar duplicação. Vazio nessas colunas não significa ausência de Fonte. Leia `path` e `value` como JSON: códigos IBGE continuam texto, e números, booleanos, nulos e listas vazias mantêm seus tipos. CSV usa UTF-8 e cabeçalho; Parquet tem as mesmas sete colunas de texto, com compressão Zstandard. A exportação não recalcula estatísticas.

O `manifest.json`, reconstruído a partir de `contract`, permite conferir:

- `pipeline_version`: versão do código de processamento, distinta da Versão de dados da Release;
- `sources`: proveniência e data de extração por `source`; campos como arquivos e competência variam entre elas;
- `indicators`: períodos e metadados publicados por Indicador e Tipo de câncer. Leia o período de cada recorte, sem pressupor que todos usam o mesmo ano.

`mesh` e `popsvs` não constam em `sources`: são auxiliares, sem Indicador próprio. A relação entre Fonte e `source` está em [Fontes de dados](data-sources.md).

## Nível 1 — Verificar sem recalcular

Reconstrói os JSON usando só os assets da mesma Release, sem baixar Fontes. Pré-requisitos: Git, GitHub CLI (`gh`), Python 3.14+ e `uv`. Comece na raiz de um clone deste repositório. A sequência usa destinos novos em uma pasta temporária e mantém os JSON commitados como comparação:

```bash
uv sync --frozen
WORK=$(mktemp -d)
mkdir "$WORK/assets"
gh release download data-2026-11-06 --repo kvojps/brazil-cancer-map --dir "$WORK/assets"
cat > "$WORK/compare.py" <<'PY'
import json
import pathlib
import sys

committed, produced = map(pathlib.Path, sys.argv[1:3])

def names(root):
    return {p.relative_to(root) for p in root.rglob('*')
            if p.suffix in ('.json', '.topojson')}

def canonical(path):
    return json.dumps(json.loads(path.read_text()), sort_keys=True)

left, right = names(committed), names(produced)
different = sorted(str(n) for n in left ^ right) + sorted(
    str(n) for n in left & right
    if canonical(committed / n) != canonical(produced / n))
print(len(left), 'files,', len(different), 'differ')
print(*different, sep='\n')
sys.exit(bool(different))
PY
for format in parquet csv; do
  uv run --frozen python -m pipeline restore-release --assets "$WORK/assets" --format "$format" --output "$WORK/level1-$format"
  uv run --frozen python "$WORK/compare.py" site/public/dados "$WORK/level1-$format"
done
diff -r "$WORK/level1-parquet" "$WORK/level1-csv"
```

Resultado comprovado em 06/11/2026 com os 27 assets baixados da Release
`data-2026-11-06`: `48 files, 0 differ` nos dois formatos. A comparação
preserva tipos numéricos e inclui `pipeline_version: 0.1.0+a98b5fd`.
A igualdade garantida é de conteúdo JSON; não de bytes.

Compare com um checkout que contenha a mesma Versão de dados. O commit gerador
`a98b5fd8d4d43602d26ac020426928b7531b4952` antecede a incorporação dos JSON
da nova Release: seu contrato commitado ainda é o antigo. Para verificar
nesse commit, restaure também a referência da Release, como no nível 2.

## Nível 2 — Recalcular

**Conferido na Release pública `data-2026-11-06` em 06/11/2026**, com os limites
por `source` abaixo. Ela contém 18 tabelas CSV/Parquet e nove arquivos
`state-*.tar.gz`. O manifesto identifica o código exato:
`pipeline_version: 0.1.0+a98b5fd`, sem `-dirty`. Use o commit completo
`a98b5fd8d4d43602d26ac020426928b7531b4952`, disponível no repositório público;
não suponha que a tag da Release seja o commit gerador.

A prova usou um clone nesse commit, contrato e estado restaurados dos assets
baixados da Release. As dez `source`s concluíram `compute`, `validate` e
`export` ao fornecer separadamente os insumos externos de `mesh` e `painel`.
O contrato recalculado ficou igual aos 48 arquivos restaurados da Release,
inclusive tipos numéricos e `pipeline_version`. Nenhum valor de Indicador mudou.

| `source` | Resultado com o estado público e o contrato restaurado |
|---|---|
| `mesh` | `validate` não executável sem `data/raw/mesh/ibge_municipalities.json`; igual ao fornecer esse arquivo |
| `popsvs` | Igual; só valida, não publica no site |
| `painel` | `validate` não executável sem as 26 páginas de `data/raw/painel/tabnet/` (13 anos × 2 tabelas); igual ao fornecê-las |
| `cnes` | Igual; exige mapshaper |
| `siscan` | Igual |
| `siscan_cytopathology` | Igual |
| `sim` | Igual |
| `hpv` | Igual, inclusive metadados; sujeito ao limite temporal abaixo |
| `inca` | Igual; usa o insumo versionado em `pipeline/references/`, sem estado próprio |
| `vigitel` | Igual; o estado inclui entrevistas sem identificadores diretos |

No código gerador dessa Release, o HPV depende do relógio: exige todos os anos até o ano corrente.
O estado publicado vai até 2026 e não basta em 2027. A falha em março de 2027
foi observada com relógio simulado na prova anterior, não numa execução da CLI
em 2027. Esta Release não altera essa regra do pipeline.

Custo observado em 06/11/2026, numa prova com o estado local, antes da Release
pública: cerca de 2,5 minutos na soma das etapas e 1,1 GB por clone. O `compute`
do `sim` levou cerca de 80 s e usou 1,2 GB de RAM.

Para repetir, use Git, GitHub CLI (`gh`), Python 3.14+, `uv` e Node 24.
Comece na raiz de um clone separado, sem `data/clean`. O fluxo abaixo restaura
o contrato público antes de recalcular e guarda uma referência independente:

```bash
git switch --detach a98b5fd8d4d43602d26ac020426928b7531b4952
uv sync --frozen
npm ci --prefix pipeline
WORK=$(mktemp -d)
gh release download data-2026-11-06 --repo kvojps/brazil-cancer-map --dir "$WORK/assets"
uv run --frozen python -m pipeline restore-release --assets "$WORK/assets" --output "$WORK/reference"
uv run --frozen python -m pipeline restore-release --assets "$WORK/assets" --output site/public/dados
uv run --frozen python -m pipeline restore-state --assets "$WORK/assets" --output data/clean
for source in popsvs cnes siscan siscan_cytopathology sim hpv inca vigitel; do
  for step in compute validate export; do
    uv run --frozen python -m pipeline run --source "$source" --step "$step" || exit 1
  done
done
```

O laço omite `mesh` e `painel`, porque os assets não fornecem os insumos brutos
externos. Para incluí-las, forneça os arquivos correspondentes nos caminhos
da tabela antes de executar suas três etapas. Eles foram fornecidos localmente
na prova e não estão disponíveis só pelo download da Release.

Para comparar, salve o `compare.py` do nível 1 em `$WORK/compare.py` e execute:

```bash
uv run --frozen python "$WORK/compare.py" "$WORK/reference" site/public/dados
```

O resultado esperado neste commit e com esse estado em 2026 é
`48 files, 0 differ`, sem ignorar `pipeline_version`. Um `git diff` contra
os JSON antigos do commit gerador não serve de referência. `update` sempre
inclui `download`; para este nível use `run --step`. Chromium só é exigido
no download oficial do HPV, não nos níveis 1 e 2.

A Release anterior, `data-2026-11-05`, permite o nível 1, mas não contém estado
e registra `0.1.0+df740cd-dirty`. A nova versão remove os metadados antigos
da auditoria HPV (`audit_last_month` e a lista de ZIPs), sem mudar valores.
Comandos, checksums e evidência da prova pública estão em
[Versão de dados rastreável](data/traceable-version.md).

### Recálculo HPV com o código atual

O código atual usa a história contínua em `official.json.years` e o ano da
data `extracted_at` para manter os provisórios e o último consolidado da
extração. O estado HPV continua contendo somente `official.json` e
`census.parquet`. Não são necessários downloads nem Chromium nas etapas
`compute`, `validate` e `export`; índices municipais e referências oficiais
continuam necessários. Datas inválidas, lacunas e recortes obrigatórios
ausentes causam erro explícito.

A prova automatizada empacota e restaura estado em diretório temporário e
compara todos os JSON com uma referência de 2026, sob relógios de 2026,
2027 e 2030. Ela preserva tipos, período, valores e proveniência; somente
`pipeline_version` identifica o código executado na comparação. Veja os
[comandos e limites da evidência](data/hpv-temporal-recalculation.md).
Não é uma nova reprodução pública de `data-2026-11-06`, nem uma correção
retroativa de seu commit gerador. Os limites de `mesh` e `painel` permanecem.

## Nível 3 — Refazer da origem

Baixa os insumos disponíveis hoje, limpa, calcula, valida e exporta. As Fontes podem regravar séries: não há promessa de igualdade com uma Release antiga. A comparação é com referências oficiais e com as validações abaixo. A carga completa não foi repetida para este guia.

Prepare os insumos e dependências de cada `source` conforme [Fontes de dados](data-sources.md), incluindo Chromium para download do HPV, arquivo externo do Vigitel e edição transcrita do INCA. Em um clone separado preparado para processamento, o comando é:

```bash
uv run python -m pipeline run
```

Ele escreve nos caminhos locais padrão. Para atualização com snapshot isolado, revisão e publicação, siga o [guia do mantenedor](data-update.md); não confunda esse fluxo com recálculo sem download.

## Mapa das validações

Mapa lido no código e nos arquivos versionados em 06/11/2026. As tolerâncias abaixo identificam a precisão das conferências; a referência operacional completa continua em [Fontes de dados](data-sources.md), nas seções de cada `source`.

| Arquivo em `pipeline/references/` | O que confere e tolerância |
|---|---|
| `hpv.json` | Cobertura oficial de 2025 em Brasileia, Recife e Jundiaí, total e ambos os sexos; tolerância registrada de 0,01 ponto percentual (o código aceita configurar entre 0 e 1) |
| `sim-atlas.json` | C53 feminino em 2022, Brasil e MG, RJ, PA, SP: óbitos exatos e taxa com diferença relativa máxima de 3% contra o Atlas, antes da redistribuição do C55 |
| `sim-c55-validation.json` | Registro da validação de redistribuição do C55: conservação, células incalculáveis, concordância mapa/ficha e demais tipos inalterados. É evidência de uma execução, não referência externa consumida por `validate`; os testes de conservação no código usam `math.isclose` com `abs_tol=1e-9` e tolerância relativa padrão |
| `inca-estimates-2026.json` | É o próprio insumo transcrito da edição 2026–2028. Valida estrutura, 27 UFs, capitais, seis tipos, inteiros não negativos múltiplos de dez e coerência capital/UF e tipo/total; sem comparação externa independente nem tolerância numérica |
| `vigitel.json` | Prevalência ponderada de fumantes no conjunto das capitais e DF em 2019, 2020, 2021, 2023 e 2024; tolerância relativa de 3% para arredondamento e revisão de pesos |

As evidências estão em [`docs/data/`](data/), com índice em [Fontes de dados](data-sources.md): [SIM/Atlas](data/sim-atlas-check.md), [C55](data/c55-validation.md), [HPV](data/hpv-official-inputs.md), [quebras de série do Painel](data/painel-series-breaks.md) e [qualidade por UF](data/quality-by-state.md). SISCAN não tem comparação externa com números oficiais: suas checagens são de cobertura e plausibilidade. Fórmulas e ressalvas ficam exclusivamente em [Como calculamos](https://brazil-cancer-map.kvojps.workers.dev/metodologia/).

## Citar e reportar erros

Modelo para esta versão:

> Observatório do Câncer no Brasil. Dados abertos, Versão de dados `data-2026-11-06`. Disponível em: https://github.com/kvojps/brazil-cancer-map/releases/tag/data-2026-11-06. Acesso em: [data de acesso].

Troque a Versão de dados e o endereço pelos da Release utilizada. Cite também as Fontes originais: os [modelos por Fonte e condições de reutilização](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#reutilizacao-e-citacao) estão na metodologia. A licença do código não se aplica aos dados de terceiros.

Reporte erros pelos [GitHub Issues](https://github.com/kvojps/brazil-cancer-map/issues), informando Versão de dados, arquivo, município ou recorte, período, valor observado e referência esperada; se houve reprodução, inclua comando e mensagem de erro.
