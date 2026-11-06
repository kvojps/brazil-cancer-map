# Site estático com JSON commitados, sem backend

O projeto precisa servir um mapa dos 5.571 municípios, com série histórica, sem nenhum custo de hospedagem. Decidimos em 02/11/2026 publicar um site Astro estático, sem backend nem banco de dados, em que todo número derivado sai pronto do pipeline como JSON commitado em `site/public/dados/`. O deploy é só o build do site, o diff do git mostra o que mudou nos dados a cada atualização, e a mesma regra vale no mapa e no Meu município, porque o front não faz conta estatística.

Regras vigentes: [spec, seções 13 e 15](../spec.md#13-stack-e-arquitetura).

## Alternativas consideradas

- **DuckDB-WASM para consultar Parquet no navegador:** descartado. O `.wasm` tem 35,7 MB brutos (7,0 MB gzip), passa do limite de 25 MiB por arquivo da Cloudflare e pesa mais que os dados estimados do site. Para cerca de 140 mil linhas por indicador, o navegador não precisa de um motor SQL. O Parquet ficou só como download aberto.
- **PMTiles ou vector tiles para a malha:** descartados. Um TopoJSON da malha simplificada carrega de uma vez e permite estilizar tudo no cliente, enquanto o PMTiles acrescentaria ferramentas e dependeria de Range requests que a Cloudflare não documenta para esse uso. Ficam como plano B para geometria de alta resolução.
- **Mapa base com ruas e rótulos:** descartado. Um mapa coroplético de municípios não precisa dele, e a opção autohospedada acrescentaria arquivos e a atribuição ao OpenStreetMap.
- **Leaflet ou deck.gl:** descartados em favor do MapLibre GL JS (BSD-3), que não exige chave nem tiles pagos e troca indicador e ano por `feature-state`.
- **Backend ou API própria:** fora do projeto, porque geraria custo e operação contínua.

## Evidências

Estimativas da decisão, medidas com a malha real e com dados sintéticos:

| Medida | Valor estimado |
|---|---:|
| Malha TopoJSON a 1–2%, gzip | 0,6–0,9 MB |
| Dados de um indicador em JSON colunar, gzip | ~0,25 MB |
| Primeira visita, gzip | ~1,3 MB |
| Site inteiro em disco | menos de 30 MB |

Limites consultados em 02/11/2026: GitHub Pages com 1 GB de site, 100 GB/mês de banda (*soft*) e arquivos de até 100 MiB; Cloudflare com 20.000 arquivos de até 25 MiB e banda ilimitada para estáticos.

A estimativa é anterior à página completa por município. A saída medida em 06/11/2026 tem 5.635 arquivos e 999.530.479 bytes, e a primeira visita local transfere 1.369.414 bytes gzip. A simplificação vigente, de 1,5%, ocupa 0,71 MB gzip.

## Consequências

- Atualizar os dados exige commit e novo build. Não há como mudar um número sem passar pelo git.
- Os dados completos saem em GitHub Releases, porque o site só leva o que exibe.
- A saída real está longe da meta de 30 MB, e isso é dívida conhecida na [spec, seção 17](../spec.md#17-pendências). O limite de 20.000 arquivos continua atendido, e a saída ficou perto do limite de 1 GB do GitHub Pages, a alternativa prevista.
- O host mudou de Cloudflare Pages para Workers com assets estáticos, sem mudar esta decisão: o provedor deixou de oferecer a criação de projetos Pages.
