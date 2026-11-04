# 38: Preservar lista, links municipais e consulta sem JavaScript no dashboard

**What to build:** Adaptar estado e alternativas resilientes à consulta integrada A. Reaproveitar as entregas resolvidas 09, 32 e 33; a mudança é a posição da lista e o destino integrado, sem refazer a independência já conquistada.

**Blocked by:** 36 — Console horizontal; 37 — Consulta municipal integrada.

**Status:** ready-for-agent

## Referências

- [Decisão e proposta — ticket 35](35-prototipo-dashboard-de-observabilidade.md), alternativa A aprovada em 2026-11-04.
- [Spec de UI/UX](../../ui-ux-v1/spec.md) e [handoff aprovado](../../ui-ux-v1/observability-handoff.md).
- Fonte primária: branch `prototype/35-observability-dashboard`, commit `86a8d87`; variante A. Não promover o código descartável.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–12 e 15; [glossário](../../../GLOSSARY.md).

## Critérios de aceite

- [ ] “Explorar em lista” troca mapa por lista na mesma área, com alternância “Mapa | Lista”; manter filtros, seleção e resultado ao alternar, sem tabela/índice permanente abaixo do mapa
- [ ] Busca/lista inicializam sem aguardar malha/WebGL; falha/demora do mapa não bloqueia consulta, com carregamento, falha e nova tentativa próprios dos dados
- [ ] Lista mantém valores/classes/períodos/origens/qualidade/notas e restrições de modos existentes, com alternativa textual que não depende apenas de cor
- [ ] Estado compartilhável preserva seleção, indicador, Tipo, modo permitido, tema e visualização pertinentes; conferir links diretos, correção de valores inválidos e Voltar/Avançar sem dados obsoletos
- [ ] Registrar convenção final de URL: preferir reaproveitar /municipio/<slug>/ como documento estático do dashboard com seleção; se houver nova canônica, manter rotas antigas com redirect HTTP ou mesmo HTML selecionado, jamais apenas redirect JavaScript
- [ ] Sem JavaScript, HTML do dashboard selecionado contém quatro Eixos, indicadores, Ações, ressalvas, fontes e links nativos dos seis Tipos; query string sozinha não substitui seleção estática, preservar âncoras antigas e acesso à Metodologia
- [ ] Índice estático por UF acessível em expansão sob demanda, sem interferir na visualização principal; links antigos e novos permitem consulta sem mapa e sem JavaScript
- [ ] Reusar shell/componentes, medir custo de geração e tamanho/transferência, evitar duplicar mapa/JSON por município e registrar excessos ao orçamento no ticket 25 sem aprová-los silenciosamente
- [ ] Verificar teclado/foco/anúncios, recuperação de falhas, links e histórico, com/sem JavaScript e WebGL indisponível, nos dois temas a 320/768/1280 px e zoom 200%; checagem/build e regressões passam

## Limites

Não alterar pipeline, JSON publicados, método, classes, Referência, cascata ou textos clínicos para acomodar o desenho. Aprovação visual não autoriza publicação nem equivale a auditoria de acessibilidade ou revisão clínica.

## Comments

- Criado no handoff do ticket 35 após escolha humana da alternativa A. Entregas anteriores permanecem resolvidas; implementar somente a mudança de composição e comportamento descrita aqui.
