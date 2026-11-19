# Guia de desenvolvimento

## Caminho curto para rodar o site

Instale Git e **Node.js 24**, a versão usada no deploy. O mínimo declarado
em `site/package.json` é `>=22.23.4`. Os JSON do Contrato de dados já estão
no repositório, então editar páginas, estilos e interações exige apenas o site.

```sh
git clone https://github.com/kvojps/brazil-cancer-map.git
cd brazil-cancer-map
npm ci --prefix site
npm run dev --prefix site
```

Abra a URL informada pelo Astro, normalmente `http://localhost:4321`. Use
`npm run dev --prefix site -- status` para consultar o servidor e
`npm run dev --prefix site -- stop` para encerrá-lo. Se substituir os JSON
de perfis por UF, reinicie o servidor para recarregar os dados municipais.

## Trabalhar no pipeline

Instale também **Python 3.14 ou superior** e **uv**. Execute da raiz:

```sh
uv sync --locked
npm ci --prefix pipeline
```

O Node executa o mapshaper fixado no lockfile de `pipeline/`. A aquisição
dos agregados oficiais do HPV requer Chromium. Instale com
`uv run playwright install chromium` ou configure `CHROMIUM_PATH`.

Para rodar a pipeline completa, prepare os [insumos e pré-requisitos por Fonte](data-sources.md)
e execute na raiz:

```sh
uv run python -m pipeline run
```

Esse comando executa todas as etapas de cada `source` registrada, da aquisição
à exportação dos JSON em `site/public/dados/`. Há exceções: `vigitel` exige
o arquivo local obtido antes com `./download-vigitel.sh` ou indicado em
`VIGITEL_INPUT_PATH`, e `inca` publica a edição transcrita e versionada, sem
adquirir uma nova. Veja as [`source`s com fluxo parcial](architecture.md#sources-com-fluxo-parcial).
Para preparar uma proposta isolada, use [`update`](data-update.md).

| Comando | Quando usar |
| --- | --- |
| `uv run python -m pipeline run --list` | Consultar as etapas e as `source`s disponíveis sem executá-las. |
| `uv run python -m pipeline run --source painel --step compute` | Executar só o cálculo de `painel`, com os insumos já preparados. |

## Testes e verificações

Da raiz do repositório:

| Comando | Cobertura |
| --- | --- |
| `uv run mypy` | Tipos do pipeline Python. |
| `uv run pytest` | Pipeline com fixtures e serviços simulados. |
| `npm run check --prefix site` | Tipos e diagnósticos de Astro e TypeScript. |
| `npm test --prefix site` | Testes Node, dados publicados, build e servidor de desenvolvimento. |

Use `uv run pytest pipeline/tests/<arquivo>.py` para testar um módulo do
pipeline. O [guia de testes do site](../site/tests/README.md) reúne os
pré-requisitos de Chromium e os comandos para arquivos individuais, prévia
estática e verificações automatizadas de acessibilidade.

Execute as verificações pertinentes antes de integrar a mudança. O
repositório depende dessas verificações locais.

## Contribuir

Registre problemas e propostas no [tracker](agents/issue-tracker.md).
Antes de alterar uma regra, consulte a [spec](spec.md), os [ADRs](adr/)
e o [glossário](../GLOSSARY.md). Use inglês no código e nos commits e
português nos documentos e nos textos públicos.

Para trabalhar em uma `source`, comece pela [arquitetura da pipeline](architecture.md).
Crie a unidade como pacote em `pipeline/sources/<nome>/`, com a classe em
`source.py` reexportada pelo `__init__.py` e os dados versionados que só ela lê.
Registre-a em [`pipeline/registry.py`](../pipeline/registry.py),
com caminhos de estado, insumos e saída do mesmo snapshot. Cubra com fixtures o Contrato de dados e a preservação da
saída vigente em caso de falha. Veja os exemplos de registro, validação e
fixtures na [verificação da reorganização](https://github.com/kvojps/brazil-cancer-map/blob/04c2e4921f8b21f449b9f30601e900b9a12352a2/docs/data/pipeline-reorganization-verification.md).
Os relatos de setup em clone limpo e de execução com fixtures de SISCAN e
HPV estão no [histórico do guia](https://github.com/kvojps/brazil-cancer-map/blob/72e8b7ed10b15a58f65b7f4dd545712ee7f81f83/docs/development.md).

As branches de trabalho partem de `hml` e os PRs têm `hml` como destino.
Vincule o PR à issue com `Closes #<n>`, quando aplicável. A produção é
publicada pelo merge de `hml` para `main`. Depois do merge, sincronize
`hml` com `main`, incluindo correções que entraram diretamente em produção.

O Cloudflare Workers usa `NODE_VERSION=24.20.0` e roda `npm run build` em
`site/`, seguido do comando abaixo. Mantenha `main` como branch de produção
e os builds de preview desativados em **Settings → Build → Branch control**.

```sh
npx wrangler deploy --assets ./dist --name brazil-cancer-map --compatibility-date 2026-11-01
```

As [licenças do projeto](../README.md#licenças) se aplicam às contribuições.
