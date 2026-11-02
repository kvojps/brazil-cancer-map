# Hospedagem estática e mapa municipal

Pesquisa do ticket `issues/03-hospedagem-e-mapa-estatico.md`. Data da verificação: **2026-11-02**.
Método: documentação oficial do GitHub, da Cloudflare, do Protomaps/PMTiles, da MapLibre e do DuckDB, arquivos de licença nos repositórios, FTP de geociências do IBGE e a API de malhas do IBGE. Os tamanhos de geometria e de dados foram **medidos localmente**: baixamos a Malha Municipal 2025, simplificamos com mapshaper 0.6.121 e geramos dados sintéticos com DuckDB 2.0. O passo a passo está na seção "Como os números foram medidos".

## Resumo

- **Cabe com folga no plano gratuito.** O site inteiro (geometria e dados de 25 anos × 10 indicadores) fica perto de **3 a 6 MB comprimidos**. O GitHub Pages permite 1 GB, e a Cloudflare Pages permite 20.000 arquivos de até 25 MiB cada.
- **Geometria:** a malha do IBGE simplificada para TopoJSON tem **0,5 a 0,9 MB em gzip**. Esse tamanho dispensa PMTiles e vector tiles no MVP.
- **Mapa:** use **MapLibre GL JS** (BSD-3) com uma fonte GeoJSON local e `feature-state`. Não precisa de chave de API nem de tiles pagos, e o mapa base é opcional.
- **Dados:** para o navegador, use JSON por indicador (ou um Parquet lido com uma biblioteca leve). O **DuckDB-WASM** é exagero para o MVP: o `.wasm` tem 35,7 MB brutos e passa do limite de 25 MiB por arquivo da Cloudflare Pages se for auto-hospedado.

---

## 1. Limites de hospedagem

| Item | GitHub Pages | Cloudflare Pages (Free) |
|---|---|---|
| Tamanho do site publicado | **1 GB** (máximo) | Não há limite total publicado; vale o limite de arquivos |
| Tamanho do repositório | Recomendado ≤ 1 GB (fonte do Pages); GitHub recomenda < 1 GB e "fortemente" < 5 GB | — (o build pode vir de qualquer repo Git ou de upload direto) |
| Tamanho por arquivo | Git avisa a partir de 50 MiB e **bloqueia acima de 100 MiB** (sem LFS) | **25 MiB por asset** |
| Número de arquivos | Sem limite publicado | **20.000 arquivos por site** |
| Banda | Limite *soft* de **100 GB/mês** | "requests to static assets are free and unlimited" (plano Free e pagos) |
| Builds | Limite *soft* de 10 builds/hora, que **não vale** com workflow próprio do GitHub Actions | **500 builds/mês**, 1 build por vez |
| Timeout | Deploy expira após **10 min** | Build expira após **20 min** |
| Range requests (necessário para PMTiles/Parquet remoto) | Sim. Testado: `HTTP/2 206` com `content-range` em um site `*.github.io` | Não documentado na página de limites. A Protomaps recomenda **R2** para PMTiles, não Pages |
| Compressão | gzip servido automaticamente (testado: `content-encoding: gzip`) | Automática na CDN da Cloudflare |
| Uso proibido | Hospedagem gratuita para negócio, e-commerce ou SaaS; transações sensíveis | — |
| Outros | 1 site de usuário/organização por conta; pode responder 429 | 100 domínios custom por projeto; `_headers` (100 regras) e `_redirects` (2.100 regras) |

Fontes:
- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Arquivos grandes no GitHub: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Pages, assets estáticos gratuitos e ilimitados: https://developers.cloudflare.com/pages/functions/pricing/
- Protomaps sobre GitHub Pages e R2: https://docs.protomaps.com/pmtiles/cloud-storage

**Leitura:** um site de cidadão com ~5 MB por visita esgota os 100 GB/mês do GitHub Pages só com **~20.000 visitas completas por mês**. O limite é *soft* (o GitHub avisa, não corta na hora), mas a Cloudflare Pages não tem teto de banda para estáticos. Com o cache HTTP do navegador, revisitas custam quase nada.

---

## 2. Malha municipal do IBGE

### Fonte oficial

- **Malha Municipal Digital (MMD) 2025** em shapefile, no FTP de geociências:
  `https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/Brasil/BR_Municipios_2025.zip`
  (237 MB zip, gravado em 26/02/2026; o `.shp` tem 320 MB). Há também a edição 2024 (`municipio_2024/`, 199 MB) e recortes por UF (`municipio_2025/UFs/`).
- Medido: **5.573 polígonos**, sendo **5.571 municípios** (inclui Brasília/DF e Fernando de Noronha) e **2 "Áreas Operacionais"** (Lagoa Mirim `4300001` e Lagoa dos Patos `4300002`), que **devem ser filtradas** porque não têm dado de saúde.
- Atributos: `CD_MUN` (código de 7 dígitos, chave de junção com DATASUS, que usa 6 dígitos sem o verificador), `NM_MUN`, `SIGLA_UF`, `CD_RGI`/`CD_RGINT` (regiões imediatas e intermediárias, úteis para agregar municípios pequenos), `AREA_KM2`. CRS: SIRGAS 2000 geográfico (lon/lat).
- **Termos de uso:** o `LEIA-ME.txt` do zip remete à "Nota Metodológica: Informações técnicas e legais para a utilização dos dados publicados" (versão 2025), em https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html. A página retornou 403 para acesso automatizado, então os termos exatos **não foram lidos**. Os dados do IBGE são públicos com citação obrigatória (ver também o ticket 01 sobre o Decreto 8.777/2016).
- **Atalho já simplificado:** a API de malhas v3 do IBGE devolve GeoJSON pronto.
  `https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=minima`
  Medido: **3,6 MB**, 5.570 feições, só a propriedade `codarea`. Documentação: https://servicodados.ibge.gov.br/api/docs/malhas?versao=3. Serve para protótipo, mas a geometria é simplificada por polígono (sem topologia), o que pode abrir frestas entre vizinhos. Para produção, é melhor simplificar o shapefile oficial com mapshaper.

### Simplificação medida (mapshaper, `-simplify weighted keep-shapes`)

TopoJSON com `quantization=1e5` e propriedades `CD_MUN`, `NM_MUN` e `SIGLA_UF`. GeoJSON com precisão de 4 casas e só `CD_MUN`.

| % de vértices mantidos | TopoJSON bruto | TopoJSON gzip | TopoJSON brotli | GeoJSON bruto | GeoJSON gzip |
|---|---|---|---|---|---|
| 10% | 8,67 MB | 2,17 MB | 1,83 MB | 40,15 MB | 10,76 MB |
| 5% | 5,30 MB | 1,43 MB | 1,22 MB | 20,70 MB | 5,89 MB |
| 2% | 2,96 MB | 0,86 MB | 0,74 MB | 9,06 MB | 2,72 MB |
| **1%** | **2,10 MB** | **0,63 MB** | **0,53 MB** | 5,18 MB | 1,56 MB |
| 0,5% | 1,68 MB | 0,50 MB | 0,41 MB | 3,24 MB | 0,94 MB |

- O TopoJSON é 2,5 a 4,5 vezes menor que o GeoJSON porque guarda as fronteiras compartilhadas uma só vez. Além disso, simplificar a topologia **não abre buracos entre municípios vizinhos**.
- No navegador, `topojson-client` (ISC, ~2,6 KB gzip) converte para GeoJSON com `topojson.feature()`.
- **Recomendação:** **1 a 2%** para o mapa nacional. Em zoom alto, os municípios pequenos do litoral e do entorno das capitais ficam angulosos, mas legíveis. Se a visão "meu município" pedir mais detalhe, carregue um arquivo extra por UF (recortes do IBGE ou `-split SIGLA_UF` no mapshaper) a 5–10%, só quando o usuário der zoom ou escolher o município.
- mapshaper: https://github.com/mbloch/mapshaper (MPL-2.0, ferramenta só de build).

### PMTiles e vector tiles: quando valem a pena

- PMTiles é "a single-file archive format for pyramids of tiled data". O cliente usa **HTTP Range Requests** para buscar só os tiles visíveis, e qualquer servidor HTTP com suporte a Range serve o arquivo, sem backend. Fontes: https://docs.protomaps.com/pmtiles/ e https://docs.protomaps.com/pmtiles/maplibre (protocolo `pmtiles://` via `maplibregl.addProtocol("pmtiles", protocol.tile)`).
- Gera-se com **tippecanoe** (não estava instalado aqui, então o tamanho do PMTiles **não foi medido**).
- Vale a pena quando a geometria detalhada passa de alguns MB, ou para servir um mapa base próprio. Para 5.571 polígonos coropléticos, um TopoJSON de ~0,6 MB carrega de uma vez e permite estilizar tudo no cliente. O PMTiles acrescentaria tooling e o risco do Range no Pages sem ganho real. O GitHub Pages suporta Range (testado, `206`). Na Cloudflare, a Protomaps recomenda R2, e o Pages não documenta Range. **Fica como plano B**, para geometria de alta resolução.

---

## 3. Bibliotecas de mapa

| Biblioteca | Licença | Peso (medido, jsDelivr) | Exige tiles pagos ou chave? | Observação |
|---|---|---|---|---|
| **MapLibre GL JS** 5.6.0 | **BSD-3-Clause** (fork aberto do Mapbox GL JS ≤ v1.13) | 939 KB bruto / **248 KB gzip** | **Não.** Aceita fonte GeoJSON própria e funciona sem mapa base. Os exemplos citam MapTiler, que pede chave, mas isso é opcional | WebGL, `feature-state` e estilo orientado a dados. Suporte nativo a PMTiles via plugin `pmtiles` (BSD-3, ~8 KB gzip) |
| **Leaflet** 1.9.4 | **BSD-2-Clause** | 148 KB bruto / **42 KB gzip** | Não. A camada GeoJSON é independente de tiles. O exemplo usa tiles do OSM, que têm política de uso própria | Renderiza em SVG/Canvas. 5.571 polígonos em SVG funcionam, mas ficam mais lentos que em WebGL no celular. Mais simples de aprender |
| **deck.gl** | **MIT** (OpenJS Foundation) | (não medido; bem maior) | Não. Funciona sozinho ou sobre MapLibre | Pensado para grandes volumes de pontos e camadas 3D. Exagero para um coroplético |

Fontes: https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/LICENSE.txt, https://maplibre.org/maplibre-gl-js/docs/, https://raw.githubusercontent.com/Leaflet/Leaflet/main/LICENSE, https://leafletjs.com/, https://raw.githubusercontent.com/visgl/deck.gl/master/LICENSE, https://deck.gl/docs.

**Coroplético com série temporal no MapLibre:** a geometria é carregada uma vez. Ao trocar ano ou indicador, chama-se `map.setFeatureState({source, id}, {valor})` e a cor é calculada no estilo com `['feature-state','valor']`. Segundo a API: "This method can only be used with sources that have a `feature.id` attribute", definido no dado, via `promoteId` na fonte ou via `generateId`. Usar `promoteId: "CD_MUN"`. Fontes: https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ e https://maplibre.org/maplibre-style-spec/sources/.

**Mapa base (opcional):** um coroplético de municípios não precisa de ruas. Se quiser contexto (nomes de cidades, litoral), há duas opções. A primeira é o **mapa base Protomaps**: builds diários em PMTiles, licença ODbL com atribuição ao OpenStreetMap. O planeta tem ~120 GB (z0–15), e o recorte do Brasil é feito com `pmtiles extract --maxzoom` (cada zoom a mais dobra o tamanho, aproximadamente). A Protomaps desencoraja hotlink. Fonte: https://docs.protomaps.com/basemaps/downloads. Um recorte do Brasil até z6–z8 deve ficar abaixo de 25 MiB, mas isso **não foi medido**. A segunda opção, mais simples, é não ter mapa base: fronteiras de UF por cima (`BR_UF_2025`) e rótulos próprios.

---

## 4. Formatos de dado para o navegador

Dados sintéticos com o tamanho real do problema (seção 5): **139.250 linhas** (5.570 municípios × 25 anos), 10 indicadores com 1 casa decimal e 15% de nulos.

| Formato | Bruto | gzip | brotli | Comentário |
|---|---|---|---|---|
| CSV largo (cod, ano, ind1..ind10) | 8,12 MB | 2,91 MB | 2,62 MB | Simples, mas precisa de parser e é tudo-ou-nada |
| CSV longo (cod, ano, indicador, valor) | 27,53 MB | 5,55 MB | 4,25 MB | Pior opção |
| JSON array de objetos (largo) | 21,63 MB | 3,89 MB | 3,03 MB | Chaves repetidas; ruim |
| **JSON colunar `{indicador: {cod: [v2000..v2024]}}`** | 7,58 MB | 2,52 MB | 2,31 MB | Tudo junto |
| **Idem, 1 arquivo por indicador** | **0,73 MB** | **0,24 MB** | **0,22 MB** | Carregado sob demanda quando o usuário troca de indicador |
| Parquet largo (zstd) | 2,00 MB | — | — | Já vem comprimido (gzip de transporte não ajuda) |
| Parquet longo (zstd, ordenado) | 2,54 MB | — | — | — |

Os valores aleatórios são o **pior caso** de compressão. Dados reais (séries suaves, muitos zeros e nulos em municípios pequenos) comprimem melhor.

**DuckDB-WASM:** é "DuckDB compiled to WebAssembly" e roda 100% no cliente. Com o httpfs em JavaScript, "fetches only the required byte ranges" de um Parquet. Avisos da documentação: com a extensão httpfs embutida, o arquivo inteiro pode ser baixado (issue #2153); o padrão é single-thread; a memória máxima é de 4 GB. Licença MIT. Fonte: https://duckdb.org/docs/2.0/clients/wasm/overview.html. **Peso medido:** `duckdb-eh.wasm` (1.29.0) tem **35,7 MB brutos / 7,0 MB gzip**. Isso:
- passa do limite de **25 MiB por arquivo** da Cloudflare Pages se for auto-hospedado (teria de vir de CDN, como jsDelivr, o que cria dependência externa);
- custa mais que todos os dados do site juntos.

**Conclusão:** para ~140 mil linhas, o navegador não precisa de um motor SQL. Basta pré-agregar offline (DuckDB nativo no pipeline) e publicar **JSON colunar por indicador**, com um índice pequeno (`meta.json` com nomes, unidades, anos e quebras de série). Se Parquet for desejável como **formato de download aberto** para jornalistas e pesquisadores, publique-o ao lado do JSON. Para lê-lo no navegador sem DuckDB, existe o leitor JS puro `hyparquet` (não avaliado em detalhe).

---

## 5. Estimativa de tamanho

**Premissas:**
- 5.571 municípios (MMD 2025). Municípios criados ao longo da série (por exemplo, emancipações nos anos 2000) aparecem como nulos antes da criação. A medição usou 5.570.
- **25 anos** (2000–2024). Na prática, as fontes do ticket 01 vão de 2008 a 2013 em diante, o que dá ~12–17 anos, então 25 anos é uma margem.
- **10 indicadores**, um valor numérico por município e ano. Sem cortes por sexo ou faixa etária. Com sexo, cada indicador dobra.
- Opcional: 1 coluna de "n" ou de flag de instabilidade por indicador, o que no máximo dobra o volume.

**Cálculo:** 5.570 × 25 × 10 = **1,39 milhão de valores**.

| Componente | Tamanho transferido (gzip) |
|---|---|
| Geometria nacional (TopoJSON 1%) | ~0,6 MB |
| Dados: 1 indicador (série completa, todos os municípios) | ~0,25 MB |
| Dados: todos os 10 indicadores | ~2,5 MB |
| MapLibre GL JS | ~0,25 MB |
| App (HTML/CSS/JS próprio) | < 0,2 MB |
| **Primeira visita típica** (geometria + 1 indicador + libs) | **~1,3 MB** |
| **Pior caso** (tudo carregado, com flags) | **~6 MB** |
| **Site inteiro no disco** (incluindo geometria por UF a 10% e Parquet para download) | **< 30 MB** |

Isso usa ~3% do limite de 1 GB do GitHub Pages. O maior arquivo tem bem menos de 25 MiB. A contagem de arquivos (~50–100) fica longe dos 20.000 da Cloudflare.

---

## 6. Recomendação

1. **Hospedagem: Cloudflare Pages** como principal, porque não tem teto de banda para estáticos e oferece 500 builds/mês. O **GitHub Pages** fica como alternativa equivalente: o mesmo `dist/` funciona nos dois, e o código fica no GitHub. Se o site for para o GitHub Pages, publique via GitHub Actions (sem o limite de 10 builds/hora) e acompanhe a banda (100 GB/mês *soft*).
2. **Geometria:** shapefile oficial MMD 2025, sem as 2 lagoas, simplificado com mapshaper para **TopoJSON a 1–2%** (~0,6–0,9 MB gzip), com `CD_MUN` como id. Opcionalmente, arquivos por UF a 5–10% para o zoom de "meu município". **Sem PMTiles no MVP.**
3. **Mapa:** **MapLibre GL JS** + `topojson-client`, fonte GeoJSON com `promoteId: "CD_MUN"` e cores via `feature-state`. Sem mapa base, ou com um recorte Protomaps auto-hospedado, com atribuição ao OSM. Sem chave de API.
4. **Dados:** pipeline offline (Python/PySUS + DuckDB nativo) que gera **JSON colunar por indicador** e `meta.json`. Parquet só como download aberto. **Sem DuckDB-WASM no MVP.**
5. **Atualização:** um job agendado no CI reconstrói os dados e publica. Os limites de build (10 min de deploy no GitHub e 20 min de build na Cloudflare) valem para o deploy. O processamento pesado (arquivos de GB do DATASUS) deve rodar **em job separado do GitHub Actions** (limite próprio de 6 h por job, não verificado nesta pesquisa) e commitar ou enviar só os artefatos pequenos.

---

## Como os números foram medidos

- Shapefile: `BR_Municipios_2025.zip` baixado do FTP do IBGE, inspecionado com `mapshaper -info` (5.573 registros).
- Simplificação: `mapshaper BR_Municipios_2025.shp -filter '!/^\d\d0000\d$/.test(CD_MUN)' -filter-fields CD_MUN,NM_MUN,SIGLA_UF -simplify <p>% weighted keep-shapes -o format=topojson quantization=1e5`. O GeoJSON usou `-filter-fields CD_MUN` e `precision=0.0001`.
- Compressão: `zlib.gzipSync` (nível 9) e `brotliCompressSync` do Node 24.
- Dados sintéticos: DuckDB 2.0 (`@duckdb/node-api`), `range(5570) × range(2000,2025)`, valores `round(random()*k,1)` com 15% de nulos, exportados em CSV, JSON e Parquet zstd.
- Pesos de bibliotecas: arquivos `dist/` baixados do jsDelivr (maplibre-gl@5.6.0, leaflet@1.9.4, pmtiles@4.3.0, topojson-client@3.1.0, @duckdb/duckdb-wasm@1.29.0) e comprimidos com `gzip -9`.
- Range e compressão no GitHub Pages: `curl -H "Range: bytes=0-99"` contra `maplibre.org` e `pmtiles.io` (ambos servidos por `server: GitHub.com`) devolveu `206` e `content-encoding: gzip`.

## Não verificado

- Os termos exatos da Nota Metodológica da MMD (página do IBGE bloqueou o acesso automatizado).
- O tamanho de um PMTiles dos municípios (tippecanoe não estava disponível) e de um recorte Protomaps do Brasil.
- O suporte a Range Requests na Cloudflare Pages (não documentado na página de limites).
- O limite de tempo de job do GitHub Actions (citado de memória: 6 h).
