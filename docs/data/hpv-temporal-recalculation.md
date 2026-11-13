# Recálculo temporal do HPV

## Código, estado e referência

A implementação da issue [#2](https://github.com/kvojps/brazil-cancer-map/issues/2)
parte do commit `0755266acc6b332df1d4564906da77e04c53af32`.
O cálculo está em `pipeline/sources/hpv/calculation.py`, coordenado por
`pipeline/sources/hpv/source.py` (antes da #15, `pipeline/sources/hpv.py`), com testes em
`pipeline/tests/test_hpv.py`. Não altera método estatístico, interface do site,
Releases existentes ou dados commitados.

O estado necessário já existia: `official.json` contém `years`,
`extracted_at`, proveniência e agregados oficiais; `census.parquet` contém os
recortes do Censo 2022. O empacotamento e a restauração existentes preservam
ambos. Extratos mensais, histórico de pacientes e auditoria opcional ficam
fora dos assets.

`years` deve ser uma lista contínua de inteiros desde 2020, sem duplicatas,
lacunas ou anos posteriores à extração. O ano de `extracted_at` é o contexto
temporal: quando presente na série, permanece provisório. O último ano
anterior a ele determina a Situação. Uma série encerrada antes da extração
pode ter todos os anos consolidados. Registros fora da história declarada
causam erro, assim como recortes obrigatórios ausentes. As conferências de
Censo, cobertura e referências oficiais continuam ativas.

A referência independente é
`pipeline/tests/fixtures/hpv-2026-contract.json`, gerada **antes da mudança**
com o código base e o relógio fixado em 12/11/2026. Ela usa `prepared_source`
com história 2020–2026, três municípios fictícios e referências de cobertura
transcritas na fixture. Contém cinco documentos completos: índice municipal,
manifesto, dois mapas e perfil de RO. Seu SHA-256 é
`5613611f3708336511d04cb94f135ef2b754b1fbc8494e5f2ab9e0834e7dc9f6`.
O teste não regenera a referência com o código sob teste.

## Prova automatizada

O teste `test_restored_state_reproduces_the_independent_2026_contract`:

1. Prepara os agregados e o Censo em diretório temporário, junto de insumos de
   auditoria que devem ser excluídos.
2. Executa `export_state` e `restore_state`, verificando que o estado HPV
   restaurado contém somente `official.json` e `census.parquet`.
3. Instancia uma nova `HpvSource`, sem configurar anos, e executa `compute`,
   `validate` e `export` com relógio simulado em março de 2026, 2027 e 2030.
   Tentativas de download dos insumos causam falha no teste.
4. Compara todos os documentos JSON com a referência, por serialização
   canônica, que distingue inteiros, decimais, booleanos e nulos. Valores,
   período, anos provisórios, último consolidado e proveniência são iguais.
   `pipeline_version` recebe explicitamente a versão do código executado:
   não se atribui o resultado ao código antigo.

Antes da correção, 2026 passou, e 2027 e 2030 falharam: 2026 deixava de ser
provisório. Depois da correção, os três casos passaram. O teste de história
truncada também falhou antes de rejeitarmos registros fora dos anos declarados.

Testes adicionais verificam ausência de ano interno, município ou sexo,
data inválida, anos posteriores à extração e história truncada. Uma nova
coleta simulada em 2027 solicita 2020–2027, mesmo com instância preparada para
um estado anterior. A coleta é simulada na fronteira com a Fonte; não houve
nova consulta real ao painel.

O teste de falha no snapshot usa `update_sources` com os agregados de fixture.
A validação rejeita a amostra incompatível com as referências de produção;
o contrato e o estado de entrada e da proposta permanecem iguais aos
anteriores. Os testes existentes mantêm as verificações de denominador,
cobertura, referências, exportação inválida e isolamento entre grupos.

Comandos, na raiz do repositório:

```bash
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest pipeline/tests/test_hpv.py
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest pipeline/tests/test_release.py pipeline/tests/test_cli.py
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run mypy
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest
```

Em 12/11/2026, os testes direcionados passaram e a suíte Python completa
concluiu com **185 testes aprovados**, em 87,26 s. Houve 274 avisos
`PerfectSeparationWarning` do statsmodels nas fixtures estatísticas.
`mypy` passou em modo estrito nos 48 arquivos. A revisão do diff desde
`0755266` não encontrou achados nos eixos Standards e Spec.

## Limites

Esta é uma prova com fixtures e datas simuladas, não uma nova carga nacional
ou reprodução dos assets públicos. As Releases existentes não foram
alteradas; nenhuma nova Versão de dados foi publicada e não houve deploy.
O código gerador de `data-2026-11-06` continua com sua dependência do relógio;
a correção não modifica retroativamente aquele commit. Estados sem data
válida ou história completa são rejeitados. Os insumos externos de `mesh`
e `painel` continuam fora do escopo desta entrega.
