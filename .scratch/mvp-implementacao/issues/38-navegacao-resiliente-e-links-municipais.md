# 38: Preservar lista, links municipais e consulta sem JavaScript no dashboard

**What to build:** Adaptar estado e alternativas resilientes à consulta integrada A. Reaproveitar as entregas resolvidas 09, 32 e 33; a mudança é a posição da lista e o destino integrado, sem refazer a independência já conquistada.

**Blocked by:** 36 — Console horizontal; 37 — Consulta municipal integrada.

**Status:** resolved

## Referências

- [Decisão e proposta — ticket 35](35-prototipo-dashboard-de-observabilidade.md), alternativa A aprovada em 2026-11-04.
- [Spec de UI/UX](../../ui-ux-v1/spec.md) e [handoff aprovado](../../ui-ux-v1/observability-handoff.md).
- Fonte primária: branch `prototype/35-observability-dashboard`, commit `86a8d87`; variante A. Não promover o código descartável.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–12 e 15; [glossário](../../../GLOSSARY.md).

## Critérios de aceite

- [x] “Explorar em lista” troca mapa por lista na mesma área, com alternância “Mapa | Lista”; manter filtros, seleção e resultado ao alternar, sem tabela/índice permanente abaixo do mapa
- [x] Busca/lista inicializam sem aguardar malha/WebGL; falha/demora do mapa não bloqueia consulta, com carregamento, falha e nova tentativa próprios dos dados
- [x] Lista mantém valores/classes/períodos/origens/qualidade/notas e restrições de modos existentes, com alternativa textual que não depende apenas de cor
- [x] Estado compartilhável preserva seleção, indicador, Tipo, modo permitido, tema e visualização pertinentes; conferir links diretos, correção de valores inválidos e Voltar/Avançar sem dados obsoletos
- [x] Registrar convenção final de URL: preferir reaproveitar /municipio/<slug>/ como documento estático do dashboard com seleção; se houver nova canônica, manter rotas antigas com redirect HTTP ou mesmo HTML selecionado, jamais apenas redirect JavaScript
- [x] Sem JavaScript, HTML do dashboard selecionado contém quatro Eixos, indicadores, Ações, ressalvas, fontes e links nativos dos seis Tipos; query string sozinha não substitui seleção estática, preservar âncoras antigas e acesso à Metodologia
- [x] Índice estático por UF acessível em expansão sob demanda, sem interferir na visualização principal; links antigos e novos permitem consulta sem mapa e sem JavaScript
- [x] Reusar shell/componentes, medir custo de geração e tamanho/transferência, evitar duplicar mapa/JSON por município e registrar excessos ao orçamento no ticket 25 sem aprová-los silenciosamente
- [x] Verificar teclado/foco/anúncios, recuperação de falhas, links e histórico, com/sem JavaScript e WebGL indisponível, nos dois temas a 320/768/1280 px e zoom 200%; checagem/build e regressões passam

## Limites

Não alterar pipeline, JSON publicados, método, classes, Referência, cascata ou textos clínicos para acomodar o desenho. Aprovação visual não autoriza publicação nem equivale a auditoria de acessibilidade ou revisão clínica.

## Comments

- Criado no handoff do ticket 35 após escolha humana da alternativa A. Entregas anteriores permanecem resolvidas; implementar somente a mudança de composição e comportamento descrita aqui.

### Integração entregue no ticket 37 — 2026-11-04

- Os caminhos `/municipio/<slug>/` já renderizam `MapExperience` com `MunicipalityProfile` no HTML; sem redirecionamento JavaScript. O painel aprimorado carrega o JSON da UF e extrai o perfil do documento municipal, reutilizando os cartões Astro, sem uma segunda implementação editorial no cliente. Entrada por documento selecionado reutiliza seu perfil no HTML.
- Para não repetir o índice nacional em 5.571 documentos, ele permanece apenas na inicial, com link nativo nos documentos selecionados. A convenção final de histórico/URL, Mapa/Lista, índice sob demanda e verificação da hospedagem continuam neste ticket.
- [Validação e medição de saída do ticket 37](../../ui-ux-v1/validation-37.md): 763.801.491 bytes de arquivos, aproximadamente 764 MiB em disco. O shell aumenta o HTML por município; JSON e malha não são duplicados. O excesso continua pendente, sem aprovação de orçamento ou publicação.

### Implementação e encerramento — 2026-11-04

- Convenção final: `/municipio/<código>-<nome>/` é o documento estático do dashboard selecionado. Seleção aprimorada usa o mesmo caminho; `?municipio=` antigo é convertido com JavaScript, sem ser alternativa à seleção estática. `visualizacao=lista` preserva a visualização; demais parâmetros, elegibilidade, âncoras e tema mantêm as regras existentes. Não são necessários redirects nem novas rotas no provedor; a prévia estática entrega os documentos selecionados diretamente.
- Mapa/Lista ocupam a mesma área; filtros e seleção são preservados. Índice por UF em expansão nativa na inicial, com links municipais e âncora acessíveis sem JavaScript. Busca, lista e consulta reutilizam os carregamentos independentes e novas tentativas existentes.
- [Registro completo de validação, revisões e custos](../../ui-ux-v1/validation-38.md): 40 testes do site, 34 testes de navegador na saída estática, check sem erros/avisos/hints e build integral passaram. Matriz claro/escuro × 320/768/1280, com/sem JavaScript, WebGL indisponível e zoom nativo 200%. Não equivale a auditoria com leitor de tela ou revisão clínica.
- Saída de 765.046.511 bytes; primeira visita estimada em 1.388.885 bytes gzip. Excessos registrados no ticket 25, sem aprovação nem publicação. Malha/JSON não são duplicados por município; o índice nacional permanece somente na inicial. Configuração remota do provedor não foi acessada.
- Commits que resolveram o ticket: `c6a1c7e` (`feat: preserve resilient dashboard navigation and municipal links`) e `b08f7ce` (`fix: keep the static index reachable from municipal dashboards`). O commit de encerramento reúne este status, critérios, registro de validação e atualização do orçamento no ticket 25.

### Revisão aprovada — 2026-11-05

O índice por UF passa para a página estática `/municipios/`, com expansões nativas, nomes completos das UFs e contagem de municípios. Dashboard inicial, documentos municipais e Metodologia apontam para ela. Esta decisão substitui a localização anterior na inicial; preserva consulta sem JavaScript e os caminhos municipais. A âncora antiga da inicial continua levando ao acesso para a nova página.

Validação da revisão: Astro check sem erros, avisos ou hints; build estático e 42 testes do site passaram, além do novo teste unitário de contexto da página de municípios. Os 22 cenários de navegador passaram (21 na rodada inicial e o cenário de recuperação repetido após corrigir sua expectativa de link), incluindo claro/escuro, 320/768/1280 px, com/sem JavaScript, zoom nativo 200% e navegação municipal com tema.

Posição final aprovada em 2026-11-05: acesso “Municípios por UF” na navegação principal compartilhada, entre “Mapa” e “Como calculamos”; removido o link abaixo do mapa. A âncora antiga aponta para o item de navegação nos dashboards.
