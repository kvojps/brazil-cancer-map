# Guia de desenvolvimento

## Caminho curto: rodar só o site

Para alterar páginas, estilos ou interações, basta o site: os JSON do
Contrato de dados já estão commitados em `site/public/dados/`. Não é preciso
instalar Python, baixar Fontes ou executar o pipeline.

Pré-requisitos: Git e **Node.js 24**, usado no deploy. O mínimo
declarado em `site/package.json` é `>=22.23.4`. Use o npm que acompanha o Node.
Os comandos abaixo partem da raiz do repositório:

```sh
git clone https://github.com/kvojps/brazil-cancer-map.git
cd brazil-cancer-map
npm ci --prefix site
npm run dev --prefix site
```

Abra a URL informada pelo Astro (normalmente `http://localhost:4321`; se a
porta estiver ocupada, ele escolhe outra). Nesta versão, `dev` inicia em
segundo plano. Para consultar ou encerrar o servidor:

```sh
npm run dev --prefix site -- status
npm run dev --prefix site -- stop
```

Para conferir os documentos estáticos que serão publicados:

```sh
npm run check --prefix site
npm run build --prefix site
npm run preview --prefix site -- --host 127.0.0.1 --port 4322
```

Abra a URL informada pela prévia, normalmente `http://127.0.0.1:4322`.
Nesta versão ela também inicia em segundo plano; encerre com
`npm run preview --prefix site -- stop` antes de reconstruir o site.
Se a porta escolhida for outra, ajuste `SITE_URL` nos testes abaixo.
Não rode builds simultâneos: eles compartilham `site/dist/`. `npm test`
também faz build; execute-o separado de `npm run build` e encerre a prévia
antes de rodá-lo.

A saída atual ocupa **cerca de 1 GB**, principalmente pelas páginas municipais.
Reserve espaço para o clone, dependências e essa saída. Veja a dívida de tamanho
na [spec, seção 17](spec.md#17-pendências).
Se o servidor de desenvolvimento encerrar por falta de memória do Node,
reinicie com um limite maior, desde que a máquina tenha memória disponível
(encerre antes qualquer instância ainda ativa com `dev -- stop`):

```sh
NODE_OPTIONS=--max-old-space-size=5120 npm run dev --prefix site
```

## Testes e verificações

Sem navegador:

```sh
npm run check --prefix site
npm test --prefix site
```

- `npm run check`: tipos e diagnósticos dos arquivos Astro e TypeScript.
- `npm test`: testes Node de contratos, dados publicados e lógica do site,
  incluindo enquadramento e tons do mapa. Não abre navegador.
- `uv run mypy`: tipos do pipeline Python em modo estrito.
- `uv run pytest`: suíte Python de processamento, cálculos, validações,
  contrato, atualização e Releases, com fixtures e serviços simulados.
  Não comprova uma nova carga das Fontes oficiais.

Para testes de navegador, instale **Chromium**, inicie uma prévia estática
como acima e, em outro terminal, rode:

```sh
cd site
npx playwright-core install chromium
export CHROMIUM_PATH="$(node --input-type=module -e 'import { chromium } from "playwright-core"; console.log(chromium.executablePath())')"
SITE_URL=http://127.0.0.1:4322 npm run test:browser
SITE_URL=http://127.0.0.1:4322 npm run test:a11y
```

Se já houver Chromium instalado, basta definir `CHROMIUM_PATH` com seu caminho
absoluto. O padrão dos testes é `/snap/bin/chromium`. Em Linux, a instalação
pode exigir bibliotecas de sistema; nesse caso, use `install --with-deps chromium`.
Os testes de zoom nativo exigem suporte a extensões locais.

`test:browser` cobre interações, navegação, recuperação de falhas, teclado,
responsividade, temas, JavaScript desativado e zoom, além dos testes de
acessibilidade. `test:a11y` seleciona os dois arquivos de auditoria automatizada:
axe nos documentos e consistência dos estados do mapa com os JSON.
Esses testes não substituem a revisão humana com leitor de tela.
Para a matriz completa, relatórios e execução de um arquivo por vez, veja
[os testes de navegador](../site/browser-tests/README.md).

**O repositório não tem CI**: nenhuma verificação roda automaticamente em push
ou pull request. Execute localmente as que cobrem a sua mudança antes de
publicá-la: `mypy` e `pytest` no pipeline; `check`, `build`, `npm test`,
`test:browser` e `test:a11y` no site.

## Caminho completo: trabalhar no pipeline

Use o pipeline para mudar processamento, cálculos ou o Contrato de dados.
Além de Node, instale **Python 3.14 ou superior** e **uv** (gerenciador de
dependências Python; a versão usada na verificação está ao fim deste guia).
Na raiz do clone:

```sh
uv sync --locked
npm ci --prefix pipeline
uv run python -m pipeline run --list
uv run mypy
uv run pytest
```

O Node também executa o mapshaper, fixado pelo lockfile de `pipeline/`.
Chromium só é necessário no pipeline para obter os agregados oficiais do HPV;
instale com `uv run playwright install chromium` ou configure `CHROMIUM_PATH`.
Ele também é usado pelos testes de navegador e medições do site, mas não
pelos comandos de tipos, testes Node, build ou prévia.

O diretório local `data/` ocupa **cerca de 4 GB** na máquina de referência,
além da saída do site. Isso não é teto nem requisito suficiente para baixar
tudo: arquivos temporários e Fontes volumosas podem exigir muito mais espaço
e tráfego. `data/raw/` e `data/clean/` ficam fora do git. A auditoria de
microdados do HPV é opcional e separada da atualização normal.

Antes de executar uma carga, consulte os pré-requisitos, insumos manuais e
validações em [Fontes de dados](data-sources.md), e o fluxo vigente na
[spec, seção 16](spec.md#16-atualização-e-operação). Não é preciso rodar
todas as Fontes para desenvolver. Para diagnóstico, o CLI permite selecionar
uma `source` e uma etapa; por exemplo, com os insumos dela já preparados:

```sh
uv run python -m pipeline run --source painel --step compute
```

Esse comando usa os caminhos locais e não prepara uma atualização isolada.
`run` sem filtros executa todas as etapas de todas as `source`s, inclusive
downloads e exportações. Para preparar dados para revisão, use o fluxo
`update` descrito na spec; uma carga completa não foi repetida para este guia.

## Arquitetura e nova `source`

`pipeline/` e `site/` se ligam somente pelo **Contrato de dados** em
`site/public/dados/`, definido na [spec, seção 15](spec.md#15-contrato-de-dados).
O pipeline entrega valores, classes de Tendência, Situação, origem na cascata
e faixa A/B/C prontos. O front os exibe, sem refazer estatística.
O método está na [Metodologia](https://brazil-cancer-map.kvojps.workers.dev/metodologia/)
e o vocabulário no [glossário](../GLOSSARY.md).

O protocolo [`Source`](../pipeline/source.py) define `name`, `download`,
`clean`, `compute`, `validate` e `export`. As etapas rodam nessa ordem;
uma exceção interrompe as etapas restantes daquela `source`. A estatística
fica em `compute`, com a exceção de limpeza do C55 registrada na
[spec, seção 14](spec.md#14-pipeline).

Para adicionar uma unidade de processamento (orientação pela leitura do código):

1. Crie o módulo em `pipeline/sources/` implementando o protocolo. Use uma
   `source` existente como exemplo; mantenha caminhos de estado e saída
   configuráveis para trabalhar em snapshots.
2. Acrescente uma `SourceDefinition` ao registro ordenado `SOURCE_DEFINITIONS`,
   em [`pipeline/sources/__init__.py`](../pipeline/sources/__init__.py), depois
   das entradas referenciadas. Declare `name`, `factory` e as relações abaixo.
   `create_sources` valida o registro e constrói as instâncias; `SOURCES`
   conserva a lista pública na mesma ordem.
3. A fábrica recebe o diretório de estado **da própria source**, o diretório
   de publicação e um mapa de insumos resolvidos no mesmo snapshot. Passe-os
   ao construtor por argumentos nomeados. Por exemplo,
   `inputs={'population_path': SourceInput('popsvs', 'population.parquet')}`
   resolve `clean/popsvs/population.parquet`; a fábrica usa
   `population_path=inputs['population_path']`. Não use um caminho global de
   população ao construir para outra cópia de trabalho.
   `inputs` apenas fornece arquivos, sem executar o produtor.
   `update_with=('popsvs',)` inclui a consumidora quando POPSVS é atualizado;
   `accept_with=('popsvs',)` une os participantes já selecionados para aceitar
   ou descartar juntos, sem ampliar a seleção. A malha declara
   `includes_all=True`: inclui todas as entradas, inclusive futuras, num grupo.
   O executor em [`pipeline/update.py`](../pipeline/update.py) lê essas relações,
   sem segunda lista de consumidores. Nomes duplicados, referências desconhecidas,
   ordem incompatível e caminhos de insumos fora do produtor são rejeitados
   antes da construção ou criação da saída. A ordem é declarada, sem ordenação
   automática. `run --source` e `run --step` continuam com seleção direta.
4. Teste as etapas com fixtures em `pipeline/tests/`, incluindo falha de
   validação e formato exportado. Execute o arquivo afetado com
   `uv run pytest pipeline/tests/<arquivo>.py`, depois `uv run mypy` e a suíte.
5. Se o contrato mudar, atualize a spec e seus consumidores no site. Registre
   insumos e validações em `data-sources.md` e método na Metodologia.

A base anterior à reorganização, os dois percursos de leitura da pipeline e o
procedimento de comparação com fixtures estão em
[Caracterização da pipeline](data/pipeline-characterization.md). Use essa base
para conferir cálculo, intermediários, documentos e orquestração em cada passo.

### Navegação do Painel

O import público é `pipeline.sources.painel.PainelSource`. Dentro de
`pipeline/sources/painel/`, `source.py` coordena as etapas; `acquisition.py`
obtém e interpreta DBC/TabNet e fornece a contagem usada na limpeza;
`models.py` define registros e recortes; `persistence.py` mantém os
intermediários; `calculation.py` calcula com dados em memória;
`validation.py` confere dados carregados; `export.py` monta os documentos.
Importe helpers do módulo responsável, sem passar pelo `__init__.py`.

`calculate(rows, monthly_counts, immediate_region_of)` retorna `PainelResult`
com camadas, séries de perfis e alertas mensais. Carregue a relação territorial
antes da chamada. Mapa e perfil usam a mesma origem decidida no cálculo.
`compute` carrega, calcula e persiste; `validate` e `export` podem rodar em
novas instâncias, usando o estado persistido. A exportação revalida antes da
publicação conjunta. Os comandos e caminhos de estado permanecem os mesmos.
Os dois percursos de leitura e a comparação congelada estão em
[Caracterização da pipeline](data/pipeline-characterization.md#depois-da-reorganização-do-painel-14).

### Navegação do HPV

O import público continua sendo `pipeline.sources.hpv.HpvSource`. No pacote
`pipeline/sources/hpv/`, `source.py` coordena as cinco etapas oficiais;
`models.py` define `HpvResult` e as linhas do Censo; `persistence.py` carrega
os insumos e conserva `computed.json`; `calculation.py` calcula em memória;
`validation.py` verifica dados carregados; `export.py` monta mapa e perfis.
A aquisição reutiliza `pipeline/hpv_official.py` e `pipeline/hpv_inputs.py`.

`calculate(official_cohorts, census_rows, immediate_region_of)` recebe as
coortes com proveniência e data de extração, o Censo carregado e a relação
territorial. Retorna período, Referência, municípios com origem e `series_id`
e séries por origem e sexo. A data de extração determina a consolidação.
Mapa e perfil usam a origem escolhida nesse resultado; exportação revalida
antes da publicação conjunta e preserva os outros indicadores.

A auditoria tem entrada própria em `pipeline.sources.hpv.audit.HpvAudit`,
usada por `hpv-audit`, com `download`, `clean` e `compute`. Mantém os arquivos
locais e não alimenta o cálculo oficial. Os comandos e opções do CLI continuam
iguais. Apenas `official.json` e `census.parquet` integram o estado público.
Veja os percursos e a comparação em
[Caracterização da pipeline](data/pipeline-characterization.md#depois-da-reorganização-do-hpv-15).

## Deploy: Cloudflare Workers

Configuração registrada no repositório, sem executar deploy nesta verificação:
o site usa Workers com assets estáticos, plano gratuito, ligado ao repositório.
Cada push na `main` executa, a partir de `site/`, `npm run build` com
`NODE_VERSION=24.20.0`, seguido de:

```sh
npx wrangler deploy --assets ./dist --name brazil-cancer-map --compatibility-date 2026-11-01
```

A publicação usa os JSON commitados e não executa o pipeline.

### Integração e publicação em lotes

A branch permanente `hml` reúne as mudanças das issues antes da publicação.
Branches de trabalho partem de `hml` e seus PRs têm `hml` como destino.
Execute localmente as verificações pertinentes antes de integrar cada mudança.
Integrar uma issue em `hml` não significa que ela já está disponível no site.

Para publicar, abra um PR de `hml` para `main`, confira o conjunto de mudanças
e execute as verificações pertinentes ao lote. O merge dispara o build e o
deploy de produção. Preserve `hml` após o merge e sincronize-a com `main`
antes de iniciar o próximo lote. Correções urgentes que entrarem diretamente
em `main` também precisam ser incorporadas à `hml`.

Para que os pushes em `hml` e nas branches de trabalho não consumam builds,
mantenha `main` como branch de produção e **desative os builds de preview**
em **Settings → Build → Branch control** do Worker na Cloudflare.
A configuração anteriormente registrada gerava previews nas outras branches
com `npx wrangler versions upload` e as mesmas flags do deploy.
Em 12/11/2026, o mantenedor confirmou que somente `main` dispara builds;
o painel não foi inspecionado pelo agente. Criar `hml` por si só não altera
essa configuração.

O fluxo usa validação local enquanto os previews automáticos estiverem
desativados. No próximo merge em `main`, confira que o lote foi publicado
normalmente.
Veja o [controle de branches do Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/).

## Contribuir

Abra uma [GitHub Issue](https://github.com/kvojps/brazil-cancer-map/issues)
para relatar problema ou propor mudança. Issues e specs de trabalho são
acompanhadas no próprio GitHub, conforme
[as convenções do tracker](agents/issue-tracker.md). Descreva contexto,
resultado esperado e critérios de aceite. Vincule o PR à issue com
`Closes #<n>` quando aplicável. Decisões permanentes e evidências necessárias
ficam na spec, nos ADRs e em `docs/`.

Antes de alterar uma regra, leia a seção pertinente da [spec](spec.md) e os
[ADRs](adr/). Use os termos do [glossário](../GLOSSARY.md). Código, nomes de
arquivo, testes, comentários, docstrings e commits ficam em inglês; textos
públicos e documentos ficam em português. Mantenha comandos e pré-requisitos
deste guia coerentes com as mudanças que fizer.

Ao escrever documentação, só apresente como garantido o que foi executado, e
marque como tal o que veio da leitura do código. Os guias não repetem método:
fórmulas, classes de Tendência, Referências e ressalvas ficam em `/metodologia/`,
conceitos ficam no [glossário](../GLOSSARY.md) e limiares operacionais ficam em
[Fontes de dados](data-sources.md).

Contribuições entram sob a licença da parte alterada, **sem CLA**:
código sob [AGPL-3.0-or-later](../LICENSE); textos do projeto sob
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br), com
atribuição ao Observatório. Dados de terceiros seguem as condições de cada
Fonte; os arquivos gerados não recebem a licença do código. Veja o
[ADR de licenças](adr/0007-licenses.md).

## Verificação deste guia

Em 06/11/2026, o caminho foi seguido em um clone local limpo, sem `data/`,
`node_modules` ou ambiente Python herdados, no Linux, com Node 24.20.0,
Python 3.14.4 e uv 0.13.7. O clone usou `git clone --local --no-hardlinks`
a partir do repositório existente; o download do clone via GitHub não foi
repetido. O modo sem hardlinks foi necessário entre sistemas de arquivos.

Foram executados `npm ci` nos dois projetos, `uv sync --locked`, `run --list`,
`dev` (página inicial respondeu HTTP 200), `check` (sem diagnósticos), `mypy`
(48 arquivos), `pytest` (173 testes) e `npm test` (87 testes). O build isolado
concluiu 5.574 páginas em cerca de 22 s, com saída de 962 MiB nesta execução.
O volume de cerca de 4 GB de `data/` foi medido na máquina de referência,
sem baixar as Fontes novamente.

A execução corrigiu o texto: servidores iniciam em segundo plano, portas
ocupadas fazem o Astro escolher outra e `npm test` também gera o build.
Uma tentativa com build e testes simultâneos falhou por conflito de arquivos;
a repetição sequencial passou. As restrições do sandbox exigiram liberar
cache, subprocessos e servidores locais para verificar alguns comandos.
`uv run pytest` usou cache temporário via `UV_CACHE_DIR`.

A instalação do Chromium com `npx playwright-core install chromium` e a
obtenção de seu caminho pelo Node foram executadas. A prévia estática foi
iniciada na porta 4324, escolhida pelo Astro porque a solicitada estava
ocupada. `test:a11y` passou com 84 testes; o axe não encontrou violações,
mas registrou verificações inconclusivas que exigem revisão humana.
A suíte completa `test:browser`, as cargas das Fontes, o exemplo de `compute`
e o deploy não foram executados nesta verificação; suas instruções descrevem
o código e a configuração registrados no repositório.
