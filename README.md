# Observatório do Câncer no Brasil

Dados sobre o câncer no seu município, para entender e agir.

Um mapa estático dos 5.570 municípios brasileiros que reúne prevenção, detecção precoce, acesso ao tratamento e panorama do câncer, e liga cada dado a uma ação concreta.

## Estrutura

- `pipeline/`: baixa, limpa, calcula, valida e exporta os dados (Python).
- `site/`: o site estático (Astro), que só exibe os dados já calculados.

## Como rodar

Pipeline (requer [uv](https://docs.astral.sh/uv/)):

```sh
uv sync
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
