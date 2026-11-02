# Como servir um mapa municipal do Brasil num site estático gratuito?

Type: research
Status: resolved
Blocked by:

## Question

Quais são os limites e as opções para servir um mapa coroplético dos cerca de 5.570 municípios, com série histórica, num site estático gratuito? Levantar:
- limites do GitHub Pages e do Cloudflare Pages (tamanho do site e dos arquivos, banda, build)
- malha municipal do IBGE e como simplificá-la (TopoJSON, PMTiles, vector tiles)
- bibliotecas de mapa gratuitas (MapLibre, Leaflet, deck.gl) e se exigem tiles pagos
- formatos de dado para o navegador (JSON, CSV, Parquet com DuckDB-WASM)
- tamanho estimado: municípios × anos × cerca de 10 indicadores

## Answer

- **Cabe com folga no plano gratuito.** A primeira visita transfere ~1,3 MB (gzip). O pior caso fica em ~6 MB, e o site inteiro em disco fica abaixo de 30 MB. O GitHub Pages permite 1 GB de site, 100 GB/mês de banda (*soft*) e arquivos de até 100 MiB. A Cloudflare Pages permite 20.000 arquivos de até 25 MiB, banda ilimitada para estáticos e 500 builds/mês.
- **Hospedagem:** Cloudflare Pages como principal, porque não tem teto de banda. O GitHub Pages, via Actions, serve como alternativa equivalente.
- **Geometria:** o shapefile oficial da Malha Municipal 2025 do IBGE tem 5.573 polígonos: 5.571 municípios e 2 lagoas, que devem ser removidas. Simplificado com mapshaper para TopoJSON a 1–2%, ocupa ~0,6–0,9 MB em gzip (medido). PMTiles e vector tiles não são necessários no MVP.
- **Mapa:** MapLibre GL JS (BSD-3) com fonte GeoJSON, `promoteId: "CD_MUN"` e `feature-state` para trocar ano e indicador. Não precisa de chave de API nem de tiles pagos, e o mapa base é opcional (Protomaps/OSM auto-hospedado).
- **Dados:** 5.570 municípios × 25 anos × 10 indicadores dão 1,39 milhão de valores. Em JSON colunar, cada indicador ocupa ~0,25 MB em gzip, e os 10 juntos ~2,5 MB. O DuckDB-WASM fica fora do MVP: o `.wasm` tem 35,7 MB, passa do limite de 25 MiB por arquivo da Cloudflare e pesa mais que todos os dados do site juntos. O Parquet fica só como download aberto.
- Detalhes, fontes e método de medição: [research/03-hospedagem-e-mapa-estatico.md](../research/03-hospedagem-e-mapa-estatico.md)
