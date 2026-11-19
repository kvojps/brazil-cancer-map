# Versão de dados rastreável: data-2026-11-06

> Leitura curta. A [versão completa](https://github.com/kvojps/brazil-cancer-map/blob/11fd03c47e1ce09b9a2ccb873ccc75da1ccb304f/docs/data/traceable-version.md), com a preparação local, as tentativas descartadas e os comandos usados na prova, está no commit `11fd03c`.

Sustenta a restauração e o recálculo da Versão de dados `data-2026-11-06` descritos no [guia do pesquisador](../reproducibility.md) e no [guia do mantenedor](../data-update.md).

**Data:** 06/11/2026. A [Release `data-2026-11-06`](https://github.com/kvojps/brazil-cancer-map/releases/tag/data-2026-11-06) foi publicada às 18:40:28 UTC e conferida a partir dos assets baixados.

## Resultado

**Os assets públicos restauram e recalculam o Contrato de dados: 48 arquivos, zero diferenças.**

- **Release:** 27 assets, 196.566.506 bytes: 18 tabelas CSV/Parquet e nove arquivos `state-*.tar.gz`, todos abaixo de 2 GiB. O manifesto registra `pipeline_version: 0.1.0+a98b5fd`, do commit gerador público `a98b5fd8d4d43602d26ac020426928b7531b4952`. A tag foi criada sobre `main`; para recalcular, use o commit do manifesto.
- **Restauração:** `restore-release` em CSV e em Parquet reconstruiu os 48 arquivos, com zero diferenças contra a proposta preparada e entre os formatos, inclusive tipos numéricos e `pipeline_version`.
- **Recálculo:** com o estado restaurado e os insumos externos de `mesh` e `painel`, as dez `source`s repetiram `compute`, `validate` e `export` com **zero diferenças** contra o contrato da Release. Sem esses insumos, `mesh validate` e `painel validate` falham, como esperado.
- **Diferença para o contrato anterior:** 60 diferenças em 30 arquivos, todas de metadados: remoção de `audit_last_month` antigo do HPV, lista de arquivos do HPV e `pipeline_version`. Nenhum valor, Situação ou série mudou.
- **Conteúdo do estado:** HPV traz só `official.json` e `census.parquet`. Vigitel traz `interviews.parquet`, com registros individuais sem identificadores diretos, publicados pelo responsável. Extratos de pacientes e a auditoria HPV ficam fora. `inca` não tem estado próprio.
- **Tarballs:** os nove mudaram em bytes ao serem reempacotados, mas a lista e o SHA-256 de cada membro são iguais aos da preparação. As 18 tabelas são idênticas em bytes.
- **`data-2026-11-05`** foi gerada com `0.1.0+df740cd-dirty`, sem assets de estado, e não é reaproveitada.

**Limites do recálculo:**

- o HPV exige anos até o ano corrente: o estado de 2026 não basta em 2027;
- `mesh` e `painel` exigem `data/raw/mesh/ibge_municipalities.json` e as páginas em `data/raw/painel/tabnet/`, que não estão nos assets de estado.

## Registros preservados

- [`data-2026-11-06-sha256.txt`](data-2026-11-06-sha256.txt): checksums dos bytes baixados da Release.
- [`traceable-version-sha256.txt`](traceable-version-sha256.txt): checksums dos assets na preparação local.
- [`data-2026-11-06-verification.json`](data-2026-11-06-verification.json): membros dos arquivos de estado, falhas esperadas sem insumos externos e resultados.

## Método

Em clone limpo do commit gerador, Python 3.14.4, sem download das Fontes: `gh release download`, `restore-release` nos dois formatos, `restore-state` em `data/clean` e as etapas `compute`, `validate` e `export` na ordem do registro. Comparação canônica dos JSON, sem exigir igualdade de bytes. Na incorporação ao site, `uv run mypy` (48 arquivos), `uv run pytest` (173 testes), `npm run check` e `npm test` do site passaram. O passo a passo para repetir está no [guia do pesquisador](../reproducibility.md).
