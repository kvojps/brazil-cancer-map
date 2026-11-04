# 37: Integrar Meu município completo ao dashboard

**What to build:** Substituir a prévia e o acesso à ficha separada por consulta completa dos quatro Eixos no dashboard A. Reutilizar cartões, conteúdo e perfis existentes dos tickets 31/33, sem duplicar regras editoriais.

**Blocked by:** 36 — Console horizontal e sistema visual.

**Status:** resolved

## Referências

- [Decisão e proposta — ticket 35](35-prototipo-dashboard-de-observabilidade.md), alternativa A aprovada em 2026-11-04.
- [Spec de UI/UX](../../ui-ux-v1/spec.md) e [handoff aprovado](../../ui-ux-v1/observability-handoff.md).
- Fonte primária: branch `prototype/35-observability-dashboard`, commit `86a8d87`; variante A. Não promover o código descartável.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–12 e 15; [glossário](../../../GLOSSARY.md).

## Critérios de aceite

- [x] Seleção por mapa, busca ou link abre painel com nome/UF; nenhuma etapa exige “Ver Meu município” nem navegação para ficha com composição distinta
- [x] Quatro Eixos expansíveis, Acesso ao tratamento primeiro e Onde se tratar junto; abertura inicial do Eixo do indicador selecionado, sem restringir os demais Eixos por indicador/modo
- [x] Aplicar Tipo de câncer aos Eixos pertinentes, com justificativas/Ações alternativas existentes; funcionar para todos os municípios e os seis Tipos, sem limites das amostras do protótipo
- [x] Resultado, classe, período, origem regional/nome da região, Referência pertinente, Ação e ressalvas essenciais junto do resultado; detalhes longos expansíveis, preservando séries, fontes e atualização
- [x] Manter quimio/radio, % sem informação sobre todos os casos, faixa C/período da qualidade, HPV sem Tendência, mortalidade e tratamento/próstata sem Situação, C55 não calculável e notas de denominador/idade/transição existentes
- [x] Ausência/falha de carga difere de dado insuficiente; não reutilizar resultado antigo e não transformar a simulação HPV do protótipo em dado publicado
- [x] Desktop com painel lateral; celular com painel inferior inicialmente resumido, expandir/recolher e fechamento explícito; voltar ao mapa preserva seleção e oferece reabertura, limpar seleção a remove
- [x] Carregar perfis por UF sob demanda com JavaScript; permitir acesso pelo teclado ao painel, anúncios e retorno de foco coerentes, sem aprisionamento indevido
- [x] Verificar estados municipal/regional/insuficiente/C/ausência, respostas atrasadas e mudança de filtros nos dois temas, 320/768/1280 px e zoom 200%; executar checagem/build e regressões pertinentes

## Limites

Não alterar pipeline, JSON publicados, método, classes, Referência, cascata ou textos clínicos para acomodar o desenho. Aprovação visual não autoriza publicação nem equivale a auditoria de acessibilidade ou revisão clínica.

## Comments

- Criado no handoff do ticket 35 após escolha humana da alternativa A. Entregas anteriores permanecem resolvidas; implementar somente a mudança de composição e comportamento descrita aqui.

- Implementação: `e225e2f` — `feat(site): integrate complete municipal consultation into dashboard (#37)`.
- Correções da revisão e encerramento: `fix(site): preserve result context and close integrated consultation ticket (#37)` (este commit). Resumo recolhido sem números isolados das ressalvas; cache só do perfil; painel inferior móvel dentro da viewport.
- [Registro de validação e limites](../../ui-ux-v1/validation-37.md): checagem sem erros, build e 37 testes do site, 31 testes de navegador; estados municipal/regional/insuficiente/C/ausência, carga atrasada/falha, filtros, dois temas, 320/768/1280 e zoom CSS/nativo 200%. Revisões independentes de padrões e spec sem bloqueios após correções.
- Reutilizados os cartões, séries e textos editoriais existentes, para todos os municípios e seis Tipos. Nenhuma mudança de pipeline ou JSON; HPV ausente conserva a mensagem de indisponibilidade. Leitura básica e links de Tipo continuam no HTML municipal com o shell do dashboard.
- Custos de saída e carga incremental registrados nos tickets 25/38. Lista na área do mapa, índice sob demanda, estado/URLs e verificação da hospedagem continuam no ticket 38; não houve publicação nem aprovação do excesso de orçamento.
