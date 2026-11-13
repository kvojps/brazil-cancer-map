# Verificação conjunta da reorganização da pipeline (#18)

Verificação da [issue #18](https://github.com/kvojps/brazil-cancer-map/issues/18)
contra todos os critérios da [spec #12](https://github.com/kvojps/brazil-cancer-map/issues/12),
no código `32430bab29bdd9d4e7ee8a730c3070eabebf8e46`, em 13/11/2026.
Este registro não altera nem encerra a issue pai. As conclusões abaixo vêm de
execução com fixtures e leitura independente por agente, aceita explicitamente
pelo mantenedor nesta sessão. Não houve ensaio com pessoa leitora humana.

## Entregas e verificações por integração

Os links e números desta tabela são registros das integrações anteriores,
não novas execuções de cada suíte histórica. Os procedimentos, ambientes,
comparações e limites estão na [caracterização](pipeline-characterization.md).
O fechamento das filhas foi conferido no tracker, mas não usado como prova
suficiente da spec: a matriz seguinte e a execução final verificam o conjunto.

| Entrega | Commits | Comparação controlada e verificação registrada |
|---|---|---|
| [#13 — caracterização](https://github.com/kvojps/brazil-cancer-map/issues/13) | [15c1629](https://github.com/kvojps/brazil-cancer-map/commit/15c1629) | Base de produção `97c8e67`; intermediários capturados antes da reorganização, contrato independente, prova de sensibilidade; 216 testes, mypy 52 arquivos |
| [#14 — Painel](https://github.com/kvojps/brazil-cancer-map/issues/14) | [2187cb6](https://github.com/kvojps/brazil-cancer-map/commit/2187cb6), [6d0ba11](https://github.com/kvojps/brazil-cancer-map/commit/6d0ba11), [e749ba0](https://github.com/kvojps/brazil-cancer-map/commit/e749ba0) | Base `15c1629`, 13 casos de estado/cálculo antes, 63 direcionados depois e cálculo em memória; 217 testes, mypy 59 arquivos |
| [#15 — HPV](https://github.com/kvojps/brazil-cancer-map/issues/15) | [f2414a4](https://github.com/kvojps/brazil-cancer-map/commit/f2414a4), [895f488](https://github.com/kvojps/brazil-cancer-map/commit/895f488), [db86346](https://github.com/kvojps/brazil-cancer-map/commit/db86346) | Base `e749ba0`, 28 casos antes e 29 depois; auditoria pela CLI e preservação de outros indicadores; 220 testes, mypy 66 arquivos |
| [#16 — registro](https://github.com/kvojps/brazil-cancer-map/issues/16) | [52c8152](https://github.com/kvojps/brazil-cancer-map/commit/52c8152), [265c6df](https://github.com/kvojps/brazil-cancer-map/commit/265c6df), [1ccf1ce](https://github.com/kvojps/brazil-cancer-map/commit/1ccf1ce) | Base `db86346`, mesmos 61 casos antes/depois, testes de novo consumidor e ordem de aceitação; 235 testes, mypy 67 arquivos |
| [#17 — planejador](https://github.com/kvojps/brazil-cancer-map/issues/17) | [53adb7d](https://github.com/kvojps/brazil-cancer-map/commit/53adb7d), [32430ba](https://github.com/kvojps/brazil-cancer-map/commit/32430ba) | Base `1ccf1ce`, mesmos 76 casos antes/depois, fábricas proibidas no planejamento e último snapshot aceito no executor; 242 testes, mypy 69 arquivos |

## Critérios conferidos em conjunto

Os arquivos de teste abaixo ficam em `pipeline/tests/`. Foram lidos junto dos
módulos de produção correspondentes e integram a suíte final executada.

| Critério da #12 | Evidência observável no estado final |
|---|---|
| Responsabilidades, interfaces em memória, imports públicos e etapas isoladas | `painel/source.py` e `hpv/source.py` coordenam aquisição, persistência, cálculo, validação e montagem. `test_calculation_baseline.py` repete compute/validate/export em novas instâncias e calcula após remover os diretórios originais, sem alterar as entradas. `test_painel_state.py` restaura estado e usa o registro público sem rede. |
| Mesmo resultado e origem no mapa e perfil | Painel passa a camada a `within_60_days_profiles`; HPV conserva `origin` e `series_id` em `HpvResult`. `test_painel_publish.py` confere séries regionais e insuficiência; `test_hpv.py` confere região, município novo e contrato; a base compara todos os documentos, não apenas campos selecionados. |
| Validação bloqueante, publicação conjunta e preservação de outros indicadores | Ambas as exports revalidam antes de montar/publicar. `test_painel_state.py` danifica as duas tabelas oficiais e exige contrato intacto. `test_hpv.py` cobre referências ausentes/divergentes, resultado inválido e preservação de outros indicadores/metadados. Alertas mensais continuam informativos e não são reemitidos pela exportação, conforme `test_painel_publish.py`. |
| HPV oficial separado da auditoria | `hpv-audit` chega a `audit.HpvAudit`; o cálculo oficial não o importa. `test_hpv.py` executa limpeza e reconstrução pela CLI sem mudar a publicação e rejeita `compute --year`. |
| Período HPV pela extração e estado público restrito | `test_hpv.py` restaura somente `official.json` e `census.parquet` e compara o contrato independente sob relógios de 2026, 2027 e 2030. `test_release.py` e `test_update_characterization.py` verificam exclusão dos extratos/auditoria mesmo quando existem localmente. O roundtrip complementa a comparação do cálculo, sem substituí-la. |
| Registro único, seleção e ordem | `SOURCE_DEFINITIONS` declara fábrica, insumos, gatilhos e aceitação. `test_source_registry.py` acrescenta consumidor sem segunda lista, verifica caminhos do snapshot e rejeita configuração inválida antes de criar saída. `test_cli.py` mantém seleção direta de source/etapa; SIM real usa população do snapshot sem executar POPSVS. |
| Planejador puro integrado ao executor | `test_update_plan.py` usa fábricas que falham se chamadas, compara grupos de POPSVS/Painel, SIM isolado, expansão transitiva e malha com entrada futura. `test_source_registry.py` verifica essas relações pela execução e confere o último estado aceito após sucesso e descarte. |
| Falhas, continuidade, relatório e isolamento | `test_update_characterization.py` compara ordem das cinco etapas, seleção original, sucessos e grupos completos nas falhas; falha tardia descarta população/consumidores, permite Painel independente e mantém entradas intactas. Malha com falha descarta tudo. `test_cli.py` cobre pré-condições e preservação do manifesto/data anterior. |
| Comparação controlada por integração e verificação final | Tabela acima, procedimento e hashes abaixo. Referências independentes e `uv.lock` inalterados. |
| Dois percursos e guias coerentes | Leitura independente registrada abaixo; guias de desenvolvimento, atualização e reprodução conferidos contra os módulos atuais. |

## Comparação final antes/depois

A base anterior à movimentação é `15c16299b7591fc7332c147c8790475996e967ff`
(#13). Foi extraída com `git archive` para
`/tmp/bcm-issue18-before-f67_noyl`, sem `.git`, `data/raw/` ou `data/clean/`.
Base e estado final usaram o mesmo Python **3.14.4**, uv **0.13.7** e
as dependências do mesmo `.venv` e `uv.lock`. Cache da execução atual:
`UV_CACHE_DIR=/tmp/cancer-map-uv`. Na base, executou-se o Python absoluto
`/home/kvojps/Documentos/dev/brazil-cancer-map/.venv/bin/python -m pytest`.

Seleção nos dois diretórios:

```sh
uv run pytest pipeline/tests/test_cli.py pipeline/tests/test_update_characterization.py pipeline/tests/test_calculation_baseline.py pipeline/tests/test_painel_state.py pipeline/tests/test_hpv.py -q
```

A base passou em **57 testes** (26,43 s, 194 avisos). O estado final passou
em **61 testes** (30,99 s, 218 avisos): quatro casos foram acrescentados nas
integrações — dois cálculos em memória, auditoria pela CLI e preservação dos
outros indicadores no perfil HPV. Para comparar a mesma seleção de casos,
a execução atual também usou:

```sh
uv run pytest pipeline/tests/test_cli.py pipeline/tests/test_update_characterization.py pipeline/tests/test_calculation_baseline.py pipeline/tests/test_painel_state.py pipeline/tests/test_hpv.py -k 'not calculates_in_memory and not audit_command_reconstructs_locally and not export_preserves_other_profile_indicators' -q
```

Os preparadores mantêm registros, mtime DBC `1792195200`, extração HPV
`2026-11-05` e relógio do relatório `2026-11-13T12:00:00+00:00`.
Foram conferidas as adaptações entre as duas versões dos testes: imports e
alvos de monkeypatch acompanham os novos módulos; auditoria usa a entrada
separada; os preparadores e expectativas do cálculo permanecem iguais.
Não se regenerou nenhuma fixture.

Somente **`manifest.json.pipeline_version`** pode diferir nos documentos
comparados; a base extraída sem `.git` usa a versão do projeto, e o checkout
atual inclui identidade do commit. O campo precisa continuar não vazio.
Nenhum outro metadado é excluído. Nos intermediários não há exceções:
comparam-se JSON canônicos preservando tipos numéricos e Parquet por colunas
e linhas ordenadas, sem exigir bytes iguais da compressão.

Hashes SHA-256 iguais nos dois diretórios:

| Arquivo | SHA-256 |
|---|---|
| `uv.lock` | `0cc9bf35522ace8a1ebb68143f1b3a2c094ef492dec527a5bae40b0970e0bcda` |
| `calculation-baseline.json` | `7ebef92162d91dd1cb18e669fb81d65adde05abf93083c61b22aad08148093c8` |
| `painel-contract.json` | `dc559fe8342729b7eb9a4d90f7188fe3df39dd55d95cfdd273546467e7368c3a` |
| `hpv-2026-contract.json` | `5613611f3708336511d04cb94f135ef2b754b1fbc8494e5f2ab9e0834e7dc9f6` |

`git diff 15c1629 32430ba -- docs/spec.md docs/adr site/public/dados uv.lock pipeline/tests/fixtures`
não tem diferenças. Spec, ADRs, dados publicados e expectativas foram preservados.

## Leitura independente final

O mantenedor aceitou explicitamente substituir o ensaio humano por leitura
independente por agente. O leitor começou sem histórico da conversa, recebeu
somente a tarefa de reconstruir os percursos pelo repositório e não recebeu
explicações do autor. Leu o código antes de consultar a caracterização.
Seu relatório é leitura, não execução de testes nem validação clínica.

### Entrada do Painel até os JSON

Ordem observada: `AGENTS.md` → `docs/development.md`, `docs/data-update.md`
e `docs/reproducibility.md` → seção Navegação do Painel →
`pipeline/sources/painel/source.py`, `models.py`, `calculation.py` → imports
para `acquisition.py`, `persistence.py`, `validation.py`, `export.py` →
`pipeline/publish.py`. Buscas por prazo e modalidade levaram à spec,
ao Glossário, às Fontes de dados e ao ADR 0003. O protocolo, registro e
`pipeline/__main__.py` permitiram conferir a entrada pela CLI.

O leitor explicou download DBC/duas tabelas TabNet; contagem em `clean`;
Parquet, data pelo mtime e páginas preservadas; carregamento territorial fora
do cálculo; `PainelResult` em memória; intermediários de camadas, perfis e
alertas; nova instância para validação/exportação; revalidação; incorporação
em `map/within_60_days/<tipo>.json`, `profiles/<UF>.json` e manifesto.
Identificou que a origem da camada escolhe a série do perfil e que a UF
oferece contexto/qualidade, sem ser um terceiro nível da cascata.

### Regra de prazo/modalidade até os efeitos

A spec e o ADR 0003 levaram a `acquisition.is_within_60_days` e `count_cases`;
`models.CHEMO_RADIO` identifica modalidades 2, 3 e 4. O leitor encontrou a
regra de até 60 dias e os tratamentos anteriores ao diagnóstico, seguiu
contagens persistidas até `calculation.py`, `cascade.py`, Tendência e Situação,
e distinguiu o denominador de quimio/radio do total usado em qualidade e
percentual sem informação. Localizou a exceção da próstata e os alertas
mensais. Concluiu corretamente que mudar a interpretação do prazo exige
refazer `clean`: `compute` não reinterpreta o campo bruto `TEMPO_TRAT`.

Os nomes levaram aos testes `test_painel_clean.py`, `test_painel_compute.py`,
`test_painel_validate.py`, `test_painel_monthly.py`, `test_painel_publish.py`
e `test_painel_state.py`. A tentativa de localizar
`test_pipeline_characterization.py` falhou; a caracterização apontou o nome
real, `test_calculation_baseline.py`, que o leitor então examinou.
A leitura adicional de `hpv/source.py`, persistência HPV, registro,
`update_plan.py` e `update.py` confirmou as referências dos três guias.

### Conhecimento exigido, dúvidas e limites

Foi necessário conhecer Protocol, dataclasses/NamedTuple, generators,
Parquet/DuckDB e imports relativos; não foi necessário conhecimento prévio
da arquitetura. Os nomes de coordenação e seus imports permitiram seguir as
responsabilidades. Não se usa quantidade de arquivos como medida de êxito.

O leitor identificou estas ressalvas, mantidas explícitas:

- A afirmação genérica de estatística somente em `compute` na spec §14 e
  em `Source.compute` não deve ser lida como remoção da contagem em `clean`.
  A #12 exige preservar `count_cases` nessa etapa; classificação e contagem
  dos registros antecedem o cálculo dos indicadores. Spec e ADRs não foram
  reescritos neste ticket.
- Os percursos anteriores na caracterização descrevem bases históricas com
  `painel.py`. Os percursos finais usam `painel/`; os títulos históricos foram
  explicitados para evitar procurar um arquivo removido.
- `publish_together` prepara todos os `.part` antes dos `replace` sequenciais.
  A evidência cobre bloqueio antes da publicação e o mecanismo existente;
  não comprova transação atômica diante de falha durante os `replace`.
- A leitura não demonstrou uma matriz exaustiva de formatos inválidos de prazo.
  Os testes existentes cobrem fronteiras e o resultado congelado.

Não restaram dúvidas bloqueantes para explicar etapas, localizar regra,
insumos, consumidores, efeitos e testes. Não foi identificado erro funcional
novo que exigisse correção ou ticket separado. Não houve aquisição nacional,
reprodução de uma Release pública, alteração de método/CLI, push ou deploy.
Os limites das Releases antigas permanecem nos guias de atualização e reprodução.

## Verificação final desta entrega

- Seleção idêntica no estado final: **57 passaram**, quatro casos novos
  desmarcados, 194 avisos, em 30,95 s; mesmos resultados da base.
- `UV_CACHE_DIR=/tmp/cancer-map-uv uv run pytest -q`: **242 passaram**,
  em 96,54 s, com 498 `PerfectSeparationWarning` do statsmodels nas séries
  sintéticas, sem falhas.
- `UV_CACHE_DIR=/tmp/cancer-map-uv uv run mypy`: **69 arquivos sem erros**.

Esta entrega acrescenta evidências e referências nos três guias, sem novo
comportamento de produção. A skill TDD foi consultada: as fronteiras
CLI/Source, atualização com snapshots e cálculo/exportação já estavam
acordadas na #13. Os testes existentes foram executados nessas fronteiras;
não foi criado teste que apenas espelhasse a organização dos arquivos.
