# Preparação de uma Versão de dados rastreável

## Decisões de 06/11/2026

A próxima publicação mantém o pipeline vigente. O recálculo não encontrou
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
identificadores diretos (`year`, `city`, `smoker`, `weight`). A publicação
continua sendo uma ação do responsável, que deve conferir esse conteúdo.
Extratos de pacientes e auditoria HPV permanecem locais.

## Publicação pendente

A preparação local não substitui a prova com uma Release pública. Depois de
publicar uma Versão de dados inédita com `--state-dir`, o responsável deve
baixar seus assets em pasta vazia, restaurar contrato e estado num clone do
commit indicado por `pipeline_version` e repetir o nível 2, com os arquivos
externos acima. Só então o guia do pesquisador pode anunciar essa versão
como disponível e registrar a comparação contra ela.

O contrato do site só é incorporado depois da publicação, conforme o
[guia do mantenedor](../data-update.md). A Release `data-2026-11-05` permanece
a referência pública até essa etapa.

## Ambiente da preparação local

Foi usado um clone local sem hardlinks do commit
`a98b5fd8d4d43602d26ac020426928b7531b4952`, com Python 3.14.4 e as
dependências já instaladas na máquina. O estado veio de `data/clean` local,
copiado com `pipeline.update.copy_state`, que exclui a auditoria HPV, mais
os dois insumos externos descritos acima. Não houve download das Fontes.

O clone de trabalho está em `/tmp/cancer-traceable-11`. A proposta foi
preservada em `data/release-traceable-11/`: `dados/`, `clean/`, `assets/`,
`external-raw/` e `SHA256SUMS`. São arquivos locais fora do git, sem publicação
pública; o responsável deve preservá-los até concluir a publicação.

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
de separação perfeita; nenhuma falha. Não houve mudança no pipeline nem
nos JSON do site.

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

Isso comprova o recálculo dos assets locais em 06/11/2026, com esses insumos
externos. Não comprova o download de uma nova Release pública nem remove a
limitação temporal do HPV. A repetição pública permanece pendente.
