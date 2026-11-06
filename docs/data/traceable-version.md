# Versão de dados rastreável: data-2026-11-06

## Decisões de 06/11/2026

A publicação `data-2026-11-06` manteve o pipeline vigente. O recálculo não encontrou
mudança nos valores dos Indicadores; a diferença conhecida do HPV é de
metadados antigos da auditoria, incompatíveis com o processamento atual.
Regenerar o contrato remove esses metadados, sem reaproveitar o manifesto
com `pipeline_version: 0.1.0+df740cd-dirty` da primeira Release.

Mantêm-se explícitos dois limites do nível 2: o HPV exige anos até o ano
corrente (o estado de 2026 não basta em 2027), e `mesh` e `painel` exigem,
respectivamente, `data/raw/mesh/ibge_municipalities.json` e as páginas em
`data/raw/painel/tabnet/`. Esses arquivos não foram acrescentados aos assets
de estado. Corrigir essas limitações exige uma mudança separada no pipeline.
Não se promete recálculo integral nem permanente apenas com `--state-dir`.

O estado Vigitel contém `interviews.parquet`, com registros individuais sem
identificadores diretos (`year`, `city`, `smoker`, `weight`). Esse estado foi publicado pelo responsável na Release `data-2026-11-06`.
Extratos de pacientes e auditoria HPV permanecem locais.

## Publicação

O responsável publicou a [Release `data-2026-11-06`](https://github.com/kvojps/brazil-cancer-map/releases/tag/data-2026-11-06)
em 06/11/2026 às 18:40:28 UTC, com 27 assets: 18 tabelas CSV/Parquet e nove
arquivos de estado. O manifesto identifica o commit gerador completo
`a98b5fd8d4d43602d26ac020426928b7531b4952`, disponível no GitHub, por
`pipeline_version: 0.1.0+a98b5fd`. A tag da Release foi criada sobre `main`;
para recalcular, use o commit do manifesto.

A conferência pública está registrada ao fim deste documento. O contrato foi
incorporado ao site depois da publicação, conforme o
[guia do mantenedor](../data-update.md). As seções seguintes preservam a
preparação local que antecedeu a publicação.

## Ambiente da preparação local

Foi usado um clone local sem hardlinks do commit
`a98b5fd8d4d43602d26ac020426928b7531b4952`, com Python 3.14.4 e as
dependências já instaladas na máquina. O estado veio de `data/clean` local,
copiado com `pipeline.update.copy_state`, que exclui a auditoria HPV, mais
os dois insumos externos descritos acima. Não houve download das Fontes.

O clone de trabalho está em `/tmp/cancer-traceable-11`. A proposta foi
preservada em `data/release-traceable-11/`: `dados/`, `clean/`, `assets/`,
`external-raw/` e `SHA256SUMS`. Essas cópias locais ficam fora do git; os assets públicos correspondentes
estão na Release identificada acima.

Antes da geração válida, `git status --porcelain` no clone não produziu
saída. Uma primeira tentativa foi descartada porque um link simbólico para
`pipeline/node_modules` apareceu como arquivo não rastreado e marcou a
versão como `-dirty`. Uma segunda parou no mapshaper porque a cópia das
dependências não preservou os links de `.bin`. Corrigidos os links e
restaurado o contrato original, a geração foi reiniciada da árvore limpa.

As etapas foram chamadas na ordem do registro, pela interface das `source`s,
sem `download` nem `clean`:

```python
from pipeline.sources import create_sources

for source in create_sources():
    for step in ('compute', 'validate', 'export'):
        getattr(source, step)()
```

No repositório principal, `uv run mypy` passou nos 48 arquivos,
`uv run pytest pipeline/tests/test_release.py` passou nos cinco testes e
`uv run pytest` passou nos 173 testes. A suíte emitiu 274 avisos estatísticos
de separação perfeita; nenhuma falha. Na preparação não houve mudança no pipeline nem nos JSON do site.

## Contrato e assets locais

O manifesto válido registra `pipeline_version: 0.1.0+a98b5fd`.
A comparação recursiva contra o contrato commitado preservou tipos numéricos
e encontrou somente 60 diferenças, em 30 arquivos:

- 58 remoções de `audit_last_month` dos mapas, perfis e manifesto;
- `sources.hpv.files`: substituição dos 81 ZIP e `official.json` por
  `official.json` e `census.parquet`;
- a identificação do código em `pipeline_version`.

Nenhum valor, Situação ou série mudou. O resultado detalhado ficou em
`/tmp/cancer-traceable-11-differences-final.json`.

No clone, o comando executado para preparar os assets foi:

```bash
python -m pipeline export-release --data-dir site/public/dados --state-dir data/clean --output assets
```

Foram gerados 27 assets: 18 tabelas CSV/Parquet e nove arquivos
`state-*.tar.gz`, totalizando cerca de 188 MiB, todos abaixo de 2 GiB.
A listagem dos membros dos nove arquivos foi conferida: HPV contém somente
`hpv/official.json` e `hpv/census.parquet`; Vigitel contém extração, validação,
cálculos e entrevistas. Os demais contêm estado agregado, sem extratos de
pacientes ou auditoria HPV. `inca` não tem estado próprio: usa a referência
versionada no código. Os insumos brutos externos de `mesh` e `painel` não
estão nesses assets.

Os checksums SHA-256 dos 27 assets foram preservados em
[`traceable-version-sha256.txt`](traceable-version-sha256.txt), para conferir
os arquivos preparados; empacotar novamente pode mudar os bytes dos tarballs.

A restauração local chamou `restore_state` para um destino novo e
`restore_release` separadamente com `format='csv'` e `format='parquet'`.
Ambos reconstruíram os mesmos 48 arquivos, com zero diferenças de conteúdo,
inclusive tipos numéricos e `pipeline_version`. Não se exige igualdade de
bytes, porque a ordem das chaves pode variar.

Os comandos equivalentes pela CLI, no clone preparado, são:

```bash
python -m pipeline restore-state --assets assets --output restored-state
python -m pipeline restore-release --assets assets --format csv --output restored-csv
python -m pipeline restore-release --assets assets --format parquet --output restored-parquet
```

Esses destinos já existem após a prova; use novos caminhos para repetir.
A listagem dos membros e o resultado das comparações estão também no log
local `/tmp/cancer-traceable-11-assets-check-final.log`.

Por fim, as dez `source`s repetiram `compute`, `validate` e `export` com
`create_sources(clean_dir=Path('restored-state'),
site_data_dir=Path('restored-parquet'))`, usando o estado recém-restaurado e
os insumos externos de `mesh`/`painel` no clone. A comparação canônica final
contra o contrato preparado resultou em **48 arquivos, zero diferenças**,
inclusive `pipeline_version: 0.1.0+a98b5fd`. Os alertas mensais do Painel não
bloquearam a validação. O log local é
`/tmp/cancer-traceable-11-restored-check.log`.

Essa prova local antecedeu a publicação. A conferência dos assets baixados
da Release está registrada a seguir; a limitação temporal do HPV permanece.

## Conferência da Release pública em 06/11/2026

Os assets foram baixados em uma pasta vazia, com GitHub CLI, depois da
publicação pelo responsável:

```bash
gh release view data-2026-11-06 --repo kvojps/brazil-cancer-map
gh release download data-2026-11-06 --repo kvojps/brazil-cancer-map --dir data/release-public-2026-11-06/assets
```

A Release contém os 27 nomes esperados, totalizando 196.566.506 bytes. As
18 tabelas são idênticas em bytes às da preparação. Os nove tarballs mudaram
em bytes após o reempacotamento, mas a lista de arquivos internos e o hash
SHA-256 do conteúdo de cada membro são iguais aos da preparação. HPV contém
somente `official.json` e `census.parquet`; não há extratos de pacientes nem
auditoria HPV. As entrevistas Vigitel sem identificadores diretos estão
incluídas, conforme a publicação feita pelo responsável.

Os [checksums públicos](data-2026-11-06-sha256.txt) identificam os bytes
baixados desta Release, distintos dos checksums da preparação local.
O [relatório da verificação](data-2026-11-06-verification.json) preserva a
lista dos membros, as falhas esperadas sem insumos externos e os resultados.

Num clone local separado, foi selecionado o commit gerador
`a98b5fd8d4d43602d26ac020426928b7531b4952`; a árvore estava limpa antes da
restauração, e o código do pipeline permaneceu sem alterações. A API do
GitHub confirmou que esse commit está disponível publicamente. Foram usados
Python 3.14.4 e as dependências já instaladas na máquina, com os links do
mapshaper preservados. Não houve download das Fontes.

A CLI restaurou os assets públicos, primeiro em CSV e depois em Parquet,
em dois destinos novos: **48 arquivos, zero diferenças** nos dois formatos
contra a proposta preparada e entre os formatos, incluindo tipos numéricos
e `pipeline_version: 0.1.0+a98b5fd`. A CLI restaurou o estado em `data/clean`
no clone, e o contrato público restaurado substituiu a referência antiga em
`site/public/dados/` antes do recálculo.

Sem insumos externos, `mesh validate` falhou por ausência do arquivo IBGE e
`painel validate` falhou por ausência das 26 tabelas TabNet, como esperado.
Depois de copiar os insumos correspondentes de `external-raw/` da proposta
local para `data/raw/` no clone, as dez `source`s concluíram `compute`,
`validate` e `export`, na ordem do registro. O resultado final foi
**48 arquivos, zero diferenças** contra o contrato da Release, inclusive
`pipeline_version`. Os alertas mensais do Painel não bloquearam a validação.
A prova não usa os JSON antigos do commit gerador como referência.

O guia do pesquisador traz a sequência para repetir o recálculo. Os limites
continuam sendo o relógio do HPV e os arquivos externos de `mesh`/`painel`;
a prova pública não torna esses insumos parte da Release nem garante
recálculo do estado HPV de 2026 em 2027.

Os arquivos baixados e o log completo foram preservados localmente em
`data/release-public-2026-11-06/`, fora do git. O contrato do site foi
incorporado com `restore-release` diretamente desses assets públicos.

Na incorporação, `uv run mypy` passou nos 48 arquivos e `uv run pytest`
passou nos 173 testes, com os mesmos 274 avisos estatísticos da preparação.
`npm run check --prefix site` verificou 71 arquivos sem diagnósticos.
`npm test --prefix site` passou nos 87 testes e executou o build estático
como parte da suíte. O sandbox bloqueou inicialmente o subprocesso npm
com `EPERM`; a repetição fora dele passou. Não houve alteração no código
do pipeline nem no código do site, e nenhum push ou deploy foi executado
pelo agente.
