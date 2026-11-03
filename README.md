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

Onde se tratar usa `uv run python -m pipeline run --source cnes`, depois da malha publicada. O CNES seleciona o último mês comum às 27 UFs, baixa os DBC HB/ST e o `TAB_CNES.zip` auxiliar para obter os nomes dos hospitais. Na carga inicial de setembro de 2026, o auxiliar acrescentou cerca de 123 MB aos DBC; o cache evita baixá-lo novamente enquanto tamanho e data forem iguais. A proximidade é aproximada entre centroides municipais, sem rotas, e as contagens de habilitações por UF bloqueiam uma publicação fora das faixas documentadas na metodologia. Uma falha mantém a publicação anterior.

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

## Denominadores populacionais

Rode `uv run python -m pipeline run --source popsvs` para baixar os ZIP anuais
`POPSBR00.zip` a `POPSBR25.zip` do DATASUS com cache por tamanho e data e gerar
`data/clean/popsvs/population.parquet`. A fonte fornece município de seis dígitos,
ano, sexo (1 masculino, 2 feminino), idade (0–79 e 80 para 80+) e população.
As etapas de cálculo consultam `pipeline.population.Population.get` ou sua
variante em lote `get_many`: os limites
de idade são inclusivos e o retorno informa o ano usado e se é provisório.
Só a ausência do arquivo anual permite usar o ano imediatamente anterior;
município ausente gera erro, sem reconstruir sua história ou alterar o de origem.
Na consulta em lote, anos anteriores ao primeiro registro municipal são omitidos;
ausências posteriores e recortes incompletos geram erro, sem fallback indevido.

A validação exige 162 células distintas por município e ano, as 27 UFs e total
nacional entre 160 e 230 milhões em cada ano disponível. Para cada UF, aceita
45% a 155% do total aproximado de 2022 registrado em `STATE_BASELINES`, uma
faixa ampla para 2000–2025 que detecta cargas incompletas e duplicações, sem
pretender reproduzir taxas oficiais. A série MS/SVSA foi revista pós-Censo 2022:
publicações anteriores a 2025 usavam estimativas que superestimavam a população
em cerca de 5,8% e não devem ser usadas como alvo de igualdade. A conferência
de taxas deve usar o TabNet atual. Veja a [pesquisa e fontes da decisão](.scratch/mapa-cancer-br/research/13-denominador-populacional.md).
Os dados são públicos (Decreto 8.777/2016), sem licença explícita no FTP;
cite Ministério da Saúde/SVSA/CGIAE, ano e extração. POPSVS não substitui o
Censo 2022 fixo no indicador de HPV. A população sozinha não gera indicador
nem arquivo para o site.

## Mamografia (SISCAN)

Com a malha publicada e o POPSVS limpo, rode
`uv run python -m pipeline run --source siscan`. O download já reduz um CSV
anual por vez com DuckDB e apaga o bruto, mantendo contagens e metadados em
`data/clean/siscan/exams/`. A etapa `clean` também aceita CSVs previamente
baixados em `data/raw/siscan/`. Tamanho e data remotos iguais aos do agregado
permitem reaproveitá-lo sem guardar o CSV. São exigidos os dez anos 2016–2025.

A razão é exames de rastreamento em mulheres de 50–69 anos divididos pela
metade da população feminina dessa idade. O mínimo da cascata conta exames.
Mama e Todos compartilham os dados; valores acima de 2 recebem nota, e valores
fora de 0–10 bloqueiam a publicação (limiares operacionais, não oficiais).
A validação também confere a presença dos municípios da malha e as séries.
Os detalhes de campos, fórmula, Tendência, limitações e da diferença para a
orientação atual de 50–74 estão em `/metodologia/#mamografia` no site.
