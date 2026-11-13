# Restauração da referência de validação da malha

## Código, estado e comparação

A implementação da [issue #3](https://github.com/kvojps/brazil-cancer-map/issues/3)
parte de `a33ca2b1594f44e51a64d71ac6df2a69f912990a`.
`pipeline/sources/mesh.py` passa a copiar a lista municipal do cache bruto
para o diretório limpo durante `clean`. A validação e a exportação usam
somente essa cópia. O protocolo de `source`, o método da malha, o contrato e
o agrupamento de dependências não mudam.

O snapshot contém `mesh/municipalities.json`, `mesh/municipalities.topojson`
e `mesh/ibge_municipalities.json`. Os mecanismos existentes `copy_state`,
`export_state` e `restore_state` já preservam o diretório da malha; não houve
necessidade de incluir o diretório bruto nem criar outro formato de asset.

A referência independente `pipeline/tests/fixtures/mesh-contract.json` foi
gerada com o código base, antes da alteração. Contém índice municipal,
TopoJSON e um manifesto mínimo mantido pela malha, que não tem Indicador
próprio nem reescreve `pipeline_version`. O valor `fixture-baseline` identifica
o manifesto sintético, não uma publicação real. Nenhum campo é normalizado
ou ignorado na comparação.

A entrada é uma fixture sintética: um quadrado com os atributos de Pelotas,
em shapefile dentro de `mesh-input.zip`, e uma lista de localidades em
`mesh-reference.json`, no formato da API do IBGE. A geometria não representa
a malha real de Pelotas. O shapefile foi produzido com o mapshaper fixado no
projeto; não há download durante a prova.

SHA-256 dos arquivos de fixture:

| Arquivo | SHA-256 |
|---|---|
| `mesh-contract.json` | `54ff903e69d8de75428a5ef5d9f7eab25d40e56f24aa132349b50c85c5e1b420` |
| `mesh-input.zip` | `6cde4a519c4bc07c72e1e5ab4017891bda1990efb66aa953aaa2c5050ab36612` |
| `mesh-reference.json` | `c34059d599ee1e661276f1543b9fffc96310d9e8567a1fa81b8745b92820f850` |

## Prova automatizada

`pipeline/tests/test_mesh_state.py` usa `main`, a entrada pública da CLI:

1. Executa `clean`, `compute`, `validate` e `export` com os insumos de fixture.
2. Altera a referência bruta depois da validação, para detectar um eventual
   reempacotamento da lista errada. Acrescenta um extrato bruto e insumos de
   auditoria HPV que não devem aparecer nos assets.
3. Executa `export-release --state-dir` e verifica os três arquivos do asset
   da malha. Remove todo o diretório original, incluindo bruto, limpo e contrato.
4. Bloqueia conexões de rede, restaura estado e contrato em outro diretório
   com `restore-state` e `restore-release`, e cria as `source`s pelo registro.
5. Executa `compute`, `validate` e `export` da malha restaurada. Compara todos
   os documentos por serialização JSON canônica, preservando números inteiros
   e decimais, códigos em texto, tipos e metadados, sem exigir bytes idênticos.

Antes da correção, o teste falhou pela ausência de
`mesh/ibge_municipalities.json` no asset. Depois da correção, passou.

Outros testes removem ou corrompem a referência e mudam a Região imediata:
`validate` e `export` falham e preservam o contrato anterior. Um snapshot de
atualização independente mantém sua própria cópia mesmo após alterações nos
insumos originais. Uma falha de download da malha impede todo o grupo de
dependentes e mantém contrato e estado anteriores. O limite dos assets é
exercitado com teto reduzido para não criar arquivos de GiB. Os testes da
malha mantêm as rejeições de município ausente, desconhecido, sem geometria
e com Região imediata incorreta; as regras não foram relaxadas.

Comandos, na raiz, com Python 3.14+, `uv sync --frozen`, Node e
`npm ci --prefix pipeline` para preparar a fixture com mapshaper:

```bash
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest pipeline/tests/test_mesh_state.py pipeline/tests/test_mesh_publish.py pipeline/tests/test_mesh_build.py pipeline/tests/test_release.py pipeline/tests/test_cli.py
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run mypy
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest
```

Em 12/11/2026, a suíte completa passou: **194 testes**, em 90,32 s,
com 274 avisos `PerfectSeparationWarning` do statsmodels nas fixtures.
`mypy` passou em modo estrito nos 49 arquivos. Os testes direcionados da
malha e os de Release/CLI também passaram.

## Limites

A garantia vale para estados preparados pelo fluxo corrigido e o código
correspondente. A lista precisa vir da Fonte independente usada na
publicação, nunca ser reconstruída a partir da própria malha. A preparação
inicial exige mapshaper; as três etapas de recálculo da malha restaurada não
o executam. Não é necessário navegador nem rede para essas três etapas.

Esta prova usa uma fixture pequena; não repete uma carga nacional nem a
reprodução de uma Release pública. `data-2026-11-06` continua sem a lista
municipal no estado e seu código gerador continua procurando-a no cache
bruto. Um estado antigo com o código atual exige fornecer a referência
correspondente no diretório limpo. O estado não adivinha o conteúdo ausente.
`data-2026-11-05` continua sem estado. O limite de insumos externos do Painel
permanece. Nenhuma Release existente, JSON público, Versão de dados ou deploy
foi alterado ou publicado.
