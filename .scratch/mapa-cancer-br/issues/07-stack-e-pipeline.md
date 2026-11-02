# Qual stack e pipeline de dados usar?

Type: grilling
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by: 03, 04

## Question

Qual stack de front-end e de mapa usar, em que formato publicar os dados, e como o pipeline offline baixa, trata e gera os arquivos estáticos a partir das fontes escolhidas?

## Answer

Decidido em grilling em 2026-11-02.

**Site**
- **Astro** com saída estática: **uma página por município** (`/municipio/<código>-<nome>`, cerca de 5.570 HTMLs, abaixo do limite de 20.000 arquivos da Cloudflare) mais a página do mapa. O cidadão chega pela busca e pelo link compartilhado. A página funciona sem JavaScript para leitura básica.
- O mapa é uma **ilha** em TypeScript + MapLibre GL JS, com TopoJSON simplificado da **malha IBGE 2025** e **sem mapa base**, como decidido em [Como servir um mapa municipal do Brasil num site estático gratuito?](03-hospedagem-e-mapa-estatico.md).
- **O front não faz conta estatística.** Todo número derivado sai pronto do pipeline: taxa, razão, classe da Tendência, comparação com a Referência, agregação de município pequeno e faixa A/B/C. Assim a mesma regra vale no mapa e na ficha.

**Pipeline** (`pipeline/`, Python + DuckDB, pandas onde já existe código)
1. **Baixar:** um baixador por fonte, com cache local incremental (`data/raw/`) que compara tamanho e data no FTP e só baixa o que mudou. O dado bruto nunca entra no git.
2. **Limpar:** um módulo por fonte transforma o arquivo em tabelas padronizadas em Parquet (`data/clean/`), com código IBGE de 6 dígitos, ano, tipo, sexo, faixa etária e contagem. Os DBC passam por `datasus_dbc` + `dbfread`, e os CSVs grandes (SISCAN, SI-PNI) pelo DuckDB. Aqui entram as regras de qualidade: "Todos" sem C76–C80 no Painel, C55 e C26 na mortalidade, marca de ano provisório.
3. **Calcular:** uma função testável por indicador, com o denominador, a Tendência, a Referência e a faixa A/B/C. É o único lugar com estatística.
4. **Validar:** compara os totais com números oficiais (por exemplo, a % em até 60 dias por UF contra o TabNet), confere a presença dos 5.570 municípios e a faixa plausível dos valores. Se falhar, nada é publicado.
5. **Exportar:** gera o contrato de dados (abaixo).

O comando é único (`python -m pipeline run`) e também pode rodar uma fonte ou etapa por vez. O mesmo comando roda no computador do mantenedor ou num CI. Quando e onde rodar continua no fog "Atualização dos dados".

**Contrato de dados** (a única fronteira entre `pipeline/` e `site/`)
- **Camada do mapa:** um JSON por (indicador × tipo) com os 5.570 municípios, contendo a classe da Tendência, o último valor e a faixa de qualidade.
- **Camada da ficha:** um JSON por UF com a série completa de todos os indicadores e tipos dos municípios daquela UF. Carrega quando o mapa aproxima no estado.
- **`manifest.json`:** data de extração de cada fonte e versão do pipeline.
- Os JSON exportados são **commitados** em `site/public/dados/`. O deploy na Cloudflare Pages é só `astro build`, e o diff do git mostra o que mudou nos dados a cada atualização.
- O **Parquet/CSV** completo vai como asset de uma **GitHub Release** por versão. Ele serve de download aberto e permite reconstruir o site sem o pipeline.

**Denominador:** estimativa populacional do Ministério da Saúde/SVS por município, sexo e faixa etária (a que o TabNet usa), para bater com os números oficiais na validação. A série e o formato estão em [Qual a série e o formato da estimativa populacional do MS/SVS por município, sexo e idade?](13-denominador-populacional.md).

**Municípios que mudaram:** a malha 2025 é a referência. A série de um município novo começa quando ele passa a existir, sem recalcular o município de origem.

**Repositório:** monorepo com `pipeline/` e `site/`.
