# Base de comparação da reorganização da pipeline

A [issue #13](https://github.com/kvojps/brazil-cancer-map/issues/13), parte da
[#12](https://github.com/kvojps/brazil-cancer-map/issues/12), caracteriza o código
anterior à movimentação dos módulos. Base de produção:
`97c8e67a3ec4fe8bd101fdad7e98f5a643010dbe`. Não altera método, CLI,
Contrato de dados, ADRs ou dados nacionais. Os testes novos passam contra o
comportamento existente; não há funcionalidade nova a implementar no ciclo TDD.
As três interfaces foram confirmadas pelo mantenedor: CLI/Source, atualização
com snapshots e cálculo/exportação de Painel/HPV.

## Insumos e expectativas congeladas

As referências independentes `pipeline/tests/fixtures/painel-contract.json` e
`hpv-2026-contract.json` permanecem intactas. A nova
`calculation-baseline.json` foi capturada na base acima, antes da reorganização,
e contém os resultados intermediários, não expectativas recalculadas pelo teste.

- Painel: o preparador em `test_painel_state.py` fornece registros de 2014–2026,
  cinco tipos de câncer, um município, modalidades e prazos fixos e duas páginas
  TabNet por ano. Somente o decodificador externo DBC é simulado. Os arquivos
  DBC têm mtime `1792195200` (17/10/2026 UTC). Limpeza, contagem, cálculo,
  validação e exportação são reais. A base inclui `extract.json`, alertas,
  camadas, séries, colunas e linhas de `cases.parquet` e `months.parquet`.
- HPV: `prepared_source(..., last_year=2026)` em `test_hpv.py` fornece três
  municípios, dois sexos, Censo por idade e coortes oficiais de 2020–2026,
  extraídas em `2026-11-05`. O cálculo oficial recebe somente `official.json`,
  `census.parquet` e o índice municipal. A base inclui esses insumos lógicos e
  `computed.json`. Auditoria não alimenta o cálculo. O teste existente repete a
  reprodução sob relógios de 2026, 2027 e 2030.
- Atualização: Sources de teste implementam o protocolo e escrevem arquivos
  antes de uma falha configurável. Não simulam as decisões do executor: expansão,
  cópia, grupos, descarte, continuidade e relatório são executados por `update`.
  O relógio do relatório é `2026-11-13T12:00:00+00:00`. Os caminhos ficam sob
  `tmp_path`, sem depender de `data/raw` ou `data/clean` locais.
- A ordem real do registro é conferida separadamente. SIM também executa
  `compute` pela CLI real com denominador já disponível no snapshot; não
  executa POPSVS. O cenário de atualização somente SIM confere a mesma seleção
  e disponibilidade do denominador.

O duplo de Source testa a orquestração; não comprova aquisição ou estatística
das dez Sources. Os testes com Painel, HPV e SIM reais cobrem essas outras
fronteiras com fixtures. Nenhum teste exige nova aquisição nacional.

## Procedimento antes/depois de cada ticket

Na raiz, com as dependências do lockfile e os pré-requisitos do
[guia de desenvolvimento](../development.md):

```sh
uv run pytest pipeline/tests/test_cli.py pipeline/tests/test_update_characterization.py
uv run pytest pipeline/tests/test_calculation_baseline.py pipeline/tests/test_painel_state.py pipeline/tests/test_hpv.py
uv run mypy
uv run pytest
```

Execute nos dois checkouts com o mesmo `uv.lock`, interpretador e fixtures.
Nesta entrega: Python 3.14.4, uv 0.13.7 e dependências do lockfile. O cache foi
isolado com `UV_CACHE_DIR=/tmp/cancer-map-uv`; isso não altera os insumos.
Não regenere a base para fazer uma reorganização passar. Se imports ou alvos
externos de monkeypatch mudarem, adapte somente os preparadores e os imports.
Mantenha valores, datas e registros dos preparadores iguais aos desta entrega.

`test_calculation_baseline.py` compara o conjunto completo de JSON intermediários
e os Parquet por colunas e linhas ordenadas, sem depender dos bytes da compressão.
Repete etapas em novas instâncias para não depender de estado em memória. Também
compara o conjunto completo de documentos publicados com as referências
independentes. A serialização canônica preserva distinções como `1` e `1.0`,
booleanos e nulos; somente a ordem das chaves é irrelevante.

**Única diferença permitida nos documentos publicados:**
`manifest.json.pipeline_version`, que identifica o checkout executado e é
conferido como não vazio antes da comparação. Nenhuma data, proveniência,
período, valor, classe, origem territorial ou outro campo é ignorado.
Nos intermediários não há exceções. No relatório o instante é fixado e a seleção
original, sucessos, grupos e mensagens de erro são comparados na ordem observada.

Para provar sensibilidade, altere temporariamente um valor de uma cópia da
referência, rode o teste correspondente e confirme falha; restaure a cópia antes
de prosseguir. Erros funcionais encontrados devem ter issue própria, com insumo,
resultado observado e esperado. Não devem ser corrigidos junto da reorganização.

## Percurso atual: Indicador do Painel até os JSON

1. `pipeline/__main__.py` fornece `SOURCES` à CLI em `pipeline/cli.py`.
   `pipeline/source.py` define as cinco etapas. `pipeline/sources/__init__.py`
   constrói `PainelSource` com diretórios de estado e publicação.
2. Em `pipeline/sources/painel.py`, `download` obtém DBC e as duas tabelas
   TabNet. `clean` lê DBC, chama `count_cases` (a contagem já ocorre na limpeza),
   fixa a data pelo mtime e preserva as páginas oficiais no estado.
3. `write_clean` persiste `cases.parquet`, `months.parquet` e `extract.json`.
   `compute` lê esses arquivos, calcula `monthly_drops`, chama
   `within_60_days_layer` e `within_60_days_profiles`, e grava
   `monthly_alerts.json` e `layers/<tipo>{,-profiles}.json`.
4. `validate` compara contagens e proporções com as páginas TabNet preservadas
   e confere camadas. Os alertas mensais são informativos. `export` revalida,
   monta `map/within_60_days/<tipo>.json`, incorpora séries em `profiles/<UF>.json`
   e atualiza `manifest.json`. `pipeline/publish.py` prepara a publicação conjunta
   e mantém os demais indicadores e metadados.
5. Evidência: `test_painel_clean.py`, `test_painel_compute.py`,
   `test_painel_monthly.py`, `test_painel_validate.py`, `test_painel_publish.py`,
   `test_painel_state.py` e `test_calculation_baseline.py`.

Conhecimento implícito atual: um arquivo concentra aquisição, persistência,
cálculo, validação e montagem; distinguir camada e perfil exige seguir duas
funções, e saber que a contagem começa em `clean` exige ler a coordenação.
Não houve ensaio com leitor independente nesta etapa; esse aceite pertence à
spec pai após a reorganização.

## Percurso atual: regra de cálculo até seus efeitos

Exemplo: prazo de até 60 dias, apenas quimio/radio, conforme ADR 0003.

1. Em `pipeline/sources/painel.py`, `CaseCounts` e `count_cases` identificam
   prazo/modalidade nos registros DBC; `write_clean` e `read_clean` conservam
   contagens separadas de todos os casos e de quimio/radio.
2. `within_60_days_layer` recebe contagens, provisórios e relação territorial.
   `_trend_and_shares` usa quimio/radio no valor e na Tendência e todos os casos
   na proporção sem informação. `pipeline/trend.py`, `pipeline/cascade.py` e
   `pipeline/status.py` fornecem Tendência, cascata e Situação.
3. `uf_quality` e `quality_band` usam todos os casos nos cinco anos consolidados.
   `within_60_days_profiles` consome a camada para selecionar séries coerentes
   com a origem territorial. `compute` persiste ambos; `validate` e `export`
   os consomem em outras instâncias, até mapa e Meu município.
4. `test_painel_compute.py` separa a perda de cirurgias da série quimio/radio,
   cobre provisórios, qualidade, Referência, arredondamento e cascata. Os testes
   de limpeza verificam contagem; os de publicação/estado verificam seus efeitos
   nos JSON; a base congelada compara intermediários e documentos completos.

Conhecimento implícito atual: `within_60_days_profiles` reutiliza a camada, mas
calcula também contexto da UF; a regra de qualidade está no mesmo módulo que a
regra de prazo. Os testes têm entradas distintas por fronteira. A revisão futura
deve demonstrar como o novo resultado em memória conecta esses consumidores,
sem tomar número de arquivos ou linhas como prova de legibilidade.

## Evidência desta entrega

Em 13/11/2026, a captura dos intermediários foi executada contra os módulos de
produção da base `97c8e67`, com os preparadores descritos acima. Nenhum módulo de
produção, referência independente de contrato, JSON publicado, spec ou ADR foi
alterado. A comparação posterior usou os mesmos preparadores e passou nos 11
casos novos, incluindo as parametrizações. CLI e atualização, juntas, passaram
em 19 casos. `uv run mypy` aprovou 52 arquivos.

SHA-256 de `calculation-baseline.json`:
`7ebef92162d91dd1cb18e669fb81d65adde05abf93083c61b22aad08148093c8`.

A prova de sensibilidade acrescentou temporariamente
`hpv.json.computed.json.unexpected_regression = true` à referência de cálculo
(o caminho começa na chave `hpv` da fixture, seguido de `json` e `computed.json`).
A seleção `uv run pytest pipeline/tests/test_calculation_baseline.py -k hpv -q`
falhou na comparação, como esperado. Os bytes originais foram restaurados em
`finally`. Esse campo não faz parte da referência commitada.

A suíte completa `uv run pytest` passou: **216 testes**, em 96,47 s, com
468 avisos `PerfectSeparationWarning` do statsmodels nas séries sintéticas.
O mypy passou novamente com 52 arquivos. As revisões independentes de padrões
(Standards) e aderência à issue (Spec), sobre o diff desde `97c8e67`, não
identificaram achados em nenhum dos dois eixos. A entrega foi commitada
separadamente na branch atual `hml`; publicação remota e deploy não fazem parte
desta prova local.

## Depois da reorganização do Painel (#14)

Base deste passo: `15c16299b7591fc7332c147c8790475996e967ff` (entrega da
#13). Os percursos anteriores acima descrevem essa base; `painel.py` foi
substituído pelo pacote `pipeline/sources/painel/`. O import público
`from pipeline.sources.painel import PainelSource` permanece disponível.
Helpers são importados diretamente do módulo responsável.

### Indicador da entrada até os JSON

1. CLI e registro continuam chegando a `PainelSource`, reexportada pelo
   `__init__.py` e coordenada em `source.py`, com as mesmas cinco etapas.
2. `acquisition.py` obtém FTP/TabNet, decodifica DBC, interpreta as tabelas e
   fornece `count_cases`. `source.clean` continua chamando a contagem durante
   a limpeza, fixando a extração pelo mtime e preservando as páginas oficiais.
   `models.py` nomeia contagens, modalidades, recortes e linhas limpas.
3. `persistence.py` lê/escreve `cases.parquet`, `months.parquet` e
   `extract.json`, sem mudar colunas ou destinos. Em `source.compute`, os
   dados e a relação territorial são carregados antes de chamar
   `calculation.calculate(rows, monthly_counts, immediate_region_of)`.
4. `calculation.py` devolve `PainelResult` com `layers`, `profiles` por Tipo
   de câncer e `monthly_alerts`. Não acessa caminhos nem grava arquivos.
   `persistence.write_result` conserva `monthly_alerts.json` e
   `layers/<tipo>{,-profiles}.json`. Uma nova instância pode retomar daí.
5. `source.validate` carrega referências e camadas, emite os alertas uma vez
   nessa etapa e entrega dados carregados a `validation.check`. A comparação
   com TabNet e as verificações bloqueantes estão em `validation.py`.
6. `source.export` repete as verificações bloqueantes sem reemitir alertas,
   carrega o resultado e os perfis existentes e chama `export.documents`.
   Esse montador conserva os outros indicadores e produz mapa e perfil sem
   recalcular estatística. A coordenação atualiza o manifesto e usa
   `pipeline/publish.py` para publicar o conjunto.

### Regra de prazo até seus efeitos

1. Os códigos de modalidades estão em `models.py`; `is_within_60_days` e
   `count_cases`, em `acquisition.py`. `source.clean` usa essas funções antes
   de `persistence.write_clean`. Isso explicita a contagem na limpeza.
2. Em `calculation.py`, `within_60_days_layer` usa `_group_series`,
   `_trend_and_shares`, `uf_quality` e os métodos existentes de Tendência,
   cascata e Situação. A origem territorial é decidida nessa camada.
3. `calculate` passa essa mesma camada a `within_60_days_profiles`: a origem
   escolhe `series_id`, inclusive região e Dado insuficiente. O resultado
   reúne as duas saídas; exportação só monta os documentos correspondentes.
   O contexto da UF continua sendo calculado em `within_60_days_profiles`.
4. Os testes de limpeza, cálculo, alertas e comparação oficial mantêm suas
   entradas e expectativas. Os testes de publicação/estado acompanham a regra
   até os JSON. `test_calculation_baseline.py` compara intermediários e contrato
   com as referências congeladas e também chama o cálculo em memória depois
   de remover os diretórios originais, verificando que as entradas não mudam.

Conhecimento ainda necessário: os dois últimos anos são provisórios;
`count_cases` pertence à limpeza; a UF fornece contexto e qualidade, mas não
substitui a Região imediata na cascata. Esses pontos estão nomeados no código
ou neste percurso. A organização não altera método, comandos, ADRs nem exige
nova aquisição nacional.

### Verificações e leitura independente deste passo

Em 13/11/2026, com Python 3.14.4, uv 0.13.7, o mesmo `uv.lock` e
`UV_CACHE_DIR=/tmp/cancer-map-uv`, a base `15c1629` passou nos 13 testes de
estado do Painel e cálculo congelado antes da movimentação. Depois, os 63
casos direcionados de limpeza, cálculo, alertas, validação, publicação, estado
e comparação congelada passaram. O teste adicional da interface em memória
passou contra as expectativas preexistentes. Nenhuma fixture foi regenerada;
os hashes de `calculation-baseline.json` e `painel-contract.json` continuam,
respectivamente, `7ebef92162d91dd1cb18e669fb81d65adde05abf93083c61b22aad08148093c8`
e `dc559fe8342729b7eb9a4d90f7188fe3df39dd55d95cfdd273546467e7368c3a`.
A única diferença permitida continua sendo `manifest.json.pipeline_version`.

Uma revisão independente por agente, sem contexto anterior da pipeline, fez
os dois percursos usando somente o repositório. Arquivos percorridos:
`docs/development.md`, CLI e registro, `painel/source.py`, `acquisition.py`,
`models.py`, `persistence.py`, `calculation.py`, `validation.py`, `export.py`,
`pipeline/publish.py`, esta caracterização e os testes do Painel.

O leitor encontrou o prazo em `acquisition.is_within_60_days`, seus campos de
entrada e a aplicação na limpeza por `count_cases`. Seguiu os contadores de
todos os casos e de quimio/radio até Parquet, valor/Situação/Tendência do mapa,
séries do perfil, comparação TabNet e JSON publicados. Precisou consultar as
regras de provisórios, denominadores, cascata, contexto da UF e intervalos
negativos; estavam nomeadas no código ou documentadas. Não restou dúvida que
impedisse completar os percursos. A navegação atravessa mais arquivos, mas os
nomes e o guia indicam cada responsabilidade.

Essa é uma leitura independente **por agente**, não um ensaio com pessoa
contribuidora. A validação humana de legibilidade ainda não foi realizada;
fica explicitamente pendente para o aceite da #14 e da spec pai #12.

#### Standards

A revisão independente do diff desde `15c1629` não encontrou violações dos
padrões documentados nem novos problemas acionáveis nas heurísticas de código.

#### Spec

A revisão independente não encontrou desvios funcionais, escopo adicional ou
requisitos implementados incorretamente. A comparação por AST confirmou os
helpers existentes de contagem, cálculo, parsing e comparação preservados.
Ficavam pendentes no momento da revisão o registro final das verificações e
a validação humana acima. Nenhum erro funcional novo foi identificado.

A verificação final passou com **217 testes** (`uv run pytest`, 99,74 s) e
**59 arquivos** aprovados pelo `uv run mypy`. Os 492 avisos
`PerfectSeparationWarning` vêm das séries sintéticas do statsmodels; não houve
falha. O diff passou em `git diff --check`. Os comandos foram executados com
o cache temporário descrito acima. O commit que contém esta seção registra
as evidências na branch `hml`; não houve push, PR, deploy, alteração dos JSON
públicos ou nova aquisição nacional. A issue permanece aberta para a avaliação
humana de legibilidade e a vinculação da entrega remota.

Após esse registro, o mantenedor aprovou a entrega e solicitou o push e o
encerramento da #14. O aceite usa os percursos documentados e a leitura
independente por agente descrita acima; não acrescenta evidência de ensaio
humano. A publicação dos commits em `hml` e os links de conclusão ficam
registrados na issue. Esse aceite não encerra a spec pai #12 nem implica deploy.

## Depois da reorganização do HPV (#15)

Base deste passo: `e749ba0f9309abb5fcc7f8e50eace7101df8130e`, na branch
`hml`. `pipeline/sources/hpv.py` foi substituído pelo pacote
`pipeline/sources/hpv/`, preservando `from pipeline.sources.hpv import HpvSource`.
Não houve nova aquisição nacional nem alteração dos JSON publicados.

### Indicador oficial da entrada até os JSON

1. CLI e registro chegam a `HpvSource`, reexportada por `__init__.py` e
   coordenada em `source.py`. `download` reutiliza `pipeline/hpv_inputs.py`
   para o Censo e `pipeline/hpv_official.py` para as coortes qualificadas.
   `clean` permanece sem operação: esses insumos já chegam padronizados.
2. `persistence.read_official` carrega `official.json` com `source_url`,
   `extracted_at`, anos e registros; `read_census` carrega as linhas do
   `census.parquet`. A coordenação carrega a relação territorial do índice
   municipal antes de chamar `calculation.calculate`.
3. `calculate(official_cohorts, census_rows, immediate_region_of)` valida o
   histórico declarado, a proveniência e a data, confere as fatias do Censo
   e os denominadores oficiais e retorna `models.HpvResult` em memória.
   Não lê arquivos nem consulta o relógio. O resultado reúne período,
   Referência, municípios com origem e `series_id` e séries por origem e sexo.
4. `persistence.write_result` conserva o formato e o destino `computed.json`.
   `validate` e `export` podem retomar esse resultado em novas instâncias.
   `validation.check` recebe resultado, códigos municipais e referências já
   carregados e mantém os bloqueios. O destino padrão das referências continua
   sendo `pipeline/references/hpv.json`, ajustado à profundidade do pacote.
5. `source.export` revalida, carrega perfis existentes e chama
   `export.documents`, que monta os mapas `all`/`cervix` e perfis por UF sem
   escolher outra origem ou refazer estatística. A coordenação atualiza o
   manifesto e usa a mesma publicação conjunta de `pipeline/publish.py`.
   Os outros indicadores, metadados de perfil e Fontes são preservados.

### Regra temporal e territorial até seus efeitos

1. `calculation.calculate` lê `years` e `extracted_at` das coortes. O ano da
   extração determina provisoriedade e último consolidado. O relógio só
   participa da seleção de anos para uma nova aquisição em `source.py`.
2. O Censo 2022 fornece o denominador fixo. `data_origins` decide entre
   município, Região imediata e Dado insuficiente usando esse denominador.
   Boa Esperança do Norte continua sem população inventada.
3. A mesma decisão escolhe `series_id`, a série exibida e o ponto consolidado
   do município. `HpvResult` carrega essas decisões até o intermediário;
   `export.documents` apenas seleciona os campos do mapa e as séries dos perfis.
4. `test_calculation_baseline.py` compara o intermediário completo e o
   Contrato de dados com as fixtures independentes; também remove os
   diretórios antes de calcular em memória e verifica entradas intactas.
   `test_hpv.py` cobre cascata, sexos, dose única, valores acima de 100%,
   falhas bloqueantes, revalidação, snapshot e reprodução em anos distintos.

### Auditoria e estado público

`hpv-audit` agora chega diretamente a `audit.HpvAudit`, com `download`, `clean`
e `compute`. A seleção de ano, catálogo, redução mensal, medições, legado
TabNet e reconstrução ficam nesse módulo. Os seis corpos de métodos foram
comparados por AST com a base: são iguais, descontando os nomes das três
entradas. Os comandos, opções e arquivos locais permanecem os mesmos.
O cálculo oficial não importa auditoria nem consome `audit.json`.

O teste da CLI reduz um ZIP real de fixture com `--step clean --year 2020`;
outro reconstrói o histórico local e verifica que resultado oficial e
publicação permanecem idênticos, além de rejeitar `compute --year`.
Os testes de Release e reprodução continuam conferindo que somente
`official.json` e `census.parquet` integram o estado público HPV, mesmo com
extratos de pacientes e auditoria disponíveis localmente.

### Comparação controlada

Em 13/11/2026, com Python 3.14.4, uv 0.13.7, o mesmo `uv.lock` e
`UV_CACHE_DIR=/tmp/cancer-map-uv`, a base passou em **28 testes** de HPV e
caracterização antes da movimentação. Depois, os **29 casos** desses dois
arquivos passaram com a nova interface em memória; os **27 casos** do
arquivo HPV passaram após acrescentar a verificação da auditoria pela CLI e
a preservação de outros indicadores e metadados.

Os insumos, datas e expectativas congeladas não foram regenerados.
SHA-256 de `calculation-baseline.json`:
`7ebef92162d91dd1cb18e669fb81d65adde05abf93083c61b22aad08148093c8`;
de `hpv-2026-contract.json`:
`5613611f3708336511d04cb94f135ef2b754b1fbc8494e5f2ab9e0834e7dc9f6`.
Nos intermediários não há diferenças permitidas. No contrato, somente
`manifest.json.pipeline_version` pode diferir, identificando o checkout.
A reprodução com estado empacotado/restaurado confere o contrato independente
sob relógios de 2026, 2027 e 2030. A execução das etapas em instâncias novas
confere também os insumos lógicos e `computed.json` contra a base.

Conhecimento ainda necessário: a coleta inclui o ano corrente, mas o recálculo
usa a data de extração; a origem depende do denominador fixo; a reconstrução
não equivale ao numerador qualificado. Esses pontos estão nos módulos, ADRs e
nos percursos acima. Não houve ensaio humano de legibilidade nem identificação
de novo erro funcional durante este passo. A verificação conjunta da spec pai
#12 permanece separada.

### Verificação final e revisão deste passo

A suíte completa `uv run pytest -q` passou: **220 testes**, em 103,22 s,
com os mesmos 492 avisos `PerfectSeparationWarning` nas séries sintéticas.
`uv run mypy` aprovou **66 arquivos**, e `git diff --check` passou.
O commit de implementação é `f2414a4` na branch atual `hml`.

#### Standards

A revisão independente do diff desde `e749ba0`, seguindo a skill
`code-review`, não encontrou violações documentadas nem smells acionáveis:
**0 achados**. A manutenção dos parâmetros do construtor foi tratada como
preservação da interface pública, sem ampliar o escopo para removê-los.

#### Spec

A revisão independente não encontrou requisitos ausentes, ampliação de escopo
ou implementação incorreta: **0 achados**. Conferiu cálculo em memória,
origem compartilhada, referências, revalidação, publicação, auditoria e
cobertura das fixtures. Os agentes revisaram o código e a documentação;
usaram os resultados de execução acima, sem repetir a suíte.

Não houve push, PR ou deploy nesta entrega. O vínculo remoto dos commits e
o encerramento da #15 ficam pendentes de sua publicação; isso não encerra
a spec pai #12.

Após esse registro, o mantenedor aprovou a entrega da #15 e autorizou seu
push em `hml` e o encerramento da issue. O aceite considera as verificações
e revisões registradas acima; não acrescenta ensaio humano de legibilidade.
Os links dos commits publicados e a conclusão ficam registrados na #15.
Esse aceite não encerra a spec pai #12 nem implica deploy em produção.

## Depois da centralização do registro (#16)

A base deste passo é `db863460ebbf0904c21b6af9fcac8a15bea4102d`.
O registro ordenado `SOURCE_DEFINITIONS`, em `pipeline/sources/__init__.py`,
substitui a lista de construção. `SourceDefinition` separa a fábrica,
os insumos consumidos (`inputs`), os gatilhos de atualização (`update_with`)
e a aceitação conjunta dos participantes selecionados (`accept_with`).
`SourceInput` identifica produtor e arquivo relativo ao estado desse produtor.
A política `includes_all` da malha abrange entradas futuras.

`create_sources(clean_dir, site_data_dir)` e `SOURCES` conservam as interfaces
e a ordem anteriores. A fábrica recebe o diretório da própria `source`, o
diretório de publicação e os insumos resolvidos na mesma cópia de trabalho.
SIM, mamografia e citopatológico recebem `population_path` nomeado.
A validação rejeita duplicações, referências desconhecidas e relações fora
da ordem antes de construir instâncias ou criar a saída de `update`.
Também rejeita caminhos absolutos ou com `..` nos insumos.

O executor atual lê expansão e aceitação do registro, sem `POPULATION_USERS`.
Continua responsável por cópias, etapas, descarte e relatório. A extração do
planejador puro pertence ao próximo passo; nenhum novo comando foi introduzido.
Para localizar um consumidor, leia sua definição e depois sua fábrica, sem
procurar outra lista de construção ou de consumidores em `update.py`.

### Comparação controlada

Em 13/11/2026, o código da base foi extraído com `git archive` para
`/tmp/bcm-issue16-before`. Base e entrega executaram o mesmo interpretador
Python 3.14.4 e as mesmas dependências do `.venv`, definidas pelo `uv.lock`
inalterado (uv 0.13.7). Foram mantidos os preparadores, os relógios e as
referências congeladas descritos acima. Não houve aquisição nacional.

Comando nos dois diretórios (na base, usando diretamente o Python do mesmo
`.venv` para executar `-m pytest`):

```sh
uv run pytest pipeline/tests/test_cli.py pipeline/tests/test_update_characterization.py pipeline/tests/test_calculation_baseline.py pipeline/tests/test_painel_state.py pipeline/tests/test_hpv.py -q
```

- Antes: **61 passaram**. Depois: os mesmos **61 passaram**, mais **14**
  testes de `test_source_registry.py`, totalizando **75** na execução conjunta
  inicial. Após a revisão, foi acrescentado um teste de ordem cruzada entre
  insumo e aceitação conjunta; os **24** testes de registro e atualização
  passaram na verificação direcionada final.
- POPSVS + Painel continua executando e aceitando primeiro
  `[popsvs, siscan, siscan_cytopathology, sim]`, depois `[painel]`.
  SIM isolado não executa POPSVS. Malha continua incluindo todas as entradas.
  Falha tardia descarta o grupo inteiro e permite grupos independentes.
  Relatório, seleção original, ordem e entradas preservadas continuam iguais.
- Novo consumidor declarado no registro recebe o insumo no snapshot e é
  incluído por `update_with`, sem outra lista de construção. Aceitação sozinha
  e consumo sozinho não ampliam a seleção. A política da malha inclui a nova
  entrada. Esses cenários usam Sources de teste, sem acesso às Fontes.
- Mamografia e citopatológico reais executam `compute` e `export` pela CLI
  com população presente somente no snapshot; os valores conhecidos são
  respectivamente `0.8` e `1.2`. A prova existente do SIM executa `compute`
  com o denominador do snapshot. Instâncias novas preservam etapas isoladas.
- Cálculo, intermediários e Contrato de dados de Painel e HPV continuam
  comparados com as mesmas referências independentes. Única diferença
  permitida: `manifest.json.pipeline_version`, por identificar o checkout.
  Não foram ignorados outros metadados, datas ou valores.
- Os avisos `PerfectSeparationWarning` das séries artificiais permanecem
  informativos. Nenhum erro funcional preexistente foi identificado neste passo.

### Revisão deste passo

#### Standards

O primeiro relatório apontou substituição de um colaborador interno nos testes
novos. Resolvido: `update_sources` e `copy_state` aceitam `registry` como
argumento opcional, mantendo os padrões públicos; os testes fornecem o registro
explicitamente, sem monkeypatch dessa dependência. A segunda revisão não
identificou achados pendentes.

#### Spec

O primeiro relatório identificou que uma aceitação conjunta poderia antecipar
uma consumidora em relação a outro produtor selecionado. O novo teste mostrou
a execução incorreta antes da correção. Agora a atualização verifica a ordem
dos grupos e rejeita essa configuração antes de criar a saída, sem ordenar o
registro automaticamente. A comparação vigente de POPSVS e malha permanece
inalterada. Esse defeito foi encontrado na implementação nova e corrigido
neste passo, sem alterar método estatístico.

A segunda revisão de Spec confirmou **zero achados pendentes**.

### Verificação final

- `UV_CACHE_DIR=/tmp/cancer-map-uv uv run pytest -q`: **235 passaram**, com
  498 avisos `PerfectSeparationWarning` das fixtures, em 101,85 s.
- `UV_CACHE_DIR=/tmp/cancer-map-uv uv run mypy`: **sem erros em 67 arquivos**.
- `git diff --check`: sem erros de whitespace.
- Standards: **0 achados pendentes**; Spec: **0 achados pendentes**.

Os commits foram feitos na branch atual `hml`, conforme a instrução de
implementação. Não houve push, PR ou deploy. A publicação dos commits e seus
links remotos permanece pendente; por isso a issue #16 fica aberta para esse
registro final. A spec pai #12 permanece aberta.

Após esse registro, o mantenedor aprovou a entrega da #16 e autorizou o push
em `hml` e o encerramento da issue. O aceite considera as verificações e
revisões registradas acima. A publicação dos commits e a conclusão ficam
registradas na #16; isso não encerra a spec pai #12 nem implica deploy.

## Depois da extração do planejador (#17)

Base deste passo: `1ccf1cea8f92a22c0950df7cb16a99112adcef89`, na branch
`hml`. `pipeline/update_plan.py` expõe `plan_update(selected, registry)` e
`UpdatePlan`, uma lista de grupos ordenados de nomes. O planejador valida o
registro e a seleção, expande os gatilhos até estabilizar e agrupa somente
participantes selecionados para aceitação conjunta. Não lê arquivos nem
chama fábricas. A ordem permanece explícita, sem ordenação automática.

`pipeline/update.py` chama o planejador antes de criar a saída e conserva
pré-condições operacionais, cópias, construção no snapshot, cinco etapas,
aceitação/descarte e relatório. Cada grupo usa o último estado aceito; uma
falha descarta o grupo inteiro e permite continuar grupos independentes.
`run` conserva seleção direta e não passa pelo planejador. Não há segunda
lista de consumidores nem relações de expansão ou agrupamento no executor.

### Comparação controlada

Em 13/11/2026, a base foi extraída com `git archive` para
`/tmp/bcm-issue17-before`. Base e entrega usaram o mesmo Python 3.14.4 do
`.venv`, as dependências do `uv.lock` inalterado e uv 0.13.7. Executou-se
nos dois checkouts a mesma seleção:

```sh
uv run pytest pipeline/tests/test_cli.py pipeline/tests/test_update_characterization.py pipeline/tests/test_source_registry.py pipeline/tests/test_calculation_baseline.py pipeline/tests/test_painel_state.py pipeline/tests/test_hpv.py -q
```

Na base extraída, o comando usou diretamente o Python do mesmo `.venv` com
`-m pytest`. Antes e depois da extração passaram os mesmos **76 testes**,
com os mesmos 224 avisos das séries sintéticas, em 31,84 s e 31,65 s,
respectivamente. Nenhuma fixture foi regenerada e não houve aquisição nacional.

- A caracterização mantém relógio fixo e compara seleção original, ordem das
  cinco etapas, relatório completo, descarte, continuidade e entradas intactas.
  SIM não executa POPSVS; POPSVS + Painel mantém o grupo de população antes
  do Painel; malha mantém todas as entradas num grupo na ordem do registro.
- Os testes da interface pura usam fábricas que falham se chamadas. Cobrem
  expansão transitiva, aceitação somente dos participantes selecionados,
  entradas futuras na malha, seleção inválida e ordem incompatível.
- Os testes pelo executor acrescentam um consumidor pelo registro e sua
  fábrica. Um grupo independente verifica o denominador e a publicação do
  último grupo aceito, tanto após sucesso quanto após descarte do grupo de
  população. Relatório e entradas originais também são conferidos.
- O estado público HPV continua restrito a `official.json` e `census.parquet`.
  As comparações de Painel/HPV conservam cálculo, intermediários e Contrato
  de dados com os insumos e datas congelados já descritos neste documento.
  Única diferença permitida no contrato: `manifest.json.pipeline_version`.
  `update.json.attempted_at` permanece fixo na caracterização; nenhum outro
  metadado, data ou valor é excluído genericamente.

Os guias de desenvolvimento, atualização e reprodução apontam a nova fronteira.
Os comandos e pré-requisitos não mudaram. Nenhum erro funcional novo foi
identificado; a aceitação conjunta incompatível continua sendo rejeitada,
como na base da #16. A verificação conjunta da spec pai #12 permanece separada.
