# Atualizar e publicar os dados

Este guia é para quem mantém o Observatório. Execute os comandos na raiz do repositório. Consulte [Fontes de dados](data-sources.md) para insumos, endereços, referências oficiais e limiares de validação; os conceitos estão no [Glossário](../GLOSSARY.md) e o método em [Como calculamos](https://brazil-cancer-map.kvojps.workers.dev/metodologia/).

## Agenda de conferência

| `source` | Quando conferir | O que observar |
|---|---|---|
| `painel` | Mensal | Regravação dos anos e períodos provisórios |
| `cnes` | Mensal | Competência M costuma sair perto do dia 15 de M+1 |
| `hpv` | Mensal | Agregados oficiais; ano corrente provisório |
| `popsvs` | Anual, outubro/novembro | Nova população e revisões dos anos anteriores |
| `siscan` | Anual, janeiro de X+1 | Mamografia e eventuais regravações |
| `siscan_cytopathology` | Anual, junto do SISCAN | Só correções da série encerrada em 2025; nunca acrescentar anos |
| `sim` | Anual, dezembro de X+1 | Publicação final do ano X e revisões |
| `vigitel` | Anual | Microdados costumam atrasar cerca de 20 meses |
| `inca` | A cada edição | Transcrição e validação manuais; edição atual 2026–2028 |
| `mesh` | Quando houver município novo | Nova malha e compatibilidade territorial |

Conferir uma Fonte não implica publicar período novo. As janelas são explícitas no código. Receber POPSVS 2026, uma nova edição INCA ou um ano novo de mamografia exige alteração revisada do pipeline; a mamografia ainda compartilha a constante de anos com o citopatológico. Não amplie a série encerrada. O calendário é uma expectativa baseada nas listagens registradas em [Fontes de dados](data-sources.md), não uma garantia do provedor.

## Preparar a máquina

- Python 3.14+, `uv` e `uv sync`.
- Node 24 (mínimo declarado pelo site: `>=22.23.4`), `npm ci --prefix site` e, para a malha, `npm ci --prefix pipeline`.
- GitHub CLI, com `gh auth login` e permissão para criar Releases no repositório.
- Para HPV: `uv run playwright install chromium`, ou `CHROMIUM_PATH` apontando para um Chromium instalado.
- Para Vigitel: obter o arquivo com `./download-vigitel.sh`, ou definir `VIGITEL_INPUT_PATH`. Conferir a edição e as colunas descritas em [Fontes de dados](data-sources.md#vigitel).
- Contrato de dados completo em `site/public/dados/` e estado limpo correspondente em `data/clean/`. Para outra máquina, veja a seção de retomada abaixo. Reserve disco para os insumos e cópias do estado e do contrato: `update` faz cópias por grupo.

Antes de gerar uma versão publicável, termine e commite mudanças de código, referências e documentação. Confira `git status --porcelain`: a árvore deve estar limpa. O manifesto registra o commit gerador em `pipeline_version`; o sufixo `-dirty` detecta mudanças em `pipeline/`, `pyproject.toml` e `uv.lock`, mas não substitui a conferência da árvore inteira.

## Preparar uma atualização

Use um destino novo, fora dos diretórios de entrada. Os caminhos abaixo são exemplos locais; escolha um nome novo a cada tentativa.

```bash
uv run python -m pipeline update --source painel --source cnes --source hpv --data-dir site/public/dados --clean-dir data/clean --output /tmp/cancer-update
```

`update` executa download, limpeza, cálculo, validação e exportação. A etapa `download` é sempre chamada, com estes comportamentos (conferidos no código):

- `mesh`, `popsvs`, `painel`, `cnes`, `siscan`, `siscan_cytopathology`, `sim` e `hpv` baixam os insumos automaticamente, respeitando os períodos configurados e o cache. O HPV exige Chromium instalado e consulta novamente todos os anos desde 2020 até o ano corrente; o período do estado anterior não congela uma nova coleta.
- `vigitel` apenas verifica se o arquivo local existe. O pipeline não chama `download-vigitel.sh`: execute o script antes de `update --source vigitel`, ou indique um arquivo já baixado por `VIGITEL_INPUT_PATH`.
- `inca` valida o JSON de referência já versionado no repositório. Não há download; uma nova edição exige transcrição manual e alteração revisada do pipeline.

`update` não é o caminho para recalcular sem consultar a origem. A proposta fica em `/tmp/cancer-update/dados`, o estado em `/tmp/cancer-update/clean` e o relatório em `/tmp/cancer-update/update.json`. Os dados do site não são alterados.

Para outra `source`, substitua ou repita `--source`. Escolher `popsvs` inclui `siscan` (mamografia), `siscan_cytopathology` e `sim` no mesmo grupo: todos dependem daquela população. Escolher `mesh` inclui **todas** as `source` no mesmo grupo. As relações estão no registro `SOURCE_DEFINITIONS` em `pipeline/sources/__init__.py`: consumo de insumo (`inputs`), inclusão na atualização (`update_with`) e aceitação conjunta (`accept_with`) são declarações distintas. A política `includes_all` da malha inclui também futuras entradas. Atualizar somente `sim` usa a população já disponível no snapshot, sem executar POPSVS. Uma falha descarta as mudanças do grupo inteiro. Grupos independentes bem-sucedidos permanecem na proposta mesmo quando o comando retorna erro.

## Revisar antes de publicar

1. Leia `update.json`: confira `selected`, `successful`, `failures` e a data da tentativa. Não publique uma tentativa com falhas sem investigar e preparar uma nova proposta coerente.
2. Compare os contratos: `git diff --no-index --stat site/public/dados /tmp/cancer-update/dados` e depois `git diff --no-index site/public/dados /tmp/cancer-update/dados`. Código de saída 1 significa diferença; os JSON compactos podem produzir diffs extensos.
3. Confira `/tmp/cancer-update/dados/manifest.json`: commit em `pipeline_version` sem `-dirty`, extrações e proveniência em `sources`, períodos por Indicador e Tipo de câncer em `indicators`. `mesh` e `popsvs` não têm entrada própria no manifesto.
4. Confira os períodos nos mapas e perfis, datas, notas provisórias, alertas, valores ausentes e mudanças nas séries, Tendência, Situação, cascata e faixa A/B/C. Investigue saltos inesperados e compare com as referências e limiares de [Fontes de dados](data-sources.md). Não contorne uma validação para publicar.
5. Confira o estado e os assets a distribuir. Extratos de pacientes, `data/raw/` e a auditoria HPV nunca entram na Release. O empacotador restringe o estado HPV a `official.json` e `census.parquet`. Ele copia os diretórios das outras `source`: mantenha-os livres de arquivos estranhos. O estado Vigitel inclui entrevistas individuais sem identificadores diretos; o responsável deve conferir e autorizar esse conteúdo a cada publicação (foi incluído em `data-2026-11-06`).

## Exportar, publicar e incorporar

A Release `data-2026-11-06` foi publicada pelo responsável com `--state-dir` e seus 27 assets foram baixados e conferidos. O recálculo passou no commit gerador, com os limites da seção de retomada abaixo. Para uma nova versão, gere e publique a partir da mesma árvore limpa e da proposta revisada, sempre com `--state-dir`:

```bash
uv run python -m pipeline export-release --data-dir /tmp/cancer-update/dados --state-dir /tmp/cancer-update/clean --output /tmp/cancer-assets
```

Confira CSV, Parquet e `state-*.tar.gz` no destino. Use uma pasta nova para evitar assets antigos. A exportação tabular conserva o contrato, sem refazer estatística; os arquivos de estado permitem retomar o processamento dentro dos limites abaixo. Só depois da revisão, o responsável publica com uma Versão de dados inédita:

```bash
uv run python -m pipeline release data-AAAA-MM-DD --data-dir /tmp/cancer-update/dados --state-dir /tmp/cancer-update/clean --output /tmp/cancer-assets
uv run python -m pipeline restore-release --assets /tmp/cancer-assets --output site/public/dados
npm run check --prefix site
npm run build --prefix site
git diff --stat
git add site/public/dados
git commit -m "data: publish data-AAAA-MM-DD"
git push
```

Substitua `data-AAAA-MM-DD` pela versão real. Para publicar em outro repositório, acrescente `--repository owner/repo` ao comando `release`. Cada asset precisa ter menos de 2 GiB; se algum atingir esse limite, nada é enviado. `release` reexporta os arquivos e chama `gh release create`; é uma ação externa. `restore-release` usa Parquet por padrão e reconstrói os JSON sem recalcular. Confira o diff completo antes do commit. O commit gerador no manifesto é anterior ao commit dos JSON: guarde ambos para rastreabilidade. Push e deploy cabem ao responsável; a publicação da Release não atualiza o site por si só.

## Falhas e retomada em outra máquina

Se download, limpeza ou validação falhar, preserve o log e `update.json`, confira os pré-requisitos e a seção da `source` em [Fontes de dados](data-sources.md). Corrija a causa e rode `update` com um **novo** `--output`; ele rejeita destinos existentes. O cache de download pode ajudar, mas a proposta não é uma fila de etapas retomável. Não copie resultados de um grupo que falhou para a publicação.

Se a exportação falhar, corrija a causa e reexporte em destino novo. Se a publicação falhar, confira `gh release view data-AAAA-MM-DD` e os assets antes de tentar novamente: o comando não oferece rollback nem substituição de uma tag já publicada. Se `check` ou `build` falhar depois da Release, interrompa commit e push, investigue a causa e compare com a proposta preservada; não trate a publicação dos assets como aprovação do site.

Para levar uma proposta ainda não publicada a outra máquina, transfira `dados/`, `clean/`, `update.json` e o commit gerador, sem extratos de pacientes nem auditoria HPV. Para partir de uma Release que inclua estado, em um clone no commit gerador:

```bash
gh release download data-AAAA-MM-DD --repo kvojps/brazil-cancer-map --dir /tmp/cancer-downloaded
uv run python -m pipeline restore-release --assets /tmp/cancer-downloaded --output site/public/dados
uv run python -m pipeline restore-state --assets /tmp/cancer-downloaded --output data/clean
```

O destino de `restore-state` precisa ser novo. Para preparar uma atualização, volte a `update`; para recalcular sem baixar de novo, o caminho lido no código é `run --source NOME --step compute`, depois `validate` e `export`, usando o estado em `data/clean` e os caminhos padrão. Isso altera os JSON locais e exige nova revisão.

**Limites das versões existentes:** `data-2026-11-06` contém 18 tabelas CSV/Parquet e nove
arquivos de estado; seu manifesto registra `0.1.0+a98b5fd`, sem `-dirty`.
A prova pública confirmou 48 arquivos iguais após restauração e recálculo.
`mesh` ainda exige `data/raw/mesh/ibge_municipalities.json`, `painel` exige
`data/raw/painel/tabnet/`, e o código gerador dessa Release exige, no HPV, todos os anos até o ano
corrente; nele, o estado de 2026 não basta em 2027. Os arquivos externos
foram fornecidos localmente na prova, sem acrescentá-los à Release. Não se
promete retomada completa apenas por usar `--state-dir`.
A Release anterior, `data-2026-11-05`, não contém estado e seu manifesto
registra `0.1.0+df740cd-dirty`.

As decisões, os checksums e a conferência da publicação estão em
[Versão de dados rastreável](data/traceable-version.md). O estado Vigitel com
entrevistas sem identificadores diretos foi publicado pelo responsável.

No código atual, o recálculo HPV usa `years` e `extracted_at` de
`official.json`: preserva a história desde 2020, o ano provisório e o último
consolidado da extração. Não exige Chromium ou novos downloads para
`compute`, `validate` e `export`. A data deve ser válida e todos os recortes
obrigatórios devem estar presentes; falhas impedem o cálculo. O empacotamento
já preserva esse contexto no próprio agregado, junto de `census.parquet`,
sem incluir extratos de pacientes. Isso foi verificado com fixtures e datas
simuladas, sem nova carga real nem publicação; veja a
[evidência](data/hpv-temporal-recalculation.md). Não se promete que o código
de Releases antigas passe a funcionar retroativamente.

## Referência da malha no estado

No código atual, `mesh.clean` copia a lista municipal baixada do IBGE para
`clean/mesh/ibge_municipalities.json` no snapshot em preparação. A validação
lê essa cópia, e o empacotamento existente a preserva em `state-mesh.tar.gz`,
junto dos atributos e do TopoJSON. Não se empacota `data/raw/`, o ZIP original,
extratos de pacientes ou a auditoria HPV. Continua valendo o limite de menos
de 2 GiB por asset.

`update --source mesh` continua incluindo todas as `source`s no mesmo grupo:
uma falha descarta o grupo e preserva os dados e o estado anteriores.
Atualizações independentes copiam a referência existente junto do snapshot,
sem buscar outra no cache bruto durante a exportação dos assets.

Para novas publicações, use o snapshot revisado como `--state-dir`, com o
contrato de `dados/` da mesma proposta. O estado precisa ter sido preparado
por `mesh.clean` com o código corrigido; apenas reempacotar um estado antigo
não acrescenta a referência. Ausência ou incompatibilidade da referência
impede `validate` e `export`. A preparação exige mapshaper e Node, conforme
o guia de desenvolvimento; as três etapas de recálculo da malha restaurada
não executam mapshaper, não baixam Fontes e não exigem o diretório bruto.

Os comandos de restauração e recálculo estão no [guia do pesquisador](reproducibility.md#recálculo-da-malha-com-o-código-atual).
A [evidência com fixture](data/mesh-state-recalculation.md) registra comparação
independente, isolamento, falhas e limites. Releases antigas mantêm as
limitações já documentadas; não houve nova carga, publicação ou deploy.

## Auditoria HPV opcional

`update --source hpv` usa agregados oficiais, coordenados por
`pipeline/sources/hpv/source.py`. `hpv-audit` usa a entrada independente
`pipeline.sources.hpv.audit.HpvAudit`. A auditoria com microdados é separada e local, nunca requisito de publicação:

```bash
uv run python -m pipeline hpv-audit --step download --year 2020
uv run python -m pipeline hpv-audit --step clean --year 2020
uv run python -m pipeline hpv-audit --step compute
```

Download e limpeza podem ser feitos por ano. `compute` exige o histórico completo e não aceita `--year`; os dois primeiros comandos sozinhos não o preparam. Consulte [os insumos e a auditoria HPV](data/hpv-official-inputs.md). Nunca envie os microdados ou resultados dessa auditoria como assets da Release.

## Histórico de validação

Em 06/11/2026 foram executados `update --source inca` e `export-release`, em pasta temporária, com o contrato atual como entrada e um caminho de estado inicialmente ausente. O INCA usa a referência versionada e não exige estado limpo nem download de rede. Essa execução verifica preparação e exportação tabular; não comprova estado completo, atualização das demais `source`, autenticação GitHub, publicação, restauração ou deploy. `site/public/dados/` permaneceu sem alterações. Os demais comandos, dependências e tratamentos de falha acima vieram da leitura de `pipeline/cli.py`, `pipeline/update.py`, `pipeline/release.py`, `pipeline/publish.py` e das `source`, apoiada nos registros de [Fontes de dados](data-sources.md).

Depois dessa preparação, a Release `data-2026-11-06` foi publicada pelo
responsável e os assets públicos foram restaurados e recalculados. A prova
completa e os limites estão em [Versão de dados rastreável](data/traceable-version.md).

## Referências do tratamento no estado

No código corrigido, `painel.clean` preserva em `clean/painel/tabnet/` apenas
as páginas oficiais necessárias aos anos observados: todos os casos e o
recorte de quimio e radio. Use `clean/` e `dados/` da mesma proposta revisada
em `export-release --state-dir`. O asset `state-painel.tar.gz` preserva essas
páginas, sem incluir o cache bruto, DBC ou extratos de pacientes. A exclusão
da auditoria HPV e o limite de menos de 2 GiB por asset continuam vigentes.

A preparação inicial exige os DBC e as páginas TabNet correspondentes.
Depois de restaurar estado e contrato no código gerador, `run --source painel
--step compute`, `validate` e `export` dispensam rede e arquivos brutos.
A validação continua comparando contagens e percentuais nas duas tabelas;
páginas ausentes, inválidas ou divergentes impedem a publicação.

A [prova com fixture](data/painel-state-recalculation.md) verifica o fluxo
público, isolamento de snapshots e preservação da versão anterior em falha.
Não basta reempacotar um estado antigo: as páginas não podem ser recuperadas
do contrato nem substituídas por consultas atuais. Os limites das Releases
existentes descritos acima continuam válidos; nenhuma foi alterada.
