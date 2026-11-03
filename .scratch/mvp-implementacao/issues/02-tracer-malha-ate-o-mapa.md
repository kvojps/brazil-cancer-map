# 02: Tracer bullet — malha IBGE até o mapa no site

**What to build:** quem abre o site vê o Mapa inicial: o Brasil dividido nos 5.570 municípios da malha IBGE 2025, sem mapa base. O pipeline baixa a malha, gera o TopoJSON simplificado (1–2% com mapshaper, sem as 2 lagoas), leva o código da Região imediata de cada município e exporta a lista de municípios. A validação confere a presença dos 5.570. Referência: spec, seções 3, 11.1, 13 e 14.

**Blocked by:** 01 — Esqueleto do monorepo e requisitos de licença

**Status:** resolved

- [x] O baixador da malha usa cache incremental (tamanho e data) e tenta de novo em caso de falha
- [x] O TopoJSON exportado fica entre ~0,6 e 0,9 MB gzip, sem as lagoas, com o código do município (6 dígitos) e o da Região imediata
- [x] A validação falha se faltar algum dos 5.570 municípios, e nesse caso nada da malha é publicado
- [x] O mapa é uma ilha em TypeScript + MapLibre GL JS, sem mapa base, com `promoteId: "CD_MUN"` pronto para `feature-state`
- [x] A página do mapa tem a busca, o seletor de tipo e o seletor do indicador como espaços reservados no topo (sem comportamento ainda)
- [x] O build e o mapa funcionam localmente

## Comments

Resolvido em `d820ce4` (malha no pipeline, ilha do mapa no site) e no commit seguinte, que aplica a revisão (fonte no TopoJSON, checagem de geometria vazia, publicação conjunta dos dois arquivos, comentários em inglês) e fecha este ticket.

A malha IBGE 2025 tem **5.571** municípios, não 5.570: Boa Esperança do Norte (MT, 510183), instalado em 2025 a partir de Sorriso, entra na malha e na lista oficial do IBGE. A validação compara a malha com a lista oficial (`servicodados.ibge.gov.br/api/v1/localidades/municipios`), e não com uma contagem fixa. Fica para os tickets de dados decidir como tratar esse município nas séries anteriores a 2025.

Simplificação a 1,5%: 0,71 MB gzip.
