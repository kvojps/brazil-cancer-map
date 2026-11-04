# 36: Aplicar o Console horizontal e o sistema visual aprovado

**What to build:** Aplicar ao produto a estrutura A aprovada no ticket 35: identidade, cabeçalho, controles horizontais, ajuda contextual, legenda e rodapé. Reaproveitar temas/estado do 30 e mapa do 31, alterando sua composição; não copiar código descartável.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Referências

- [Decisão e proposta — ticket 35](35-prototipo-dashboard-de-observabilidade.md), alternativa A aprovada em 2026-11-04.
- [Spec de UI/UX](../../ui-ux-v1/spec.md) e [handoff aprovado](../../ui-ux-v1/observability-handoff.md).
- Fonte primária: branch `prototype/35-observability-dashboard`, commit `86a8d87`; variante A. Não promover o código descartável.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–12 e 15; [glossário](../../../GLOSSARY.md).

## Critérios de aceite

- [ ] Cabeçalho compacto com símbolo/nome, navegação “Mapa” e “Como calculamos” e botão sol/lua com nome acessível; claro/escuro recebem o mesmo tratamento, sem fontes externas
- [ ] Brasil inteiro na abertura em tratamento até 60 dias × Todos os cânceres × Tendência, sem seleção, painel vazio, apresentação longa ou cartões numéricos nacionais
- [ ] Barra horizontal de filtros agrupados e busca, com “Explorar em lista” secundário próximo à busca; adaptar a 320 px sem cortar controles nem prejudicar o mapa
- [ ] Notas extensas tornam-se ajuda contextual acionável por clique, toque e teclado, com fechamento/foco e descrições acessíveis; ressalvas essenciais permanecem junto do indicador
- [ ] Legenda compacta integrada ao mapa com classes, texturas, período e Referência pertinentes; explicações sob demanda preservam a distinção entre estável, sem direção clara e dado insuficiente
- [ ] Cores de Tendência/Situação e texturas existentes permanecem; hachura C só no tratamento pertinente; ausência de carga e C55 não calculável não viram classes inventadas
- [ ] Rodapé compacto após a área principal, com identidade, fontes/condições, licenças e código; aviso integral de construção preservado
- [ ] Verificar teclado, foco e ajuda em ambos os temas, 320/768/1280 px e zoom 200%; executar checagem/build e testes pertinentes, registrando limites e recursos transferidos sem alegar auditoria completa

## Limites

Não alterar pipeline, JSON publicados, método, classes, Referência, cascata ou textos clínicos para acomodar o desenho. Aprovação visual não autoriza publicação nem equivale a auditoria de acessibilidade ou revisão clínica.

## Comments

- Criado no handoff do ticket 35 após escolha humana da alternativa A. Entregas anteriores permanecem resolvidas; implementar somente a mudança de composição e comportamento descrita aqui.
