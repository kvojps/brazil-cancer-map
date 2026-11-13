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
