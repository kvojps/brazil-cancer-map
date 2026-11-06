# Guia do pesquisador

## Quero só os dados

Baixe os assets da [Versão de dados `data-2026-11-05`](https://github.com/kvojps/brazil-cancer-map/releases/tag/data-2026-11-05). Não é preciso Python: os CSV abrem em ferramentas de análise e planilhas que suportem o tamanho das células; Parquet serve para ferramentas que leem esse formato. A [lista de Releases](https://github.com/kvojps/brazil-cancer-map/releases) permite escolher outra versão. Guarde o nome da versão junto da análise.

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

Os JSON prontos também estão em [`site/public/dados/`](../site/public/dados/): `map/<indicador>/<tipo>.json` traz o mapa; `profiles/<UF>.json`, as séries e o contexto municipal; `municipalities.json` e `municipalities.topojson`, o índice e a malha. Para conceitos, consulte o [Glossário](../GLOSSARY.md); para fórmulas, Referências e ressalvas, [Como calculamos (`/metodologia/`)](https://brazil-cancer-map.josebazjunior09.workers.dev/metodologia/).

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
gh release download data-2026-11-05 --repo kvojps/brazil-cancer-map --dir "$WORK/assets"
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

Resultado comprovado em 06/11/2026: `48 files, 0 differ` nos dois formatos e nenhuma diferença entre as duas reconstruções. Essa comparação preserva tipos numéricos e inclui `pipeline_version`. Contra os JSON commitados, 21 arquivos são idênticos em bytes e os 27 perfis diferem só na ordem das chaves de `indicators`. A igualdade garantida aqui é de conteúdo JSON; não de bytes. O manifesto é idêntico em bytes.

Compare com um checkout que contenha a mesma Versão de dados: uma atualização posterior de `site/public/dados/` muda a referência. A prova original usou o commit `9cf8226`.

## Nível 2 — Recalcular

**Disponível a partir da próxima Release**, sujeito às limitações por `source` abaixo. A Release `data-2026-11-05` tem 18 assets CSV/Parquet e nenhum `state-*.tar.gz`: não permite restaurar o estado nem retomar o processamento. Seu manifesto registra `pipeline_version: 0.1.0+df740cd-dirty`, que não identifica um checkout limpo reproduzível.

A prova de 06/11/2026 usou um clone temporário de `9cf8226`, estado exportado do `data/clean` local e a malha commitada. Não foi uma reprodução de estado obtido da Release. Nenhum valor de Indicador mudou. Comparando sem `pipeline_version`:

| `source` | Resultado com estado e JSON commitados |
|---|---|
| `mesh` | Não executável: `validate` e `export` exigem `data/raw/mesh/ibge_municipalities.json`; igual ao fornecer esse arquivo |
| `popsvs` | Igual; só valida, não publica no site |
| `painel` | `compute` roda; `validate` e `export` exigem as 26 páginas de `data/raw/painel/tabnet/` (13 anos × 2 tabelas); igual ao fornecê-las |
| `cnes` | Igual; exige mapshaper |
| `siscan` | Igual |
| `siscan_cytopathology` | Igual |
| `sim` | Igual; `compute` levou cerca de 80 s e 1,2 GB de RAM |
| `hpv` | Diferente só em metadados; valores, Situação e séries iguais |
| `inca` | Igual; usa o insumo versionado em `pipeline/references/` |
| `vigitel` | Igual |

No HPV, desaparece `audit_last_month: 9` dos mapas, perfis e manifesto; `sources.hpv.files` troca os 81 ZIP e `official.json` por `official.json` e `census.parquet`. Ao final, 18 arquivos ficaram idênticos em bytes e 30 diferiram por metadados do HPV e versão do pipeline. O HPV também depende do relógio: o código exige anos completos até o ano corrente; com o estado que vai até 2026, uma simulação de março de 2027 falhou. Isso não foi uma execução da CLI em 2027.

Para uma futura Release com estado, use um clone novo do código correspondente, Python 3.14+, `uv` e Node 24. Baixe todos os assets em uma pasta vazia. O fluxo abaixo foi executado com assets de estado produzidos localmente; ainda não foi comprovado com uma Release pública que os contenha. Na raiz desse clone:

```bash
uv sync --frozen
npm ci --prefix pipeline
# Set this to the directory containing the matching release assets.
ASSETS=/caminho/para/assets
uv run --frozen python -m pipeline restore-state --assets "$ASSETS" --output data/clean
# Supply the matching external mesh and TabNet files described in the table.
for source in mesh popsvs painel cnes siscan siscan_cytopathology sim hpv inca vigitel; do
  for step in compute validate export; do
    uv run --frozen python -m pipeline run --source "$source" --step "$step" || exit 1
  done
done
git diff --stat -- site/public/dados
git diff -- site/public/dados
```

Sem os arquivos externos, rode apenas as `source` executáveis da tabela. `pipeline_version` muda mesmo sem diferença nos números; examine o diff e compare o conteúdo desconsiderando apenas esse campo para avaliar recálculo. Diferenças de HPV continuam sendo diferenças reais de metadados. `update` sempre inclui `download`; para este nível use `run --step`, que lê os caminhos fixos `data/clean` e `site/public/dados`. Chromium só é exigido no download oficial do HPV, não nos níveis 1 e 2.

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

As evidências estão em [`docs/data/`](data/), com índice em [Fontes de dados](data-sources.md): [SIM/Atlas](data/sim-atlas-check.md), [C55](data/c55-validation.md), [HPV](data/hpv-official-inputs.md), [quebras de série do Painel](data/painel-series-breaks.md) e [qualidade por UF](data/quality-by-state.md). SISCAN não tem comparação externa com números oficiais: suas checagens são de cobertura e plausibilidade. Fórmulas e ressalvas ficam exclusivamente em [Como calculamos](https://brazil-cancer-map.josebazjunior09.workers.dev/metodologia/).

## Citar e reportar erros

Modelo para esta versão:

> Observatório do Câncer no Brasil. Dados abertos, Versão de dados `data-2026-11-05`. Disponível em: https://github.com/kvojps/brazil-cancer-map/releases/tag/data-2026-11-05. Acesso em: [data de acesso].

Troque a Versão de dados e o endereço pelos da Release utilizada. Cite também as Fontes originais: os [modelos por Fonte e condições de reutilização](https://brazil-cancer-map.josebazjunior09.workers.dev/metodologia/#reutilizacao-e-citacao) estão na metodologia. A licença do código não se aplica aos dados de terceiros.

Reporte erros pelos [GitHub Issues](https://github.com/kvojps/brazil-cancer-map/issues), informando Versão de dados, arquivo, município ou recorte, período, valor observado e referência esperada; se houve reprodução, inclua comando e mensagem de erro.
