# Testes do site

Use Git, Node.js 24 (mínimo `22.23.4`) e as dependências de
`npm ci --prefix site`. Os JSON publicados já estão no repositório.
Para instalar e rodar o site, veja o [guia de desenvolvimento](../../docs/development.md).
As decisões de apresentação ficam no [contrato de interface](../../docs/ui-contract.md).

## Node e integração

Execute na raiz do repositório.

| Comando | Cobertura |
| --- | --- |
| `npm run check --prefix site` | Diagnósticos de Astro e TypeScript. |
| `npm test --prefix site` | Node seguido de integração. |
| `npm run test:unit --prefix site` | Lógica, estado, renderização e tons. |
| `npm run test:integration --prefix site` | Dados publicados, HTML estático e servidor de desenvolvimento. |

Node e integração dispensam Chromium e insumos do pipeline. A integração
gera o build em `site/dist/` e inicia seu próprio servidor de desenvolvimento.
Reserve cerca de 1 GB para a saída. Antes de executá-la, encerre qualquer
prévia do projeto. Execute o build e a integração em momentos distintos.

Para executar um arquivo na raiz:

```sh
node --test site/tests/node/map-tones.test.mjs
node --test site/tests/integration/municipality.test.mjs
```

### Tons do mapa

`npm run check:tones --prefix site` confere separadamente as distâncias da
paleta nos dois temas. Os testes de tons também fazem parte de `test:unit`.

## Navegador

Use Chromium com suporte a extensões locais para os testes de zoom nativo.
Defina `CHROMIUM_PATH` com o caminho absoluto para usar o mesmo executável
em toda a suíte. A maioria dos arquivos usa `/snap/bin/chromium` por padrão.
Para instalar e selecionar o Chromium do Playwright, execute na raiz:

```sh
cd site
npx playwright-core install chromium
export CHROMIUM_PATH="$(node --input-type=module -e 'import { chromium } from "playwright-core"; console.log(chromium.executablePath())')"
cd ..
```

No Linux, se faltarem bibliotecas de sistema, use
`npx playwright-core install --with-deps chromium` em `site/`.

Gere a saída estática ou use a saída deixada pela integração, se estiver
atualizada. Inicie a prévia em outro terminal, a partir da raiz:

```sh
npm run build --prefix site
npm run preview --prefix site -- --host 127.0.0.1 --port 4322
```

Com a prévia disponível, execute no terminal com `CHROMIUM_PATH` definido.
Ajuste `SITE_URL` se o Astro informar outra porta.

```sh
export SITE_URL=http://127.0.0.1:4322
npm run test:browser --prefix site
npm run test:a11y --prefix site
node --test site/tests/browser/municipality.test.mjs
```

`test:a11y` seleciona `accessibility.test.mjs` e
`map-state-accessibility.test.mjs`, ambos incluídos em `test:browser`, e
roda um arquivo por vez. Use `A11Y_REPORT_DIR` para guardar os relatórios
do axe, incluindo as verificações inconclusivas.

`test:browser` roda dois arquivos ao mesmo tempo. Com essa concorrência, a
suíte completa levou cerca de 11 minutos e ocupou perto de 4 GB de memória
além do que a máquina já usava. Para outra concorrência, chame o Node
direto. Passar a opção pelo npm, depois de `--`, não funciona, porque ela
chega depois dos arquivos e o Node a ignora.

```sh
node --test --test-concurrency=4 site/tests/browser/*.test.mjs
```

Use `--test-concurrency=1` se a concorrência 2 de `test:browser` atingir
os limites de tempo.

Ao terminar, use `npm run preview --prefix site -- stop`.

Uma sub-issue roda só os browser-tests listados no ticket; a suíte completa
roda uma vez, no fechamento da issue pai. Veja a
[verificação do site em dois níveis](../../docs/development.md#verificação-do-site-em-dois-níveis).

A [spec](../../docs/spec.md#17-pendências) registra a sessão pendente com
leitor de tela.
