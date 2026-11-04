# O que aproveitar de sistemas de observabilidade no dashboard do Observatório?

Labels: wayfinder:research
Type: research
**Status:** resolved
Assignee: observability_research
Parent: ../map.md
Blocked by:

## Question

Investigar de quatro a seis referências de observabilidade e exploração de indicadores por fontes primárias: composição de dashboards, métricas de resumo, filtros e contexto persistente, navegação do panorama ao detalhe, séries e estados de carregamento/erro/ausência. Incluir sistemas com visualizações geográficas quando pertinente.

Separar padrões de interação de estética. Explicar o que transferir, adaptar ou evitar num produto público de saúde com séries anuais e fontes de períodos diferentes, sem importar linguagem de incidente, urgência operacional ou monitoramento em tempo real. Considerar desktop, mobile, acessibilidade, densidade e divulgação progressiva.

Entregar comparação com links precisos, limites da inspeção e recomendações vinculadas a `GLOSSARY.md` e spec §§2, 5–11, 13–15. Não escolher a direção visual pelo responsável.

## Answer

Quatro sistemas documentam padrões úteis de contexto compartilhável na URL, resumo → detalhe e divulgação progressiva. Adaptar esses padrões às séries anuais e períodos próprios de cada fonte, separando estados de carregamento, erro, insuficiência e incerteza. Não importar linguagem de incidentes, tempo real ou um ano global que torne fontes incomparáveis; nenhuma direção visual foi aprovada.

Evidência e fontes: [pesquisa completa](../research/02-observabilidade.md).

## Comments

### Resolução — 2026-11-04

Pesquisa concluída; evidências no commit `739c5c9` do branch descartável `research/ui-ux-v1`. Este commit de encerramento registra a resolução e atualiza o mapa. Sem alteração no código do produto.
