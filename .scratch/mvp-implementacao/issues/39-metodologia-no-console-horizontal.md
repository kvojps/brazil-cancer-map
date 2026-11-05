# 39: Aplicar o Console horizontal à Metodologia

**What to build:** Adaptar a apresentação da Metodologia à direção A, reutilizando sumário, âncoras, expansões, conteúdo e acesso a fontes já entregues no 34. Este ticket trata apenas do delta visual e de navegação.

**Blocked by:** 36 — Console horizontal e sistema visual.

**Status:** resolved

## Referências

- [Decisão e proposta — ticket 35](35-prototipo-dashboard-de-observabilidade.md), alternativa A aprovada em 2026-11-04.
- [Spec de UI/UX](../../ui-ux-v1/spec.md) e [handoff aprovado](../../ui-ux-v1/observability-handoff.md).
- Fonte primária: branch `prototype/35-observability-dashboard`, commit `86a8d87`; variante A. Não promover o código descartável.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–12 e 15; [glossário](../../../GLOSSARY.md).

## Critérios de aceite

- [x] Preservar /metodologia/ e âncoras técnicas existentes, com identidade, navegação, temas e rodapé compartilhados do Console A
- [x] Aplicar sumário, seções numeradas/organizadas, coluna de leitura e detalhes expansíveis no sistema aprovado, sem obrigar a página à altura do mapa
- [x] Manter integralmente fontes, método, ressalvas, versões, condições de uso, citação, dados e reprodução existentes; o resumo do protótipo não substitui o conteúdo de produção
- [x] Links dos indicadores chegam às seções pertinentes; navegação preserva tema e retorno ao dashboard com seleção/estado pertinentes, quando disponíveis
- [x] Conteúdo básico, sumário, links e expansões funcionam sem JavaScript; foco visível, teclado e tabelas com rolagem contida nos dois temas
- [x] Verificar 320/768/1280 px e zoom 200%, com/sem JavaScript; checagem/build e regressões de âncoras/conteúdo passam, sem acrescentar fontes externas
- [x] Não encerrar nem duplicar os tickets 22 (releases), 24 (conteúdo técnico) ou 25 (auditoria); registrar apenas as verificações do novo desenho

## Limites

Não alterar pipeline, JSON publicados, método, classes, Referência, cascata ou textos clínicos para acomodar o desenho. Aprovação visual não autoriza publicação nem equivale a auditoria de acessibilidade ou revisão clínica.

## Comments

- Criado no handoff do ticket 35 após escolha humana da alternativa A. Entregas anteriores permanecem resolvidas; implementar somente a mudança de composição e comportamento descrita aqui.

- Implementação: `5575044` — `feat(site): apply console layout to methodology and preserve return state (#39)`.
- Encerramento, registro de validação e revisão: `docs: record methodology validation and close ticket 39` (este commit).
- [Verificação do novo desenho e limites](../../ui-ux-v1/validation-39.md): checagem sem erros, build, 41 testes do site e 40 testes de navegador contra a saída estática; 320/768/1280 px, claro/escuro, com/sem JavaScript e zoom nativo 200%. Conteúdo técnico e âncoras preservados; retorno ao dashboard conserva o contexto disponível pela URL.
- Revisão em dois eixos: nenhuma pendência de código em Standards ou desvio de Spec. O apontamento de encerramento documental foi atendido neste commit. Tickets 22, 24 e 25 permanecem independentes.
