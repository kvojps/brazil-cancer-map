# 37: Integrar Meu município completo ao dashboard

**What to build:** Substituir a prévia e o acesso à ficha separada por consulta completa dos quatro Eixos no dashboard A. Reutilizar cartões, conteúdo e perfis existentes dos tickets 31/33, sem duplicar regras editoriais.

**Blocked by:** 36 — Console horizontal e sistema visual.

**Status:** ready-for-agent

## Referências

- [Decisão e proposta — ticket 35](35-prototipo-dashboard-de-observabilidade.md), alternativa A aprovada em 2026-11-04.
- [Spec de UI/UX](../../ui-ux-v1/spec.md) e [handoff aprovado](../../ui-ux-v1/observability-handoff.md).
- Fonte primária: branch `prototype/35-observability-dashboard`, commit `86a8d87`; variante A. Não promover o código descartável.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–12 e 15; [glossário](../../../GLOSSARY.md).

## Critérios de aceite

- [ ] Seleção por mapa, busca ou link abre painel com nome/UF; nenhuma etapa exige “Ver Meu município” nem navegação para ficha com composição distinta
- [ ] Quatro Eixos expansíveis, Acesso ao tratamento primeiro e Onde se tratar junto; abertura inicial do Eixo do indicador selecionado, sem restringir os demais Eixos por indicador/modo
- [ ] Aplicar Tipo de câncer aos Eixos pertinentes, com justificativas/Ações alternativas existentes; funcionar para todos os municípios e os seis Tipos, sem limites das amostras do protótipo
- [ ] Resultado, classe, período, origem regional/nome da região, Referência pertinente, Ação e ressalvas essenciais junto do resultado; detalhes longos expansíveis, preservando séries, fontes e atualização
- [ ] Manter quimio/radio, % sem informação sobre todos os casos, faixa C/período da qualidade, HPV sem Tendência, mortalidade e tratamento/próstata sem Situação, C55 não calculável e notas de denominador/idade/transição existentes
- [ ] Ausência/falha de carga difere de dado insuficiente; não reutilizar resultado antigo e não transformar a simulação HPV do protótipo em dado publicado
- [ ] Desktop com painel lateral; celular com painel inferior inicialmente resumido, expandir/recolher e fechamento explícito; voltar ao mapa preserva seleção e oferece reabertura, limpar seleção a remove
- [ ] Carregar perfis por UF sob demanda com JavaScript; permitir acesso pelo teclado ao painel, anúncios e retorno de foco coerentes, sem aprisionamento indevido
- [ ] Verificar estados municipal/regional/insuficiente/C/ausência, respostas atrasadas e mudança de filtros nos dois temas, 320/768/1280 px e zoom 200%; executar checagem/build e regressões pertinentes

## Limites

Não alterar pipeline, JSON publicados, método, classes, Referência, cascata ou textos clínicos para acomodar o desenho. Aprovação visual não autoriza publicação nem equivale a auditoria de acessibilidade ou revisão clínica.

## Comments

- Criado no handoff do ticket 35 após escolha humana da alternativa A. Entregas anteriores permanecem resolvidas; implementar somente a mudança de composição e comportamento descrita aqui.
