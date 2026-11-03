# Observatório do Câncer no Brasil

Dados sobre o câncer no seu município, para entender e agir.

Um mapa estático dos 5.571 municípios brasileiros (malha IBGE 2025) que reúne prevenção, detecção precoce, acesso ao tratamento e panorama do câncer, e liga cada dado a uma ação concreta.

**Site:** <https://brazil-cancer-map.kvojps.workers.dev>

## Publicação

O site é publicado pelo Cloudflare Workers (assets estáticos, plano gratuito), ligado a este repositório. Cada push na `main` roda, a partir de `site/`, o build `npm run build` e o deploy `npx wrangler deploy --assets ./dist --name brazil-cancer-map --compatibility-date 2026-11-01`, com `NODE_VERSION=24.20.0`. Pushes em outras branches geram versões de preview com `npx wrangler versions upload` e as mesmas flags. Os dados vêm dos JSON já commitados em `site/public/dados/`: o deploy não roda o pipeline.

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
