# Observatório do Câncer no Brasil

Dados sobre o câncer no seu município, para entender e agir.

Um mapa estático dos 5.571 municípios brasileiros (malha IBGE 2025) que reúne prevenção, detecção precoce, acesso ao tratamento e panorama do câncer, e liga cada dado a uma ação concreta.

**Site:** <https://brazil-cancer-map.josebazjunior09.workers.dev>

## Desenvolvimento e publicação

Veja o [guia de desenvolvimento](docs/development.md) para rodar o site,
trabalhar no pipeline, executar testes, contribuir e publicar no Cloudflare Workers.

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

A atualização usa as **coortes oficiais agregadas** do painel do Ministério:
numeradores qualificados, denominadores, anos, filtros efetivos, fonte e data de
extração ficam em `official.json`. O cálculo confere os denominadores contra o
Censo 2022 fixo (SIDRA 9514), nunca contra o POPSVS. A Situação usa o último ano
completo; o ano corrente é provisório, a cascata conta a população e não há
Tendência estatística. O total e as Regiões imediatas somam os numeradores e
denominadores oficiais.

Instale Chromium com `uv run playwright install chromium` ou configure
`CHROMIUM_PATH` para um executável existente. `run --source hpv` agora baixa o
Censo e os agregados oficiais, calcula, valida e exporta **sem microdados**.
Para preparar uma atualização para revisão, prefira `update`, descrito abaixo.

A auditoria pesada é **opcional, local e separada**. Não é pré-requisito para
atualizar ou publicar o indicador. Para acioná-la explicitamente:

```sh
uv run python -m pipeline hpv-audit --step download --year 2020
# Repita para todos os anos até o corrente, antes da reconstrução completa:
uv run python -m pipeline hpv-audit --step compute
# Para reduzir ZIPs que já estão em data/raw/hpv:
uv run python -m pipeline hpv-audit --step clean --year 2020
```

Cada mês é baixado e reduzido antes do próximo; o ZIP é removido depois da
redução bem-sucedida. Os extratos com chaves de pacientes ficam em
`data/clean/hpv/months/`; a reconstrução longitudinal deduplicada e o histórico
D1 TabNet 2015–2019 geram `data/clean/hpv/audit.json`. Meses ausentes impedem a
auditoria, sem virar zero. O catálogo oficial delimita os meses do ano corrente
em `availability.json`. Esses arquivos e os brutos ficam locais, fora do git e
das Releases. A auditoria não reproduz integralmente a qualificação interna do
PNI e nunca substitui os numeradores oficiais. Não existe mais workflow de
microdados no Actions; as medições anteriores estão em
[docs/data/hpv-benchmark.md](docs/data/hpv-benchmark.md).

Antes de exportar HPV, registre referências de cobertura conferidas no painel
oficial em `pipeline/references/hpv.json`: `source_url`, `extracted_at`,
`tolerance_pp` (entre 0 e 1 ponto percentual) e `observations`, com município
(`municipality`, seis dígitos), ano consolidado (`year`), sexo (`sex`: `F`,
`M` ou `null` para o total) e cobertura percentual (`value`). A amostra deve
incluir total e ambos os sexos, em municípios com dado próprio. O arquivo não
é fornecido com valores inventados: sua ausência ou qualquer divergência além
da tolerância impede `validate` e `export`. As referências reais de Recife, Brasileia e Jundiaí/2025 estão versionadas;
a validação é executada novamente antes de cada exportação.

## Atualização manual dos dados

A atualização depende de uma execução manual do mantenedor. Não há agendamento
de dados no GitHub Actions. Entre execuções, o site mantém a última versão
publicada. Recomenda-se checagem **mensal** de Painel-Oncologia (`painel`), CNES
(`cnes`) e HPV (`hpv`); **anual**, conforme o calendário de cada fonte, de POPSVS,
SISCAN, SIM e Vigitel; INCA a cada edição. O citopatológico é uma série histórica
fechada: nunca recebe anos novos. Conferir uma fonte não implica publicar um
período novo. As séries anuais têm períodos explícitos no código: uma nova
edição exige revisar esses períodos, as referências oficiais e as validações.

Pré-requisitos: Python 3.14+, uv, Node.js (22.23.4+ para o site), dependências
instaladas pelos comandos de preparação acima, Chromium para HPV e GitHub CLI
(`gh auth login`) com escrita no repositório para publicar Releases. Vigitel
exige o arquivo obtido por `./download-vigitel.sh` ou `VIGITEL_INPUT_PATH`;
INCA usa a edição transcrita e versionada em `pipeline/references/`. Referências
oficiais de cada fonte devem ser conferidas antes da publicação.

Prepare uma pasta nova para revisão (não use uma execução concorrente):

```sh
uv run python -m pipeline update --source painel --source cnes --source hpv --output data/review-2026-11-05
cat data/review-2026-11-05/update.json
git diff --no-index site/public/dados/manifest.json data/review-2026-11-05/dados/manifest.json
```

`update` executa baixar, limpar, calcular, validar e exportar em um snapshot
isolado. `--source` pode ser repetido; os nomes estão em `run --list`.
`--data-dir` e `--clean-dir` selecionam o contrato e estado de entrada (por
padrão, `site/public/dados` e `data/clean`). A malha deve estar publicada;
selecionar `mesh` recalcula todas as fontes juntas. Selecionar `popsvs` inclui
mamografia, citopatológico e SIM no mesmo grupo: uma falha descarta o grupo
todo, inclusive o novo denominador. Atualizar um indicador isolado reutiliza o
denominador do snapshot de entrada. Use sempre contrato e estado da mesma versão.

Os JSON e o estado aprovados ficam em `dados/` e `clean/` dentro da pasta de
revisão. Uma falha registra fonte, etapa e erro em `update.json`, aparece na
saída e retorna código 1; outras fontes independentes continuam. O snapshot
preserva os dados e a data anterior de cada grupo que falhou. Nada é alterado
nos JSON do site nem no estado de entrada. Inspecione o relatório, o manifesto,
os períodos, os alertas e os resultados antes de publicar. Não publique uma
fonte que falhou; você pode publicar apenas os sucessos preservados no snapshot.

Depois da revisão, exporte para inspeção e publique uma versão nova:

```sh
uv run python -m pipeline export-release --data-dir data/review-2026-11-05/dados --state-dir data/review-2026-11-05/clean --output data/release-2026-11-05
uv run python -m pipeline release data-2026-11-05 --data-dir data/review-2026-11-05/dados --state-dir data/review-2026-11-05/clean --output data/release-2026-11-05
```

Além de CSV/Parquet, `--state-dir` inclui assets `state-<fonte>.tar.gz` com
agregados e estado necessário à retomada. Cada asset deve ter menos de 2 GiB;
se ultrapassar, o comando falha antes de enviar qualquer asset. HPV inclui
somente `official.json` e `census.parquet`: nenhum ZIP SI-PNI, extrato de
paciente, histórico de auditoria ou `audit.json` entra na Release.

Para retomar em outra máquina, baixe a mesma Release em uma pasta vazia e
restaure contrato e estado em destinos novos:

```sh
gh release download data-2026-11-05 --dir data/download-2026-11-05
uv run python -m pipeline restore-release --assets data/download-2026-11-05 --output data/restored-2026-11-05/dados
uv run python -m pipeline restore-state --assets data/download-2026-11-05 --output data/restored-2026-11-05/clean
uv run python -m pipeline update --source hpv --data-dir data/restored-2026-11-05/dados --clean-dir data/restored-2026-11-05/clean --output data/next-review
```

A Release não altera o site. Para levar a versão revisada ao público, restaure
os JSON dessa Release em `site/public/dados` (com `restore-release`), rode
`npm run check --prefix site` e `npm run build --prefix site`, confira o diff,
faça commit dos JSON e envie à `main`. O Cloudflare publica esses assets.
CI continua verificando tipos, testes e build; o processamento local e a
publicação dos dados são etapas separadas. Os comandos `run --step` continuam
disponíveis para diagnóstico, mas não oferecem o isolamento de `update`.

## Dados abertos

Depois de exportar os JSON das fontes validadas, exporte o contrato completo:

```bash
uv run python -m pipeline export-release
```

A etapa gera `data/release/<indicador>.csv` e `.parquet`, com todos os
recortes, séries, resultados e metadados publicados, mais `contract` com o
manifesto, o índice municipal, a malha e os demais dados auxiliares.
Não depende dos insumos locais em `data/raw/` ou `data/clean/`.
`--data-dir` e `--output` permitem escolher a origem e o destino.

O [guia do pesquisador](docs/reproducibility.md) descreve os arquivos, as colunas, o manifesto e os níveis de reprodução comprovados.

Para publicar, com o GitHub CLI instalado e autenticado com permissão de
escrita no repositório:

```bash
uv run python -m pipeline release data-2026-11-05
```

Esse comando exporta os arquivos e cria uma Release com todos os assets,
marcada como a mais recente. A versão deve começar com `data-` e ser nova;
versões existentes não são sobrescritas. Cada asset deve ter menos de 2 GiB;
se algum atingir o limite, nada é enviado. Use `--state-dir` para incluir o estado retomável da mesma versão; a antiga
Release `hpv-state` não faz parte do fluxo e seus extratos de pacientes não
devem ser republicados.
Use `--repository owner/repo` para outro repositório.

[Download atual](https://github.com/kvojps/brazil-cancer-map/releases/latest).
Os arquivos ficam disponíveis depois da primeira publicação pelo mantenedor.
Cada arquivo identifica fonte, período e condições. Dados de terceiros não
recebem a licença do código; cite o Observatório **e as fontes originais**.
A [metodologia](https://github.com/kvojps/brazil-cancer-map/blob/main/site/src/pages/metodologia.astro)
reúne as condições e limitações por fonte.

Para reconstruir os JSON, baixe **todos** os arquivos `.parquet` da mesma
versão, inclusive `contract.parquet`, em uma pasta vazia:

```bash
uv run python -m pipeline restore-release --assets /tmp/release --output /tmp/dados
```

Também é possível usar só os CSV, com `--format csv`. O resultado é o mesmo
contrato JSON, sem baixar fontes nem executar as etapas estatísticas. Depois
de conferir a versão, use `--output site/public/dados` e `npm run build --prefix site`.
