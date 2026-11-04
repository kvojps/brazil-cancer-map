# 39: Aplicar o Console horizontal à Metodologia

**What to build:** Adaptar a apresentação da Metodologia à direção A, reutilizando sumário, âncoras, expansões, conteúdo e acesso a fontes já entregues no 34. Este ticket trata apenas do delta visual e de navegação.

**Blocked by:** 36 — Console horizontal e sistema visual.

**Status:** ready-for-agent

## Referências

- [Decisão e proposta — ticket 35](35-prototipo-dashboard-de-observabilidade.md), alternativa A aprovada em 2026-11-04.
- [Spec de UI/UX](../../ui-ux-v1/spec.md) e [handoff aprovado](../../ui-ux-v1/observability-handoff.md).
- Fonte primária: branch `prototype/35-observability-dashboard`, commit `86a8d87`; variante A. Não promover o código descartável.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–12 e 15; [glossário](../../../GLOSSARY.md).

## Critérios de aceite

- [ ] Preservar /metodologia/ e âncoras técnicas existentes, com identidade, navegação, temas e rodapé compartilhados do Console A
- [ ] Aplicar sumário, seções numeradas/organizadas, coluna de leitura e detalhes expansíveis no sistema aprovado, sem obrigar a página à altura do mapa
- [ ] Manter integralmente fontes, método, ressalvas, versões, condições de uso, citação, dados e reprodução existentes; o resumo do protótipo não substitui o conteúdo de produção
- [ ] Links dos indicadores chegam às seções pertinentes; navegação preserva tema e retorno ao dashboard com seleção/estado pertinentes, quando disponíveis
- [ ] Conteúdo básico, sumário, links e expansões funcionam sem JavaScript; foco visível, teclado e tabelas com rolagem contida nos dois temas
- [ ] Verificar 320/768/1280 px e zoom 200%, com/sem JavaScript; checagem/build e regressões de âncoras/conteúdo passam, sem acrescentar fontes externas
- [ ] Não encerrar nem duplicar os tickets 22 (releases), 24 (conteúdo técnico) ou 25 (auditoria); registrar apenas as verificações do novo desenho

## Limites

Não alterar pipeline, JSON publicados, método, classes, Referência, cascata ou textos clínicos para acomodar o desenho. Aprovação visual não autoriza publicação nem equivale a auditoria de acessibilidade ou revisão clínica.

## Comments

- Criado no handoff do ticket 35 após escolha humana da alternativa A. Entregas anteriores permanecem resolvidas; implementar somente a mudança de composição e comportamento descrita aqui.
