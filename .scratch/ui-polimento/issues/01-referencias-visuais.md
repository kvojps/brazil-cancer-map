# Quais padrões visuais concretos fazem um painel de dados parecer sóbrio e preciso?

Labels: wayfinder:research
Type: research
**Status:** resolved
Assignee: pesquisa-referencias
Parent: ../map.md
Blocked by:

## Question

Selecionar de quatro a seis referências de painéis de dados sérios e produtos com acabamento sóbrio, incluindo dados públicos ou de saúde e pelo menos uma com mapa no celular. Candidatas: Our World in Data, Financial Times, Linear e Stripe; a seleção final é livre, desde que justificada.

Extrair padrões concretos e aplicáveis ao Observatório: escala e pares tipográficos, destaque de números, espaçamento, uso de bordas e superfícies, cor reservada aos dados, tema escuro, legenda de mapa, filtros e menu no celular, folha inferior e avisos de destaque. Dar valores observados quando possível.

Distinguir observação direta, documentação do produto e inferência, com links precisos e limites de inspeção. Os padrões são hipóteses para os protótipos, não aprovação visual. Não recomendar copiar a identidade de nenhuma referência.

## Answer

Referências selecionadas: Our World in Data, UKHSA com GOV.UK Design System, MapBiomas (sobretudo como contraexemplo), Electricity Maps, Financial Times (só tokens publicados) e Linear. Stripe ficou de fora porque o painel exige login.

Padrões a testar nos protótipos, todos como hipótese:

- **Celular:** mapa ocupando a altura, cabeçalho perto de 48 px e legenda sempre visível. A estimativa é de cerca de 80% da altura para o mapa com o aviso integral, ainda não medida.
- **Fundamentos:** escala tipográfica curta, espaçamento em múltiplos de 4 px, neutros na interface e cor nas classes e nos links. O menor nível de texto fica acima de 4,5:1.
- **Fonte:** comparar IBM Plex Sans, Inter e Source Serif 4 nos títulos. Atkinson Hyperlegible Next serve de controle de legibilidade. O `≥`, usado 6 vezes no site, falta no subconjunto `latin` de todas as candidatas. Em Plex e Source Sans 3, um subconjunto próprio esbarra no nome reservado da licença OFL (não é parecer jurídico).
- **Painel:** valor grande com período próprio, dado insuficiente explícito e superfície contínua com filetes, no lugar de cartões dentro de cartões.
- **Desktop:** painel lateral de cerca de 400 px, mapa dominante e aviso de ponta a ponta com o texto inteiro.

Limites: observação em Chromium headless com emulação, sem aparelhos reais nem teste com pessoas. FT foi visto só pelos tokens do pacote público, Linear só pela página pública e Electricity Maps só no celular.

Evidência, fontes e listas de adotar, adaptar e evitar por protótipo: [pesquisa completa](https://github.com/Kvojps/brazil-cancer-map/blob/research/ui-polimento/.scratch/ui-polimento/research/01-referencias-visuais.md), ou `git show research/ui-polimento:.scratch/ui-polimento/research/01-referencias-visuais.md`.

## Comments

### Resolução — 2026-11-05

Pesquisa concluída; evidências no commit `b8b02a0` do branch descartável `research/ui-polimento`, sem PR e sem merge. Sem alteração no código do produto.
